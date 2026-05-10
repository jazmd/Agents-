export type ExecutorRunStatus = "running" | "succeeded" | "failed";

export type ExecutorRun = {
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

export type ExecutorActivity = { runs: ExecutorRun[] };

export async function fetchExecutorActivity(signal?: AbortSignal): Promise<ExecutorActivity> {
  const res = await fetch("/api/executor/activity", { signal });
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(text || `executor activity failed (${res.status})`);
  }
  return (await res.json()) as ExecutorActivity;
}

export async function runExecutorSmokeTask(params?: { objective?: string; model?: string }): Promise<ExecutorRun> {
  const res = await fetch("/api/executor/smoke", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      objective: params?.objective,
      model: params?.model,
    }),
  });

  const text = await res.text().catch(() => "");
  if (!res.ok) {
    throw new Error(text || `executor smoke failed (${res.status})`);
  }
  return JSON.parse(text) as ExecutorRun;
}

