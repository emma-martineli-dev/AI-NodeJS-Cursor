import { Injectable, Logger } from '@nestjs/common';
import * as Sentry from '@sentry/node';
import { PrismaService } from '../prisma/prisma.service';
import { RunScenarioDto } from './dto/run-scenario.dto';

@Injectable()
export class ScenariosService {
  private readonly logger = new Logger(ScenariosService.name);

  constructor(private readonly prisma: PrismaService) {}

  async run(dto: RunScenarioDto) {
    const startedAt = Date.now();

    // Persist initial record
    const run = await this.prisma.scenarioRun.create({
      data: { type: dto.type, status: 'running', metadata: dto.metadata ?? undefined },
    });

    this.logger.log({ event: 'scenario_run_start', type: dto.type, runId: run.id });

    let status: string;
    let metric: number | null = null;
    let error: string | null = null;

    try {
      metric = await this.executeScenario(dto.type);
      status = 'completed';
      this.logger.log({
        event: 'scenario_run_complete',
        type: dto.type,
        runId: run.id,
        metric,
        durationMs: Date.now() - startedAt,
      });
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      error = message;
      status = 'failed';
      this.logger.error({
        event: 'scenario_run_failed',
        type: dto.type,
        runId: run.id,
        error: message,
        durationMs: Date.now() - startedAt,
      });
      Sentry.captureException(err, {
        tags: { type: dto.type },
        extra: { runId: run.id },
      });
    }

    const duration = Date.now() - startedAt;

    // Persist final state
    const updated = await this.prisma.scenarioRun.update({
      where: { id: run.id },
      data: { status, duration, error, metadata: { ...(dto.metadata ?? {}), metric } },
    });

    return {
      id: updated.id,
      type: updated.type,
      status: updated.status,
      metric,
      duration: updated.duration,
      error: updated.error,
      createdAt: updated.createdAt,
    };
  }

  async findAll() {
    return this.prisma.scenarioRun.findMany({
      orderBy: { createdAt: 'desc' },
      take: 50,
    });
  }

  private async executeScenario(type: string): Promise<number> {
    switch (type) {
      case 'system_error':
        throw new Error('Simulated failure');

      case 'slow_query': {
        const delay = 500 + Math.floor(Math.random() * 1500);
        await new Promise((r) => setTimeout(r, delay));
        return parseFloat((Math.random() * 100).toFixed(2));
      }

      case 'load_test':
      case 'stress_test':
      default:
        return parseFloat((Math.random() * 100).toFixed(2));
    }
  }
}
