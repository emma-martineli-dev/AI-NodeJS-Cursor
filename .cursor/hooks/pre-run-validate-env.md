# Hook: pre-run-validate-env

**When:** Before `docker compose up` or `yarn dev`
**What:** Blocks startup if required env vars are missing or `.env` doesn't exist

## Install

Wire into `signal-lab/package.json`:

```json
"scripts": {
  "predev:api": "bash ../.cursor/hooks/pre-run-validate-env.sh",
  "dev:api": "yarn workspace @signal-lab/api start:dev"
}
```

Or run manually before compose:
```bash
bash .cursor/hooks/pre-run-validate-env.sh && \
  docker compose -f signal-lab/infra/docker/docker-compose.yml up -d
```

## Required vars (blocks if missing)

| Variable | Purpose |
|----------|---------|
| `DATABASE_URL` | Postgres connection for Prisma |
| `SHADOW_DATABASE_URL` | Prisma migrate shadow DB |

## Optional vars (warns, does not block)

| Variable | Purpose |
|----------|---------|
| `SENTRY_DSN` | Error tracking — safe to omit locally |
| `GRAFANA_PASSWORD` | Grafana admin password |
| `NEXT_PUBLIC_API_URL` | API base URL for Next.js |
| `PORT` | API port (defaults to 3001) |

## Example output — blocked

```
Signal Lab — environment validation
────────────────────────────────────────────
  Checking: .env

  ✅ REQUIRED  DATABASE_URL = postgres://...
  ❌ REQUIRED  SHADOW_DATABASE_URL — not set

  ⚠️  OPTIONAL  SENTRY_DSN — not set (non-blocking)

────────────────────────────────────────────
  Blocked. Set required variables in .env and retry.
```

## Script location
`.cursor/hooks/pre-run-validate-env.sh`
