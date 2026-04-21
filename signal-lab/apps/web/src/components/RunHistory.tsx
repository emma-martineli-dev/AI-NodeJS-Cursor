"use client";

import { useQuery } from "@tanstack/react-query";
import { fetchRuns, ScenarioRun } from "@/lib/api";

const STATUS_ICON: Record<ScenarioRun["status"], string> = {
  running: "⏳",
  completed: "✅",
  failed: "❌",
};

export function RunHistory() {
  const { data, isLoading, isError } = useQuery({
    queryKey: ["runs"],
    queryFn: fetchRuns,
  });

  return (
    <section className="card">
      <h2>Run History</h2>

      {isLoading && <p className="muted">Loading…</p>}
      {isError && <p className="error">Failed to load runs.</p>}

      {data && data.length === 0 && (
        <p className="muted">No runs yet. Submit a scenario above.</p>
      )}

      {data && data.length > 0 && (
        <table className="table">
          <thead>
            <tr>
              <th>Status</th>
              <th>Name</th>
              <th>Metric</th>
              <th>Error</th>
              <th>Created</th>
            </tr>
          </thead>
          <tbody>
            {data.map((run) => (
              <tr key={run.id} className={`row--${run.status}`}>
                <td>{STATUS_ICON[run.status]} {run.status}</td>
                <td><code>{run.name}</code></td>
                <td>{run.metric ?? "—"}</td>
                <td className="error">{run.error ?? "—"}</td>
                <td className="muted">{new Date(run.createdAt).toLocaleString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </section>
  );
}
