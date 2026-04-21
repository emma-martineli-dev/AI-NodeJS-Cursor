# Signal Lab

Observability playground + AI-layer for Cursor.
Run scenarios, see metrics in Grafana, logs in Loki, errors in Sentry.

## Start

```bash
git clone https://github.com/emma-martineli-dev/AI-NodeJS-Cursor
cd AI-NodeJS-Cursor
docker compose up -d
```

| Service | URL |
|---------|-----|
| Frontend | http://localhost:3000 |
| Backend API | http://localhost:3001/api |
| Swagger | http://localhost:3001/api/docs |
| Prometheus | http://localhost:9090 |
| Grafana | http://localhost:3200 (admin/admin) |
| Loki | http://localhost:3100 |

## Verify

```bash
# Backend health
curl http://localhost:3001/api/health
# → {"status":"ok","timestamp":"..."}

# Run a scenario
curl -X POST http://localhost:3001/api/scenarios/run \
  -H "Content-Type: application/json" \
  -d '{"type":"load_test"}'

# Trigger an error
curl -X POST http://localhost:3001/api/scenarios/run \
  -H "Content-Type: application/json" \
  -d '{"type":"system_error"}'

# Check metrics
curl http://localhost:3001/api/metrics | grep scenario_runs_total
```

## Stop

```bash
docker compose down        # keep data
docker compose down -v     # delete volumes
```

## Stack

| Layer | Technology |
|-------|-----------|
| Frontend | Next.js 14, shadcn/ui, Tailwind CSS, TanStack Query, React Hook Form |
| Backend | NestJS, TypeScript strict, Prisma, Swagger |
| Database | PostgreSQL 16 |
| Metrics | Prometheus + prom-client |
| Logs | Structured JSON → Loki via Promtail |
| Errors | Sentry |
| Dashboards | Grafana (provisioned) |
| Infra | Docker Compose |

## Demo

See [DEMO.md](./DEMO.md) for the full 15-minute verification walkthrough.

## AI Layer

See [.cursor/README.md](./.cursor/README.md) for the complete AI layer documentation:
rules, skills, commands, hooks, and marketplace skills.

### Quick reference

```
# In a new Cursor chat:
/add-endpoint [resource]   → scaffold NestJS endpoint with observability
/check-obs                 → audit all services for logs/metrics/Sentry
/run-prd [prd-file]        → execute a PRD via orchestrator
/health-check              → verify all Docker services
```

## Project structure

```
.
├── docker-compose.yml              # root — one command starts everything
├── signal-lab/
│   ├── apps/
│   │   ├── backend/                # NestJS API (port 3001)
│   │   └── frontend/               # Next.js UI (port 3000)
│   ├── prisma/
│   │   ├── schema.prisma           # ScenarioRun model
│   │   └── migrations/             # applied on container start
│   └── infra/docker/
│       ├── prometheus/             # scrape config
│       ├── grafana/                # provisioned dashboard
│       └── promtail/               # log shipping to Loki
├── .cursor/
│   ├── README.md                   # AI layer docs
│   ├── rules/                      # 6 rule files (alwaysApply)
│   ├── skills/                     # custom skills + orchestrator
│   ├── commands/                   # /add-endpoint, /check-obs, etc.
│   └── hooks/                      # after-schema-change, after-new-endpoint
├── prds/                           # PRD 001-004
├── DEMO.md                         # 15-min verification walkthrough
├── RUBRIC.md                       # evaluation criteria
└── SUBMISSION_CHECKLIST.md         # filled submission checklist
```

## Scenarios

| Type | Behaviour |
|------|-----------|
| `load_test` | Random metric 0-100, status `completed` |
| `stress_test` | Random metric 0-100, status `completed` |
| `system_error` | Throws error, status `failed`, captured in Sentry |
| `slow_query` | Sleeps 500-2000ms, status `completed` |
| *(any other)* | Random metric, status `completed` |
