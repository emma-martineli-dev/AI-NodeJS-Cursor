# Signal Lab — Demo Walkthrough

**Target time: 15 minutes**

---

## Prerequisites

- Docker Desktop running
- Ports free: 3000, 3001, 3100, 3200, 5432, 9090

---

## Step 1 — Start everything (2 min)

```bash
git clone https://github.com/emma-martineli-dev/AI-NodeJS-Cursor
cd AI-NodeJS-Cursor
cp signal-lab/.env.example .env   # optional — defaults work
docker compose up -d
```

Wait ~30 seconds for all containers to be healthy.

```bash
docker compose ps
# All services should show "running" or "healthy"
```

---

## Step 2 — Verify backend (1 min)

```bash
curl http://localhost:3001/api/health
# → {"status":"ok","timestamp":"2026-04-22T..."}

curl http://localhost:3001/api/docs
# → Swagger UI (open in browser: http://localhost:3001/api/docs)
```

---

## Step 3 — Open the UI (1 min)

Open **http://localhost:3000**

You should see:
- ⚡ Signal Lab header
- API Status card (green dot = connected)
- Run Scenario form
- Recent Runs table (empty)

---

## Step 4 — Run a successful scenario (2 min)

In the UI form, type `load_test` and click **Run**.

Or via curl:
```bash
curl -s -X POST http://localhost:3001/api/scenarios/run \
  -H "Content-Type: application/json" \
  -d '{"type":"load_test"}' | jq .
```

Expected response:
```json
{
  "id": "clxxx...",
  "type": "load_test",
  "status": "completed",
  "metric": 73.42,
  "duration": 45,
  "error": null
}
```

The Recent Runs table updates automatically.

---

## Step 5 — Trigger an error (1 min)

Click **"Run system_error"** button in the UI, or:

```bash
curl -s -X POST http://localhost:3001/api/scenarios/run \
  -H "Content-Type: application/json" \
  -d '{"type":"system_error"}' | jq .
```

Expected:
```json
{
  "status": "failed",
  "error": "Simulated failure"
}
```

---

## Step 6 — Check Prometheus metrics (1 min)

```bash
curl -s http://localhost:3001/api/metrics | grep scenario_runs_total
```

Expected output:
```
# HELP scenario_runs_total Total scenario runs
# TYPE scenario_runs_total counter
scenario_runs_total{type="load_test",status="completed"} 1
scenario_runs_total{type="system_error",status="failed"} 1
```

Or open **http://localhost:9090** → query `scenario_runs_total`

---

## Step 7 — Check logs in Loki (2 min)

```bash
# Check structured logs from the container
docker compose logs backend | grep '"event"'
```

Expected:
```
{"event":"scenario_run_start","type":"load_test","level":"info",...}
{"event":"scenario_run_complete","type":"load_test","durationMs":45,...}
{"event":"scenario_run_failed","type":"system_error","error":"Simulated failure",...}
```

Or open **http://localhost:3100** (Loki API) and query:
```
{container="signal-lab-backend"} | json
```

---

## Step 8 — Open Grafana dashboard (2 min)

Open **http://localhost:3200**
- Login: `admin` / `admin`
- Navigate to **Dashboards → Signal Lab**

You should see:
- **Scenario Metric Over Time** — timeseries of scenario_runs_total
- **Scenario Logs** — JSON log entries from Loki
- **Failed Scenarios** — filtered view of failed runs

Run a few more scenarios to see the graphs update.

---

## Step 9 — Verify Sentry (optional, 1 min)

If you have a Sentry DSN, add it to `.env`:
```
SENTRY_DSN=https://xxx@sentry.io/xxx
```

Restart backend: `docker compose restart backend`

Run `system_error` again → check your Sentry project for a new event tagged `type=system_error`.

---

## Step 10 — Verify AI layer (2 min)

Open a **new Cursor chat** in this repository.

The agent should automatically know the stack without being told. Test:

```
What stack does this project use?
```

Expected: Agent describes Next.js, NestJS, Prisma, TanStack Query, shadcn/ui, etc.
from the rules — without reading any source files.

```
/add-endpoint alert
```

Expected: Agent scaffolds a complete NestJS `alerts` module with observability.

```
/check-obs
```

Expected: Agent audits all services and reports PASS/FAIL per pillar.

---

## Stop

```bash
docker compose down        # stop containers, keep data
docker compose down -v     # stop containers, delete volumes
```

---

## Troubleshooting

| Issue | Fix |
|-------|-----|
| Port already in use | `docker compose down` then retry |
| Backend not starting | `docker compose logs backend` — check DB connection |
| Grafana shows no data | Wait 30s for Prometheus to scrape, then refresh |
| Loki shows no logs | Check `docker compose logs promtail` |
| Frontend blank | `docker compose logs frontend` — check Next.js build |
