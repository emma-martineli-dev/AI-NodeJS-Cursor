# Hook: pre-commit

**When:** Before every `git commit`
**What:** Blocks commit if any service file is missing logs, metrics, or Sentry

## Install

```bash
cp .cursor/hooks/pre-commit.sh .git/hooks/pre-commit
chmod +x .git/hooks/pre-commit
```

## What it checks

For every `*.service.ts` in `signal-lab/apps/api/src/` (excluding `prisma`, `metrics`, `app`):

| Pillar | Check |
|--------|-------|
| Logs | `event:` field present in a `logger.log(` call |
| Metrics | `.inc(` or `.observe(` or `.startTimer(` present |
| Errors | `Sentry.captureException` present |

## Example output — blocked

```
Signal Lab — pre-commit observability check
────────────────────────────────────────────
  ✅ scenarios.service.ts
  ❌ alerts.service.ts — missing: metrics, sentry
────────────────────────────────────────────
  Commit blocked. Fix observability issues above.
  Run: check:observability for details and fixes.
```

## Example output — allowed

```
Signal Lab — pre-commit observability check
────────────────────────────────────────────
  ✅ scenarios.service.ts
  ✅ alerts.service.ts
────────────────────────────────────────────
  All checks passed. Proceeding with commit.
```

## Script location
`.cursor/hooks/pre-commit.sh`
