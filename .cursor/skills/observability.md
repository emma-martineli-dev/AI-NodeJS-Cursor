---
name: observability
description: Add structured logs, Prometheus metrics, and Sentry error tracking to a NestJS service method.
version: 1.0.0
---

# Skill: observability

## When to Use
- You just created a new NestJS service method
- You added a new endpoint and need to instrument it
- `check-obs` command reports a missing pillar
- Pre-commit hook blocks because a service lacks observability

## What this skill produces
For any service method, adds all three pillars:
1. Structured JSON logs with `event` field (→ Loki)
2. Prometheus counter + histogram (→ Grafana)
3. Sentry exception capture with tags (→ Sentry dashboard)

---

## Step 1 — Verify MetricsService exists

Check `signal-lab/apps/backend/src/metrics/`.
If it does not exist, run the `add-metric` skill first, then return here.

---

## Step 2 — Inject dependencies

```ts
import { Injectable, Logger } from '@nestjs/common';
import * as Sentry from '@sentry/node';
import { PrismaService } from '../prisma/prisma.service';
import { MetricsService } from '../metrics/metrics.service';

@Injectable()
export class YourService {
  private readonly logger = new Logger(YourService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly metrics: MetricsService,
  ) {}
}
```

---

## Step 3 — Instrument the method

Replace the method body with this pattern:

```ts
async yourMethod(dto: YourDto) {
  // LOG: entry
  this.logger.log({ event: '[domain]_[action]_start', ...relevantFields });

  // METRIC: start timer
  const end = this.metrics.[domain]Duration.startTimer({ type: dto.type });

  try {
    const result = await this.prisma.[model].create({ data: dto });

    // LOG: success
    this.logger.log({ event: '[domain]_[action]_complete', id: result.id });

    // METRIC: success counter
    this.metrics.[domain]Counter.inc({ type: dto.type, status: 'completed' });
    end();

    return result;
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);

    // LOG: failure
    this.logger.error({ event: '[domain]_[action]_failed', error: message });

    // METRIC: failure counter
    this.metrics.[domain]Counter.inc({ type: dto.type, status: 'failed' });
    end();

    // SENTRY: capture with context
    Sentry.captureException(err, {
      tags: { domain: '[domain]', type: dto.type },
      extra: { dto },
    });

    throw err;
  }
}
```

---

## Step 4 — Add metric definitions (if new domain)

In `signal-lab/apps/backend/src/metrics/metrics.service.ts`, add:

```ts
readonly [domain]Counter = new Counter({
  name: '[domain]_runs_total',
  help: 'Total [domain] operations',
  labelNames: ['type', 'status'] as const,
  registers: [this.registry],
});

readonly [domain]Duration = new Histogram({
  name: '[domain]_duration_ms',
  help: '[Domain] operation duration in milliseconds',
  labelNames: ['type'] as const,
  buckets: [10, 50, 100, 250, 500, 1000, 2500],
  registers: [this.registry],
});
```

---

## Step 5 — Verify

Run `check-obs` command or manually verify:

```bash
# Logs appear in structured format
docker compose logs backend | grep '"event"'

# Metrics registered
curl -s http://localhost:3001/api/metrics | grep [domain]_runs_total

# Sentry (trigger a failure)
curl -X POST http://localhost:3001/api/[domain]/run \
  -d '{"type":"system_error"}' -H "Content-Type: application/json"
# → check Sentry dashboard for new event
```

---

## Checklist
- [ ] `private readonly logger = new Logger(...)` declared
- [ ] `MetricsService` injected in constructor
- [ ] `logger.log({ event: '..._start' })` at method entry
- [ ] `logger.log({ event: '..._complete' })` on success
- [ ] `logger.error({ event: '..._failed' })` in catch
- [ ] `counter.inc({ ..., status: 'completed' })` on success
- [ ] `counter.inc({ ..., status: 'failed' })` in catch
- [ ] `duration.startTimer()` before work, `end()` on both paths
- [ ] `Sentry.captureException(err, { tags, extra })` in catch
