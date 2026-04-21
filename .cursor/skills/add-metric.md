# Skill: add-metric

**Trigger:** "add metric for [service/operation]" | "instrument [service] with Prometheus" | "add Prometheus counter"

Adds a Prometheus counter + histogram to a NestJS service and ensures `/api/metrics` is exposed.

---

## Pre-flight — check if MetricsModule already exists

Read `signal-lab/apps/api/src/` — if `metrics/` directory exists, skip Steps 1–4 and go straight to Step 5.

---

## Step 1 — MetricsService

Create `signal-lab/apps/api/src/metrics/metrics.service.ts`:

```ts
import { Injectable } from '@nestjs/common';
import { Counter, Histogram, Registry } from 'prom-client';

@Injectable()
export class MetricsService {
  readonly registry = new Registry();

  // Scenario runs — increment on every POST /api/scenarios
  readonly scenarioCounter = new Counter({
    name: 'scenario_runs_total',
    help: 'Total number of scenario runs by name and status',
    labelNames: ['scenario', 'status'] as const,
    registers: [this.registry],
  });

  // Scenario duration — observe how long each run takes
  readonly scenarioDuration = new Histogram({
    name: 'scenario_duration_ms',
    help: 'Scenario run duration in milliseconds',
    labelNames: ['scenario'] as const,
    buckets: [10, 50, 100, 250, 500, 1000, 2500, 5000],
    registers: [this.registry],
  });
}
```

---

## Step 2 — MetricsController

Create `signal-lab/apps/api/src/metrics/metrics.controller.ts`:

```ts
import { Controller, Get, Header, Res } from '@nestjs/common';
import { Response } from 'express';
import { MetricsService } from './metrics.service';

@Controller('metrics')
export class MetricsController {
  constructor(private readonly metrics: MetricsService) {}

  @Get()
  @Header('Content-Type', 'text/plain; version=0.0.4; charset=utf-8')
  async getMetrics(@Res() res: Response) {
    const data = await this.metrics.registry.metrics();
    res.send(data);
  }
}
```

---

## Step 3 — MetricsModule

Create `signal-lab/apps/api/src/metrics/metrics.module.ts`:

```ts
import { Global, Module } from '@nestjs/common';
import { MetricsController } from './metrics.controller';
import { MetricsService } from './metrics.service';

@Global()
@Module({
  controllers: [MetricsController],
  providers: [MetricsService],
  exports: [MetricsService],
})
export class MetricsModule {}
```

---

## Step 4 — Wire into AppModule

Edit `signal-lab/apps/api/src/app.module.ts`:

```ts
import { MetricsModule } from './metrics/metrics.module';

@Module({
  imports: [MetricsModule, PrismaModule, ScenariosModule],
  ...
})
```

---

## Step 5 — Instrument the target service

Edit the service that needs instrumentation (e.g. `scenarios.service.ts`).

### 5a — Inject MetricsService
```ts
constructor(
  private readonly prisma: PrismaService,
  private readonly metrics: MetricsService,   // add this
) {}
```

### 5b — Wrap the operation with timer + counter
```ts
async create(dto: CreateScenarioDto) {
  const run = await this.prisma.scenarioRun.create({ data: { name: dto.name, status: 'running' } });

  // Start timer
  const end = this.metrics.scenarioDuration.startTimer({ scenario: dto.name });

  try {
    const result = await this.runScenario(dto.name);

    // ✅ success path — record metric
    this.metrics.scenarioCounter.inc({ scenario: dto.name, status: 'completed' });
    end();

    return this.prisma.scenarioRun.update({
      where: { id: run.id },
      data: { status: 'completed', metric: result.metric, log: result.log },
    });
  } catch (err) {
    // ❌ failure path — still record metric
    this.metrics.scenarioCounter.inc({ scenario: dto.name, status: 'failed' });
    end();
    throw err;
  }
}
```

---

## Step 6 — Verify

```bash
# Metrics endpoint returns Prometheus text format
curl -s http://localhost:3001/api/metrics | grep scenario_runs_total

# After running a scenario, counter should appear:
# scenario_runs_total{scenario="load_test",status="completed"} 1
```

---

## Step 7 — Prometheus scrape config

Confirm `signal-lab/infra/docker/prometheus/prometheus.yml` contains:

```yaml
scrape_configs:
  - job_name: signal-lab-api
    static_configs:
      - targets: ["api:3001"]
    metrics_path: /api/metrics
```

---

## Completion checklist
- [ ] `MetricsService`, `MetricsController`, `MetricsModule` created
- [ ] `MetricsModule` in AppModule imports (marked `@Global`)
- [ ] Target service injects `MetricsService`
- [ ] Counter incremented on both success and failure paths
- [ ] Histogram timer started before work, ended in finally/both paths
- [ ] `GET /api/metrics` returns `scenario_runs_total` line
- [ ] Prometheus `prometheus.yml` scrapes `/api/metrics`
