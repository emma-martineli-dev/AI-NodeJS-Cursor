# Skill: observability-check

**Trigger:** "check observability" | "observability audit" | "audit [service]" | run after any service edit

This is the most important skill. Run it on every service file before marking work complete.
It checks all three pillars: **logs → metrics → errors**.

---

## How to run this skill

1. Read the target service file(s) in `signal-lab/apps/api/src/**/*.service.ts`
2. Skip infrastructure services: `prisma.service.ts`, `metrics.service.ts`, `app.service.ts`
3. For each service, run the three checks below
4. Output the audit report
5. If anything fails, apply the auto-fix

---

## Check 1 — Logs exist and are structured

**PASS conditions (all must be true):**
- `this.logger` is declared: `private readonly logger = new Logger(...)`
- At least one `this.logger.log({` call exists (object, not string)
- The object contains an `event:` field
- A `this.logger.error({` call exists inside a `catch` block with an `event:` field

**FAIL examples:**
```ts
// ❌ plain string — FAIL
this.logger.log('scenario started');

// ❌ object without event field — FAIL
this.logger.log({ scenario: name, runId: id });

// ❌ no logger at all — FAIL
async create(dto) {
  return this.prisma.scenarioRun.create({ data: dto });
}
```

**PASS example:**
```ts
// ✅
this.logger.log({ event: 'scenario_started', scenario: name, runId: run.id });
this.logger.log({ event: 'scenario_completed', scenario: name, metric });
this.logger.error({ event: 'scenario_failed', scenario: name, error: message });
```

---

## Check 2 — Metrics are emitted

**PASS conditions (all must be true):**
- `MetricsService` is injected in the constructor
- `.inc(` or `.startTimer(` is called on the success path
- `.inc(` is called in the `catch` block (failure path must also be counted)

**FAIL examples:**
```ts
// ❌ MetricsService not injected — FAIL
constructor(private readonly prisma: PrismaService) {}

// ❌ counter only on success, not failure — FAIL
try {
  this.metrics.scenarioCounter.inc({ status: 'completed' });
} catch (err) {
  // no metric here — failure goes uncounted
}
```

**PASS example:**
```ts
// ✅
const end = this.metrics.scenarioDuration.startTimer({ scenario: name });
try {
  this.metrics.scenarioCounter.inc({ scenario: name, status: 'completed' });
  end();
} catch (err) {
  this.metrics.scenarioCounter.inc({ scenario: name, status: 'failed' });
  end();
  throw err;
}
```

---

## Check 3 — Errors are tracked in Sentry

**PASS conditions (all must be true):**
- `import * as Sentry from '@sentry/node'` is present
- `Sentry.captureException(err,` is called inside every `catch` block that handles real errors
- The call includes `{ tags: { ... } }` — bare `captureException(err)` is a FAIL

**FAIL examples:**
```ts
// ❌ no Sentry call — FAIL
} catch (err) {
  this.logger.error({ event: 'failed', error: err.message });
}

// ❌ no tags — FAIL (unfilterable in Sentry dashboard)
Sentry.captureException(err);
```

**PASS example:**
```ts
// ✅
} catch (err) {
  Sentry.captureException(err, {
    tags: { scenario: name },
    extra: { runId: run.id },
  });
}
```

---

## Output format

Print this exact format for each service audited:

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Observability audit — scenarios.service.ts
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

  ✅ Logs     — 3 structured logger calls with event field
  ❌ Metrics  — MetricsService not injected
  ✅ Errors   — Sentry.captureException with tags in catch block

  Result: FAIL (1/3 pillars missing)

  Fix required:
    → Run skill: add-metric
    → Inject MetricsService, add counter.inc() on success + failure paths
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

If all pass:
```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Observability audit — scenarios.service.ts
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

  ✅ Logs     — 4 structured logger calls with event field
  ✅ Metrics  — counter on success + failure, histogram timer
  ✅ Errors   — Sentry.captureException with tags in catch block

  Result: PASS (3/3 pillars present)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

---

## Auto-fix map

| Failing check | Action |
|---------------|--------|
| Logs missing  | Add `private readonly logger = new Logger(...)` and structured log calls |
| Logs are strings | Replace `logger.log('...')` with `logger.log({ event: '...', ... })` |
| Metrics missing | Run `add-metric` skill |
| Metrics on success only | Add `this.metrics.[counter].inc({ ..., status: 'failed' })` to catch block |
| Sentry missing | Add `import * as Sentry` and `Sentry.captureException(err, { tags })` to catch |
| Sentry has no tags | Add `{ tags: { [domain]: value }, extra: { ... } }` as second argument |

---

## Run on all services at once

When asked for a full audit, read every file matching:
`signal-lab/apps/api/src/**/*.service.ts`

Exclude: `prisma.service.ts`, `metrics.service.ts`

Print one audit block per file, then a summary:

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Full audit summary
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  scenarios.service.ts   PASS  3/3
  alerts.service.ts      FAIL  2/3  (missing: metrics)

  Overall: FAIL — 1 service needs fixes
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```
