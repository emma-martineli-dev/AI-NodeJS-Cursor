# Signal Lab — AI Layer (PRD 003)

This directory makes the repository self-describing for a new Cursor chat.
A new agent can continue development without manual onboarding.

---

## Rules (`rules/`)

Five files, each with a single clear scope. No conflicts between them.

| File | What it fixes |
|------|--------------|
| `stack-constraints.mdc` | Approved/forbidden libraries. Prevents Redux, SWR, MUI, Formik, TypeORM from being introduced. |
| `nestjs-patterns.mdc` | Controller/service/module/DTO layer rules. Prevents business logic in controllers, manual DI, untyped bodies. |
| `prisma-patterns.mdc` | Prisma-only DB access. Forbids `$queryRaw`, raw drivers, manual DDL, duplicate type interfaces. |
| `frontend-patterns.mdc` | TanStack Query for server state, RHF for forms, shadcn for UI, Tailwind for layout. Prevents `useEffect+fetch`, Formik, MUI, inline styles. |
| `observability-conventions.mdc` | Metric naming (`[domain]_[action]_[unit]`), log format (`{ event: 'snake_case' }`), when to send to Sentry. |
| `error-handling.mdc` | NestJS exception types, service catch block pattern, frontend error state handling. Prevents swallowed errors and raw Error throws. |

All rules have `alwaysApply: true` — loaded automatically in every chat.

---

## Custom Skills (`skills/`)

| File | When to use |
|------|-------------|
| `observability.md` | Adding metrics/logs/Sentry to any service method. Run after creating a new endpoint. |
| `nestjs-endpoint.md` | Scaffolding a complete NestJS feature slice (DTO + Service + Controller + Module + Prisma model). |
| `shadcn-form.md` | Adding a validated form with RHF + zod + shadcn components + TanStack Query mutation. |
| `orchestrator.md` | Breaking any multi-step task into ordered steps with context budgets and gates. The AI brain. |
| `marketplace.md` | Reference for all 6 marketplace skills and what custom skills fill in the gaps. |

---

## Commands (`commands/`)

| Command | What it does |
|---------|-------------|
| `/add-endpoint [resource]` | Scaffold complete NestJS endpoint with observability. Runs `nestjs-endpoint` + `observability` skills. |
| `/check-obs [service?]` | Audit all (or one) service for 3-pillar observability. Reports PASS/FAIL per pillar with auto-fix. |
| `/run-prd [prd]` | Execute a PRD through the orchestrator. Breaks into steps, gates each one, reports progress. |
| `/health-check` | Verify all Docker services respond. Runs `healthcheck.mjs` and reports per-service status. |

---

## Hooks (`hooks/`)

| Hook | Problem it solves | Trigger |
|------|------------------|---------|
| `after-schema-change` | Developers forget to run `prisma migrate dev` and `prisma generate` after editing the schema, causing runtime type mismatches. | `signal-lab/prisma/schema.prisma` saved |
| `after-new-endpoint` | New service/controller files are created without observability pillars, shipping invisible endpoints. | New `*.service.ts` or `*.controller.ts` created |

---

## Marketplace Skills

| Skill | Why it's here |
|-------|--------------|
| `nestjs-best-practices` | NestJS module/DI/pipe conventions |
| `prisma-orm` | Prisma query API, relations, migrations |
| `next-best-practices` | App Router, Server/Client components, metadata |
| `shadcn-ui` | Component API, variant system, copy-paste model |
| `tailwind-design-system` | Utility classes, CSS variables, responsive design |
| `docker-expert` | Multi-stage builds, health checks, hot reload volumes |

See `skills/marketplace.md` for the full coverage map and what custom skills add on top.

---

## Quick reference for a new chat

```
Stack:
  Frontend  → Next.js 14 App Router, shadcn/ui, Tailwind, TanStack Query, RHF
  Backend   → NestJS, TypeScript strict, Prisma, @nestjs/swagger
  Database  → PostgreSQL 16
  Infra     → Docker Compose (one command: docker compose up -d)

Key paths:
  Backend src  → signal-lab/apps/backend/src/
  Frontend src → signal-lab/apps/frontend/src/
  Prisma       → signal-lab/prisma/schema.prisma
  Docker       → docker-compose.yml (root) or signal-lab/docker-compose.yml

Start:
  docker compose up -d
  curl http://localhost:3001/api/health

Add a feature:
  /add-endpoint [resource]   → full backend slice
  /run-prd [prd-name]        → orchestrated multi-step implementation

Check health:
  /health-check
  /check-obs
```
