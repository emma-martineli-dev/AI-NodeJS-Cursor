# /add-endpoint

Scaffold a complete NestJS endpoint with observability for a new resource.

## Usage
```
/add-endpoint [resource-name]
```
Example: `/add-endpoint alert`

## Agent instructions

You are adding a new backend resource. Follow these steps exactly.

### 1. Parse the resource name
- `[resource]` = camelCase singular input
- `[Resource]` = PascalCase
- `[resources]` = plural

### 2. Read context (minimal budget)
Read only:
- `signal-lab/apps/backend/src/app.module.ts`
- `signal-lab/prisma/schema.prisma`
- `signal-lab/apps/backend/src/scenarios/scenarios.service.ts` (reference)

### 3. Execute `nestjs-endpoint` skill
Follow every step of `.cursor/skills/nestjs-endpoint.md` for `[resource]`.

### 4. Execute `observability` skill
Verify the new service has all 3 pillars using `.cursor/skills/observability.md`.

### 5. Gate check
```bash
# API responds
curl -s -X POST http://localhost:3001/api/[resources] \
  -H "Content-Type: application/json" \
  -d '{"type":"test"}' | jq .status
# expected: "pending"

# Metrics registered
curl -s http://localhost:3001/api/metrics | grep [resource]_runs_total
# expected: metric line

# Swagger updated
open http://localhost:3001/api/docs
# expected: [resources] tag visible
```

### 6. Report
```
/add-endpoint [resource] — complete

  ✅ Prisma model + migration
  ✅ DTO + Service + Controller + Module
  ✅ AppModule updated
  ✅ Observability: logs ✓ metrics ✓ Sentry ✓
  ✅ Gate: POST /api/[resources] → 201
  ✅ Swagger: /api/docs updated
```
