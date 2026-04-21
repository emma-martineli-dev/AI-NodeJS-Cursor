const BASE = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3001/api";

export interface ScenarioRun {
  id: string;
  name: string;
  status: "running" | "completed" | "failed";
  metric: number | null;
  log: string | null;
  error: string | null;
  createdAt: string;
}

export async function postScenario(name: string): Promise<ScenarioRun> {
  const res = await fetch(`${BASE}/scenarios`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ name }),
  });
  if (!res.ok) throw new Error(`POST /scenarios failed: ${res.status}`);
  return res.json();
}

export async function fetchRuns(): Promise<ScenarioRun[]> {
  const res = await fetch(`${BASE}/scenarios`);
  if (!res.ok) throw new Error(`GET /scenarios failed: ${res.status}`);
  return res.json();
}
