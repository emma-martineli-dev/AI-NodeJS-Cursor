# PRD 002 — Signal Lab: Observability Demo

## Goal
Make Signal Lab a real observability playground. When a user runs a scenario from the UI,
the result is visible in Grafana (metrics), Loki (logs), and Sentry (errors) within seconds.

## Functional requirements

### F1. Scenario execution
`POST /api/scenarios/run` executes a named scenario:

| Scenario name | Behaviour |
|--------------|-----------|
| `load_test` | Returns metric 0-100, status `completed` |
| `stress_test` | Returns metric 0-100, status `completed` |
| `system_error` | Throws `Error("Simulated failure")`, status `failed` |
| `slow_query` | Sleeps 500-2000ms, status `completed` |
| *(any other)* | Returns random metric, status `completed` |

Response:
```json
{
  "id": "cuid",
  "type": "load_test",
  "status": "completed",
  "metric": 73.42,
  "duration": 45,
  "error": null,
  "createdAt": "2026-04-22T..."
}
```

### F2. Metrics (Prometheus)
- Counter: `scenario_runs_total{type, status}` — incremented on every run
- Histogram: `scenario_duration_ms{type}` — records execution time
- Endpoint: `GET /api/metrics` returns Prometheus text format
- Prometheus scrapes `/api/metrics` every 15s

### F3. Structured logs (Loki)
Every run emits JSON logs:
```json
{ "event": "scenario_run_start",    "type": "load_test", "runId": "..." }
{ "event": "scenario_run_complete", "type": "load_test", "runId": "...", "durationMs": 45 }
{ "event": "scenario_run_failed",   "type": "system_error", "runId": "...", "error": "..." }
```
Promtail scrapes container stdout and ships to Loki.

### F4. Error tracking (Sentry)
- `Sentry.init({ dsn: process.env.SENTRY_DSN })` in `main.ts`
- `Sentry.captureException(err, { tags: { type }, extra: { runId } })` in catch block
- Only unexpected errors go to Sentry (not 404/400)

### F5. Grafana dashboard
Provisioned dashboard with:
- Timeseries: `scenario_runs_total` by type and status
- Timeseries: `scenario_duration_ms` p50/p95
- Logs panel: Loki query `{container="signal-lab-backend"} | json`
- Logs panel: failed runs `{container="signal-lab-backend"} | json | event="scenario_run_failed"`

### F6. Frontend
- "Run Scenario" form with type input + quick-fire buttons for each scenario type
- Run history table (TanStack Query, polls every 10s)
- Status indicators: ✅ completed, ❌ failed, ⏳ running
- Links to Grafana, Loki explore, Prometheus

## Acceptance criteria
- `POST /api/scenarios/run {"type":"system_error"}` → status `failed`, error populated
- `GET /api/metrics` → contains `scenario_runs_total`
- Loki has log entries with `event` field after running a scenario
- Sentry receives exception when `system_error` is run (if DSN configured)
- Grafana dashboard loads and shows data
