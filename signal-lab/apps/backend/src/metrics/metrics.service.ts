import { Injectable } from '@nestjs/common';
import { Counter, Histogram, Registry } from 'prom-client';

@Injectable()
export class MetricsService {
  readonly registry = new Registry();

  // PRD 002 F5: scenario_runs_total (counter, labels: type, status)
  readonly scenarioRunsTotal = new Counter({
    name: 'scenario_runs_total',
    help: 'Total number of scenario runs',
    labelNames: ['type', 'status'] as const,
    registers: [this.registry],
  });

  // PRD 002 F5: scenario_run_duration_seconds (histogram, labels: type)
  readonly scenarioRunDurationSeconds = new Histogram({
    name: 'scenario_run_duration_seconds',
    help: 'Scenario run duration in seconds',
    labelNames: ['type'] as const,
    buckets: [0.01, 0.05, 0.1, 0.25, 0.5, 1, 2, 5, 10],
    registers: [this.registry],
  });

  // PRD 002 F5: http_requests_total (counter, labels: method, path, status_code)
  readonly httpRequestsTotal = new Counter({
    name: 'http_requests_total',
    help: 'Total number of HTTP requests',
    labelNames: ['method', 'path', 'status_code'] as const,
    registers: [this.registry],
  });
}
