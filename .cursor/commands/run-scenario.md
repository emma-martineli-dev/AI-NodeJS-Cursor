# Command: run:scenario

**Trigger:** "run:scenario [name]" | "run scenario [name]" | "fire scenario [name]"

Fires `POST /api/scenarios`, validates the response, then tells you exactly where
to verify the result in Prometheus, Loki, and Sentry.

---

## Pre-flight

Check the API is reachable:
```bash
curl -s http://localhost:3001/api/health
# must return: {"status":"ok"}
```

If it fails, the API is not running. Tell the user to start it before proceeding.

---

## Execute

```bash
curl -s -X POST http://localhost:3001/api/scenarios \
  -H "Content-Type: application/json" \
  -d '{"name":"[name]"}' | jq .
```

---

## Validate response

### Success scenario (any name except `system_error`)
```json
{
  "id": "<uuid>",
  "name": "[name]",
  "status": "completed",
  "metric": 73.42,
  "log": "Scenario \"[name]\" executed successfully. Score: 73.42",
  "error": null,
  "createdAt": "2026-04-22T..."
}
```

Check: `status === "completed"` and `metric !== null` and `error === null`

### Failure scenario (`system_error`)
```json
{
  "id": "<uuid>",
  "name": "system_error",
  "status": "failed",
  "metric": null,
  "log": null,
  "error": "Simulated failure",
  "createdAt": "2026-04-22T..."
}
```

Check: `status === "failed"` and `error === "Simulated failure"`

### Unexpected response
If `status` is `"running"` — the DB update failed after execution.
If HTTP 400 — the DTO validation rejected the payload (name missing or empty).
If HTTP 500 — unhandled exception; check Sentry.

---

## Post-run verification

After a successful run, verify all three observability pillars captured it:

### 1. Prometheus — metric was recorded
```bash
curl -s http://localhost:3001/api/metrics \
  | grep 'scenario_runs_total{scenario="[name]"'
```
Expected: `scenario_runs_total{scenario="[name]",status="completed"} 1`

### 2. Loki — log was emitted
Open Grafana → Explore → Loki datasource, run:
```
{container="signal-lab-api"} | json | event=`scenario_run` | scenario=`[name]`
```
Expected: at least 1 log line with `event: scenario_run` and `metric` field.

### 3. Sentry — error was captured (failure only)
If `status === "failed"`:
- Open Sentry dashboard
- Filter by tag `scenario=[name]`
- Expected: 1 new event with message "Simulated failure"

---

## Output format

```
run:scenario [name]

  POST /api/scenarios {"name":"[name]"}

  ✅ Response   — status: completed, metric: 73.42
  ✅ Prometheus — scenario_runs_total{scenario="[name]",status="completed"} 1
  ⚠️  Loki       — could not verify (Loki not reachable at localhost:3100)
  —  Sentry     — skipped (scenario completed, no error expected)
```
