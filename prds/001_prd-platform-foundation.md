# PRD 001 — Signal Lab: Platform Foundation

## Goal
Build the Signal Lab application skeleton: frontend, backend, database, container environment.
After this PRD you have a working starter project that launches with one command and has a minimal end-to-end flow.

## Expected structure
```
signal-lab/
├── apps/
│   ├── frontend/          # Next.js
│   └── backend/           # NestJS
├── prisma/
│   └── schema.prisma
├── docker-compose.yml     # full environment
├── .env.example
└── README.md
```

## Required stack
| Layer | Technology |
|-------|-----------|
| Frontend | Next.js (App Router), shadcn/ui, Tailwind CSS, TanStack Query, React Hook Form |
| Backend | NestJS, TypeScript strict |
| Database | PostgreSQL 16 via Prisma |
| Infra | Docker Compose — one command starts everything |

## Functional requirements

### F1. Docker Compose
- `docker compose up -d` starts: frontend, backend, PostgreSQL
- Frontend available at localhost:3000
- Backend available at localhost:3001
- PostgreSQL available at localhost:5432
- Containers use hot reload (volume mounts for source)
- `.env.example` contains all variables without secrets

### F2. Backend
- Health endpoint: `GET /api/health` → `{ "status": "ok", "timestamp": "..." }`
- Minimum one domain endpoint: `POST /api/scenarios/run` (stub that accepts body and returns 200 with ID)
- Global exception filter with correct HTTP codes
- Swagger at `/api/docs`

### F3. Frontend
- One working page with basic navigation
- Form via React Hook Form (even if stub)
- API request via TanStack Query (even if showing health status)
- shadcn/ui components: Button, Card, Input — minimum 3 uses
- Tailwind for layout

### F4. Database
Prisma schema with minimum one model:
```prisma
model ScenarioRun {
  id        String   @id @default(cuid())
  type      String
  status    String
  duration  Int?
  error     String?
  metadata  Json?
  createdAt DateTime @default(now())
}
```
Migration applied on start or via documented command.

### F5. Documentation
README.md:
- Prerequisites (Docker, Node)
- Start: `docker compose up -d`
- Verify: `curl localhost:3001/api/health`
- Stop: `docker compose down`

## Acceptance criteria
- `docker compose up -d` starts everything without errors
- `GET /api/health` returns 200
- Frontend opens in browser
- Prisma schema contains model and migration is applied
- All required frontend libraries are used
- README sufficient to start in 3 minutes
