export type RufloSystemStatus = {
  initialized: boolean;
  running: boolean;
  swarm?: {
    id: string | null;
    topology?: string;
    agents?: { total: number; active: number; idle: number };
    health?: string;
    uptime?: number;
  };
  tasks?: {
    total: number;
    pending: number;
    running: number;
    completed: number;
    failed: number;
  };
  mcp?: { running: boolean; port: number | null; transport?: string };
  memory?: { entries: number; size: string; backend: string };
};

export type RufloSwarmStatus = {
  id: string;
  topology: string;
  status: string;
  objective: string;
  strategy: string;
  progress: number;
  hasActiveSwarm: boolean;
  agents?: { total: number; active: number; idle: number; completed?: number };
  tasks?: { total: number; completed: number; inProgress: number; pending: number };
};

export type RufloAgent = {
  id?: string;
  name?: string;
  type?: string;
  status?: string;
  currentTask?: string;
  [key: string]: unknown;
};

export type RufloTask = {
  id?: string;
  type?: string;
  status?: string;
  description?: string;
  assignedTo?: string | string[];
  [key: string]: unknown;
};

export type RufloPlugin = {
  id?: string;
  name?: string;
  version?: string;
  status?: string;
  type?: string;
  description?: string;
  [key: string]: unknown;
};

export type RufloActivity = {
  status: RufloSystemStatus;
  swarm: RufloSwarmStatus;
  agents: { agents: RufloAgent[]; total: number };
  tasks: { tasks: RufloTask[]; total: number };
  plugins: { plugins: RufloPlugin[]; total: number };
};

export async function fetchRufloActivity(signal?: AbortSignal): Promise<RufloActivity> {
  const res = await fetch("/api/ruflo/activity", { signal });
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(text || `ruflo activity failed (${res.status})`);
  }
  return (await res.json()) as RufloActivity;
}

