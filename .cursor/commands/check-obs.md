# /check-obs

Audit all backend services for observability completeness. Reports PASS/FAIL per service and per pillar.

## Usage
```
/check-obs
/check-obs [service-name]   # audit single service
```

## Agent instructions

### 1. Find target files
If no service name given: find all `*.service.ts` in `signal-lab/apps/backend/src/`.
Skip: `prisma.service.ts`, `metrics.service.ts`, `app.service.ts`.

If service name given: read only `signal-lab/apps/backend/src/[name]/[name].service.ts`.

### 2. For each file, check 3 pillars

**Pillar 1 — Logs**
PASS if ALL true:
- `private readonly logger = new Logger(...)` declared
- At least one `this.logger.log({` with `event:` field
- At least one `this.logger.error({` with `event:` field in a catch block

**Pillar 2 — Metrics**
PASS if ALL true:
- `MetricsService` in constructor parameters
- `.inc(` called on success path
- `.inc(` called in catch block
- `.startTimer(` or `.observe(` present

**Pillar 3 — Sentry**
PASS if ALL true:
- `import * as Sentry from '@sentry/node'` present
- `Sentry.captureException(err,` in catch block
- Second argument includes `{ tags:` (not bare captureException)

### 3. Live probes (if API is running)
```bash
curl -s http://localhost:3001/api/health | jq .status
curl -s http://localhost:3001/api/metrics | grep -c '_total'
```

### 4. Output format

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
/check-obs — Signal Lab observability audit
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

scenarios.service.ts
  ✅ Logs     — 4 structured calls with event field
  ✅ Metrics  — counter + histogram, both paths
  ✅ Errors   — Sentry.captureException with tags
  Result: PASS 3/3

[other services]

Live probes
  ✅ /api/health  — ok
  ✅ /api/metrics — 3 metric families registered

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Overall: PASS — all services instrumented
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

### 5. Auto-fix on failure

| Missing | Fix |
|---------|-----|
| Logger not declared | Add `private readonly logger = new Logger(ClassName.name)` |
| Log is plain string | Replace with `{ event: '...', ...context }` |
| MetricsService missing | Run `/add-endpoint` or `observability` skill |
| Counter only on success | Add `.inc({ ..., status: 'failed' })` to catch |
| No Sentry | Add `import * as Sentry` + `captureException(err, { tags })` |
| Sentry has no tags | Add `{ tags: { domain: '...' }, extra: { ... } }` |
