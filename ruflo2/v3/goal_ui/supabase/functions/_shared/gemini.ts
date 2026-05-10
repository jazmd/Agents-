export type GeminiGenerateTextParams = {
  system: string;
  user: string;
  model?: string;
  temperature?: number;
  maxOutputTokens?: number;
  /**
   * When set to "application/json", Gemini will be asked to return strict JSON
   * (no markdown, no commentary). This significantly reduces JSON parse errors.
   */
  responseMimeType?: "application/json" | "text/plain";
};

function getGeminiApiKey(): string {
  // Prefer explicit GEMINI_API_KEY. Accept a few common aliases.
  const key =
    Deno.env.get("GEMINI_API_KEY") ||
    Deno.env.get("GOOGLE_API_KEY") ||
    Deno.env.get("GOOGLE_AI_API_KEY") ||
    Deno.env.get("GOOGLE_GENERATIVE_AI_API_KEY");

  if (!key) throw new Error("GEMINI_API_KEY is not configured");
  return key;
}

export function normalizeGeminiModel(model?: string): string {
  if (!model) return "gemini-2.5-flash";
  const raw = model.includes("/") ? model.split("/").pop()! : model;

  // The app sometimes passes "google/gemini-2.5-flash".
  const cleaned = raw.replace(/^google\//, "").trim();

  if (!cleaned) return "gemini-2.5-flash";
  if (cleaned.startsWith("gemini-")) return cleaned;

  // Fall back to a sane default.
  return "gemini-2.5-flash";
}

function extractTextFromGeminiResponse(payload: unknown): string {
  const data = payload as any;
  const parts = data?.candidates?.[0]?.content?.parts;
  if (Array.isArray(parts)) {
    const text = parts.map((p: any) => (typeof p?.text === "string" ? p.text : "")).join("");
    if (text.trim()) return text;
  }
  throw new Error("Gemini response did not include text content");
}

export async function geminiGenerateText(params: GeminiGenerateTextParams): Promise<string> {
  const apiKey = getGeminiApiKey();
  const model = normalizeGeminiModel(params.model);

  const url = `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(
    model,
  )}:generateContent?key=${encodeURIComponent(apiKey)}`;

  const bodyWithSystemInstruction = {
    systemInstruction: { role: "system", parts: [{ text: params.system }] },
    contents: [{ role: "user", parts: [{ text: params.user }] }],
    generationConfig: {
      temperature: params.temperature ?? 0.7,
      maxOutputTokens: params.maxOutputTokens ?? 4096,
      responseMimeType: params.responseMimeType ?? "application/json",
    },
  };

  const res1 = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(bodyWithSystemInstruction),
  });

  if (res1.ok) {
    const payload = await res1.json();
    return extractTextFromGeminiResponse(payload);
  }

  // Some environments reject `systemInstruction`. Retry by inlining system prompt.
  const errorText1 = await res1.text().catch(() => "");
  const bodyInlineSystem = {
    contents: [
      {
        role: "user",
        parts: [{ text: `SYSTEM:\n${params.system}\n\nUSER:\n${params.user}` }],
      },
    ],
    generationConfig: {
      temperature: params.temperature ?? 0.7,
      maxOutputTokens: params.maxOutputTokens ?? 4096,
      responseMimeType: params.responseMimeType ?? "application/json",
    },
  };

  const res2 = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(bodyInlineSystem),
  });

  if (!res2.ok) {
    const errorText2 = await res2.text().catch(() => "");
    throw new Error(
      `Gemini API error: ${res2.status} ${res2.statusText}${errorText2 ? ` — ${errorText2}` : ""}${
        errorText1 ? ` (first attempt: ${errorText1})` : ""
      }`,
    );
  }

  const payload2 = await res2.json();
  return extractTextFromGeminiResponse(payload2);
}

export function extractFirstJsonObject(text: string): unknown {
  const trimmed = text.trim();

  // 1) If the model returned strict JSON (e.g. via responseMimeType), parse directly.
  try {
    return JSON.parse(trimmed);
  } catch {
    // continue
  }

  // 2) Prefer fenced JSON blocks (can contain objects OR arrays).
  const fenced = trimmed.match(/```json\\s*([\\s\\S]*?)\\s*```/i);
  if (fenced?.[1]) return JSON.parse(fenced[1].trim());

  // 3) Extract the first JSON value (object or array) using bracket matching.
  const firstObject = trimmed.indexOf("{");
  const firstArray = trimmed.indexOf("[");
  const start =
    firstObject === -1 ? firstArray : firstArray === -1 ? firstObject : Math.min(firstObject, firstArray);
  if (start === -1) throw new Error("Could not find JSON in model output");

  const stack: Array<"{" | "["> = [];
  let inString = false;
  let escapeNext = false;

  for (let i = start; i < trimmed.length; i++) {
    const ch = trimmed[i];

    if (escapeNext) {
      escapeNext = false;
      continue;
    }

    if (inString) {
      if (ch === "\\\\") escapeNext = true;
      else if (ch === "\"") inString = false;
      continue;
    }

    if (ch === "\"") {
      inString = true;
      continue;
    }

    if (ch === "{" || ch === "[") {
      stack.push(ch as "{" | "[");
      continue;
    }

    if (ch === "}" || ch === "]") {
      const open = stack.pop();
      if (!open) continue;
      if (open === "{" && ch !== "}") continue;
      if (open === "[" && ch !== "]") continue;

      if (stack.length === 0) {
        const slice = trimmed.slice(start, i + 1);
        return JSON.parse(slice);
      }
    }
  }

  throw new Error("Could not find complete JSON value in model output");
}
