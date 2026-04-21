# /health-check

Verify the full Docker stack is running and all services respond correctly.

## Usage
```
/health-check
```

## Agent instructions

Run this script and report results:

```bash
node signal-lab/scripts/healthcheck.mjs
```

If Node is not available or the script fails, run individual checks:

```bash
# Backend
curl -s http://localhost:3001/api/health | jq .

# Frontend
curl -s -o /dev/null -w "%{http_code}" http://localhost:3000

# Prometheus
curl -s http://localhost:9090/-/healthy

# Grafana
curl -s http://localhost:3200/api/health | jq .

# Loki
curl -s http://localhost:3100/ready

# PostgreSQL (requires psql)
PGPASSWORD=signal psql -h localhost -U signal -d signal_lab -c "SELECT 1" -q
```

## Expected output — all healthy
```
  web            PASS  (http://localhost:3000)
  api            PASS  (http://localhost:3001/api/health)
  postgres       PASS  (localhost:5432/signal_lab)
  prometheus     PASS  (http://localhost:9090/-/healthy)
  grafana        PASS  (http://localhost:3200/api/health)
  loki           PASS  (http://localhost:3100/ready)

  Result: PASS — all services healthy
```

## If a service fails

| Service | Fix |
|---------|-----|
| api | `docker compose logs backend` — check for startup errors |
| postgres | `docker compose up -d postgres` — may need `db push` |
| frontend | `docker compose logs frontend` — check Next.js build errors |
| prometheus/grafana/loki | `docker compose up -d prometheus grafana loki` |

## After fixing
Re-run `/health-check` to confirm all services pass.
