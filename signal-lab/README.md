# Signal Lab

Scenario runner platform — PRD 001: Platform Foundation.

## Prerequisites

- [Docker Desktop](https://www.docker.com/products/docker-desktop/) 24+
- [Node.js](https://nodejs.org/) 20+ (for local development only)

## Start

```bash
cp .env.example .env
docker compose up -d
```

That's it. All three services start automatically:

| Service    | URL                              |
|------------|----------------------------------|
| Frontend   | http://localhost:3000            |
| Backend    | http://localhost:3001/api        |
| Swagger    | http://localhost:3001/api/docs   |
| PostgreSQL | localhost:5432                   |

The database migration runs automatically on backend startup.

## Verify

```bash
# Backend health
curl http://localhost:3001/api/health
# → {"status":"ok","timestamp":"..."}

# Run a scenario
curl -X POST http://localhost:3001/api/scenarios/run \
  -H "Content-Type: application/json" \
  -d '{"type":"load_test"}'
# → {"id":"...","status":"pending","createdAt":"..."}

# Frontend
open http://localhost:3000
```

## Stop

```bash
docker compose down
```

To also remove the database volume:
```bash
docker compose down -v
```

## Local development (without Docker)

```bash
# Start only PostgreSQL
docker compose up -d postgres

# Backend
cd apps/backend
npm install
npx prisma migrate dev --schema=../../prisma/schema.prisma
npm run start:dev

# Frontend (new terminal)
cd apps/frontend
npm install
npm run dev
```

## Structure

```
signal-lab/
├── apps/
│   ├── backend/          # NestJS — port 3001
│   └── frontend/         # Next.js — port 3000
├── prisma/
│   ├── schema.prisma     # Single source of truth for DB schema
│   └── migrations/       # Applied automatically on startup
├── docker-compose.yml    # One command to run everything
└── .env.example          # All variables, no secrets
```

## Stack

| Layer    | Technology                                      |
|----------|-------------------------------------------------|
| Frontend | Next.js 14, shadcn/ui, Tailwind, TanStack Query, React Hook Form |
| Backend  | NestJS, TypeScript strict, Swagger              |
| Database | PostgreSQL 16, Prisma ORM                       |
| Infra    | Docker Compose with hot reload                  |

## Logs

```bash
docker compose logs -f backend
docker compose logs -f frontend
docker compose logs -f postgres
```
