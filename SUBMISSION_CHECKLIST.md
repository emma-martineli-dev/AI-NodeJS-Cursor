# Signal Lab — Submission Checklist

Fill in this file before submitting. Be honest — reviewers will verify everything.

---

## Candidate info
- **Name:** Emma Martineli
- **GitHub repo:** https://github.com/emma-martineli-dev/AI-NodeJS-Cursor
- **Submission date:** 2026-04-22
- **Time spent:** ~8 hours

---

## 1. Engineering

### Docker Compose
- [x] `docker compose up -d` starts all services without errors
- [x] Frontend at localhost:3000
- [x] Backend at localhost:3001
- [x] PostgreSQL at localhost:5432
- [x] Hot reload via volume mounts
- [x] `.env.example` present with all variables

### Backend
- [x] `GET /api/health` → `{ "status": "ok", "timestamp": "..." }`
- [x] `POST /api/scenarios/run` accepts body and returns ID
- [x] Global exception filter (`AllExceptionsFilter`)
- [x] Swagger at `/api/docs`

### Frontend
- [x] Working page with navigation
- [x] React Hook Form form
- [x] TanStack Query API request
- [x] shadcn/ui: Button, Card, Input used
- [x] Tailwind layout

### Database
- [x] `ScenarioRun` model in Prisma schema
- [x] Migration applied on container start
- [x] All required fields: id, type, status, duration, error, metadata, createdAt

### Observability
- [x] `GET /api/metrics` returns Prometheus text format
- [x] Structured JSON logs with `event` field
- [x] Sentry integration (requires `SENTRY_DSN` env var)
- [x] Grafana dashboard provisioned
- [x] Loki receives logs via Promtail

---

## 2. AI Layer

### Rules
- [x] `stack-constraints.mdc` — approved/forbidden libraries
- [x] `nestjs-patterns.mdc` — controller/service/module/DTO rules
- [x] `prisma-patterns.mdc` — Prisma-only, no raw SQL
- [x] `frontend-patterns.mdc` — TanStack/RHF/shadcn/Tailwind
- [x] `observability-conventions.mdc` — metric naming, log format, Sentry rules
- [x] `error-handling.mdc` — NestJS exceptions, catch pattern, frontend errors

### Custom Skills
- [x] `observability.md` — 3-pillar instrumentation with checklist
- [x] `nestjs-endpoint.md` — full feature slice scaffold
- [x] `shadcn-form.md` — RHF + zod + shadcn form
- [x] `orchestrator.md` — context economy AI brain
- [x] All skills have frontmatter (name, description)
- [x] All skills have "When to Use" section

### Commands
- [x] `/add-endpoint` — scaffold NestJS endpoint with observability
- [x] `/check-obs` — audit observability pillars
- [x] `/run-prd` — orchestrated PRD execution
- [x] `/health-check` — verify docker stack

### Hooks
- [x] `after-schema-change.json` — triggers on schema.prisma edit
- [x] `after-new-endpoint.json` — triggers on new service/controller creation
- [x] Both hooks have `.md` files explaining the problem they solve

### Marketplace Skills
- [x] `nestjs-best-practices`
- [x] `prisma-orm`
- [x] `next-best-practices`
- [x] `shadcn-ui`
- [x] `tailwind-design-system`
- [x] `docker-expert`
- [x] Gap analysis documented in `skills/marketplace.md`

---

## 3. Orchestrator

- [x] `SKILL.md` — 7 phases with model assignment and context budgets
- [x] `COORDINATION.md` — exact prompts for all 7 subagent types
- [x] `EXAMPLE.md` — full PRD 002 walkthrough with context.json at each phase
- [x] Resume logic in Step 0
- [x] Task decomposition with `model: fast|default` field
- [x] 80%+ tasks marked as `fast` in example
- [x] Token budget breakdown showing ~15k main chat / ~36k total

---

## 4. Documentation

- [x] `README.md` — start in 3 minutes
- [x] `DEMO.md` — step-by-step demo walkthrough
- [x] `.cursor/README.md` — AI layer documentation
- [x] PRD files in `prds/`

---

## Bonus scenario
- [x] `chaos_monkey` scenario implemented — random failure (~50%) + random delay (0-1000ms)
- [x] Grafana panel shows chaos_monkey success rate gauge
- [x] Identified from PRD hint: "attentive readers may find a fifth" in ScenarioRun.type comment

- Prisma `migrate dev` has a known issue with the local Prisma Postgres server (P1017 shadow DB connection). Workaround: `npx prisma db push` works correctly. The Docker Compose setup uses `prisma migrate deploy` which applies existing migration files without needing a shadow DB.
- Sentry integration requires a real `SENTRY_DSN` to verify in the dashboard. The integration code is complete; set `SENTRY_DSN` in `.env` to activate.
- Grafana dashboard is provisioned via JSON file. If the Loki datasource UID differs in your environment, update `signal-lab/infra/docker/grafana/provisioning/dashboards/signal-lab.json`.

---

## Demo path (15 minutes)

See `DEMO.md` for the complete step-by-step verification walkthrough.
