# Command: check:observability

**Trigger:** "check:observability" | "observability audit" | "check all services"

Full observability audit: static analysis of all service files + live endpoint probes.

---

## Step 1 — Static analysis

Read every file matching `signal-lab/apps/api/src/**/*.service.ts`.

Skip: `prisma.service.ts`, `metrics.service.ts`

For each file, run the `observability-check` skill (all 3 checks: logs, metrics, errors).
Collect results.

---

## Step 2 — Live endpoint probes

Run these checks against the running API:

### Probe A — metrics endpoint
```bash
curl -s http://localhost:3001/api/metrics | grep scenario_runs_total
```
PASS: line containing `scenario_runs_total` found
FAIL: empty response or connection refused

### Probe B — Loki has recent logs
```bash
curl -s "http://localhost:3100/loki/api/v1/query_range" \
  --data-urlencode 'query={container="signal-lab-api"}' \
  --data-urlencode "start=$(date -d '5 minutes ago' +%s)000000000" \
  --data-urlencode "end=$(date +%s)000000000" \
  | jq '.data.result | length'
```
PASS: result length > 0
FAIL: 0 results or connection refused

### Probe C — API health
```bash
curl -s http://localhost:3001/api/health | jq -r .status
```
PASS: `ok`
FAIL: anything else or connection refused

---

## Step 3 — Report

Print this exact format:

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
check:observability — 2026-04-22
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Static analysis
───────────────
  scenarios.service.ts
    ✅ Logs     — 4 structured calls with event field
    ✅ Metrics  — counter on success + failure, histogram timer
    ✅ Errors   — Sentry.captureException with tags

  [other services listed here]

Live probes
───────────
  ✅ /api/metrics   — scenario_runs_total found
  ✅ Loki           — 8 log entries in last 5m
  ✅ /api/health    — ok

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Result: PASS — all services instrumented, all probes healthy
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

If anything fails:
```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Result: FAIL

  Fixes required:
    → alerts.service.ts: missing Prometheus counter — run add-metric skill
    → Loki probe failed: Loki container not running — docker compose up loki
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

---

## Auto-fix on failure

| Failure | Action |
|---------|--------|
| Service missing logs | Add structured logger calls (see `observability.mdc`) |
| Service missing metrics | Run `add-metric` skill on that service |
| Service missing Sentry | Add `Sentry.captureException(err, { tags })` to catch block |
| `/api/metrics` empty | Check `MetricsModule` is in AppModule imports |
| Loki probe fails | Run `docker compose up -d loki promtail` |
| API health fails | Run `docker compose up -d api` or `yarn dev:api` |
