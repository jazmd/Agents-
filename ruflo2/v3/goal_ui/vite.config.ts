import { defineConfig, loadEnv } from "vite";
import type { LibraryFormats } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { execFile } from "child_process";
import fs from "fs/promises";
import crypto from "crypto";

function rufloApiPlugin() {
  const repoRoot = path.resolve(__dirname, "..", "..");

  const runRuflo = async (args: string[]) => {
    return await new Promise<{ stdout: string; stderr: string }>((resolve, reject) => {
      execFile(
        "ruflo",
        args,
        {
          cwd: repoRoot,
          timeout: 15_000,
          maxBuffer: 10 * 1024 * 1024,
        },
        (err, stdout, stderr) => {
          if (err) {
            const message = stderr?.toString?.().trim() || err.message;
            reject(new Error(message));
            return;
          }
          resolve({ stdout: String(stdout), stderr: String(stderr) });
        },
      );
    });
  };

  const json = (res: any, status: number, body: any) => {
    res.statusCode = status;
    res.setHeader("Content-Type", "application/json; charset=utf-8");
    res.end(JSON.stringify(body));
  };

  return {
    name: "ruflo-api",
    configureServer(server: any) {
      server.middlewares.use(async (req: any, res: any, next: any) => {
        try {
          if (!req?.url?.startsWith("/api/ruflo/")) return next();
          if (req.method !== "GET") return json(res, 405, { error: "Method not allowed" });

          if (req.url === "/api/ruflo/status") {
            const { stdout } = await runRuflo(["status", "--format", "json"]);
            return json(res, 200, JSON.parse(stdout));
          }

          if (req.url === "/api/ruflo/swarm/status") {
            const { stdout } = await runRuflo(["swarm", "status", "--format", "json"]);
            return json(res, 200, JSON.parse(stdout));
          }

          if (req.url === "/api/ruflo/agents") {
            const { stdout } = await runRuflo(["agent", "list", "--format", "json"]);
            return json(res, 200, JSON.parse(stdout));
          }

          if (req.url === "/api/ruflo/tasks") {
            const { stdout } = await runRuflo(["task", "list", "--format", "json"]);
            return json(res, 200, JSON.parse(stdout));
          }

          if (req.url === "/api/ruflo/activity") {
            const [status, swarm, agents, tasks] = await Promise.all([
              runRuflo(["status", "--format", "json"]).then((r) => JSON.parse(r.stdout)),
              runRuflo(["swarm", "status", "--format", "json"]).then((r) => JSON.parse(r.stdout)),
              runRuflo(["agent", "list", "--format", "json"]).then((r) => JSON.parse(r.stdout)),
              runRuflo(["task", "list", "--format", "json"]).then((r) => JSON.parse(r.stdout)),
            ]);
            return json(res, 200, { status, swarm, agents, tasks });
          }

          return json(res, 404, { error: "Unknown endpoint" });
        } catch (error: any) {
          return json(res, 503, { error: error?.message || "Failed to query ruflo" });
        }
      });
    },
  };
}

function executorApiPlugin() {
  const appRoot = __dirname;

  type ExecutorRunStatus = "running" | "succeeded" | "failed";
  type ExecutorRun = {
    id: string;
    objective: string;
    status: ExecutorRunStatus;
    startedAt: string;
    finishedAt?: string;
    model?: string;
    summary?: string;
    filesChanged?: string[];
    error?: string;
  };

  let runs: ExecutorRun[] = [];

  const json = (res: any, status: number, body: any) => {
    res.statusCode = status;
    res.setHeader("Content-Type", "application/json; charset=utf-8");
    res.end(JSON.stringify(body));
  };

  const readJsonBody = async (req: any) => {
    const chunks: Buffer[] = [];
    await new Promise<void>((resolve, reject) => {
      req.on("data", (c: Buffer) => chunks.push(c));
      req.on("end", () => resolve());
      req.on("error", (e: any) => reject(e));
    });
    if (chunks.length === 0) return {};
    const text = Buffer.concat(chunks).toString("utf8").trim();
    if (!text) return {};
    try {
      return JSON.parse(text);
    } catch {
      throw new Error("Invalid JSON body");
    }
  };

  const extractJson = (text: string) => {
    const trimmed = (text || "").trim();
    if (!trimmed) throw new Error("Empty Gemini response");
    try {
      return JSON.parse(trimmed);
    } catch {
      // ignore
    }

    const fenced = trimmed.match(/```(?:json)?\s*([\s\S]*?)\s*```/i);
    if (fenced?.[1]) {
      try {
        return JSON.parse(fenced[1].trim());
      } catch {
        // ignore
      }
    }

    const first = trimmed.indexOf("{");
    const last = trimmed.lastIndexOf("}");
    if (first !== -1 && last !== -1 && last > first) {
      const slice = trimmed.slice(first, last + 1);
      return JSON.parse(slice);
    }

    throw new Error("Failed to parse Gemini JSON response");
  };

  const callGemini = async (opts: { model: string; apiKey: string; prompt: string }) => {
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(opts.model)}:generateContent?key=${encodeURIComponent(opts.apiKey)}`;
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ role: "user", parts: [{ text: opts.prompt }] }],
        generationConfig: {
          temperature: 0,
          responseMimeType: "application/json",
        },
      }),
    });

    const raw = await res.text().catch(() => "");
    if (!res.ok) {
      throw new Error(raw || `Gemini API error (${res.status})`);
    }
    const data = JSON.parse(raw) as any;
    const outText = data?.candidates?.[0]?.content?.parts?.[0]?.text;
    if (typeof outText !== "string") {
      throw new Error("Gemini returned no text");
    }
    return outText;
  };

  const updateRun = (id: string, patch: Partial<ExecutorRun>) => {
    runs = runs.map((r) => (r.id === id ? { ...r, ...patch } : r));
  };

  const pushRun = (run: ExecutorRun) => {
    runs = [run, ...runs].slice(0, 20);
  };

  const runSmoke = async (objective: string, model: string) => {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      throw new Error("Missing GEMINI_API_KEY. Put it in v3/goal_ui/.env.local (no VITE_ prefix) then restart pnpm dev.");
    }

    const runId = `exec-${crypto.randomBytes(6).toString("hex")}`;
    const startedAt = new Date().toISOString();
    pushRun({ id: runId, objective, status: "running", startedAt, model });

    try {
      const prompt = [
        "Return ONLY valid JSON. No markdown.",
        "Create an edit that updates exactly one file: src/lib/executorProof.ts",
        'The file must export two named constants: executorProof (string) and executorProofUpdatedAt (ISO string).',
        `Set executorProof to: "OK - ${runId}"`,
        `Set executorProofUpdatedAt to: "${startedAt}"`,
        'Your JSON must be: {"files":[{"path":"src/lib/executorProof.ts","content":"..."}],"summary":"..."}',
        "Do not include any other files or keys.",
      ].join("\n");

      const geminiText = await callGemini({ model, apiKey, prompt });
      const plan = extractJson(geminiText) as any;

      const file = plan?.files?.[0];
      if (!file || file.path !== "src/lib/executorProof.ts" || typeof file.content !== "string") {
        throw new Error("Gemini returned an invalid file plan");
      }

      const abs = path.resolve(appRoot, file.path);
      const allowed = path.resolve(appRoot, "src", "lib", "executorProof.ts");
      if (abs !== allowed) {
        throw new Error("Refusing to write outside allowed file");
      }

      await fs.writeFile(abs, file.content, "utf8");

      updateRun(runId, {
        status: "succeeded",
        finishedAt: new Date().toISOString(),
        summary: typeof plan.summary === "string" ? plan.summary : "Updated executorProof.ts via Gemini",
        filesChanged: [file.path],
      });

      return runs.find((r) => r.id === runId)!;
    } catch (error: any) {
      updateRun(runId, {
        status: "failed",
        finishedAt: new Date().toISOString(),
        error: error?.message || "Executor failed",
      });
      throw error;
    }
  };

  return {
    name: "executor-api",
    configureServer(server: any) {
      server.middlewares.use(async (req: any, res: any, next: any) => {
        try {
          if (!req?.url?.startsWith("/api/executor/")) return next();

          if (req.method === "GET" && req.url === "/api/executor/activity") {
            return json(res, 200, { runs });
          }

          if (req.method === "POST" && req.url === "/api/executor/smoke") {
            const body = await readJsonBody(req);
            const objective =
              typeof body?.objective === "string" && body.objective.trim()
                ? body.objective.trim()
                : "Smoke test: update src/lib/executorProof.ts using Gemini JSON mode";
            const model =
              typeof body?.model === "string" && body.model.trim()
                ? body.model.trim()
                : process.env.GEMINI_MODEL || "gemini-2.5-flash";

            const result = await runSmoke(objective, model);
            return json(res, 200, result);
          }

          return json(res, 404, { error: "Unknown endpoint" });
        } catch (error: any) {
          return json(res, 503, { error: error?.message || "Executor failed" });
        }
      });
    },
  };
}

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, __dirname, "");
  Object.assign(process.env, env);
  const isWidgetBuild = process.env.BUILD_WIDGET === 'true';

  if (isWidgetBuild) {
    // Widget-specific build configuration
    return {
      plugins: [react()],
      resolve: {
        alias: {
          "@": path.resolve(__dirname, "./src"),
        },
      },
      define: {
        // Define browser-compatible globals
        'process.env.NODE_ENV': JSON.stringify('production'),
        'process.env': '{}',
        'global': 'window',
      },
      build: {
        lib: {
          entry: path.resolve(__dirname, "src/widget.tsx"),
          name: "RufloResearchWidget",
          formats: ["iife"] as LibraryFormats[],
          fileName: () => "widget.js",
        },
        rollupOptions: {
          output: {
            inlineDynamicImports: true,
            assetFileNames: "widget.[ext]",
            // Ensure all external dependencies are bundled for standalone widget
            manualChunks: undefined,
          },
        },
        // Don't externalize any dependencies - bundle everything
        commonjsOptions: {
          include: [/node_modules/],
        },
        outDir: "dist",
        emptyOutDir: false,
        // Increase chunk size warning limit for widget bundle
        chunkSizeWarningLimit: 1000,
      },
      // CORS configuration for dev server
      server: {
        cors: true,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type',
        },
      },
    };
  }

  // Main app build configuration
  return {
    server: {
      host: "::",
      port: 8080,
    },
    plugins: [react(), rufloApiPlugin(), executorApiPlugin()],
    resolve: {
      alias: {
        "@": path.resolve(__dirname, "./src"),
      },
    },
  };
});
