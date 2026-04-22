import {
  Injectable,
  Logger,
  BadRequestException,
  InternalServerErrorException,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import * as Sentry from '@sentry/node';
import { PrismaService } from '../prisma/prisma.service';
import { MetricsService } from '../metrics/metrics.service';
import { RunScenarioDto } from './dto/run-scenario.dto';

@Injectable()
export class ScenariosService {
  private readonly logger = new Logger(ScenariosService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly metrics: MetricsService,
  ) {}

  async run(dto: RunScenarioDto) {
    const startedAt = Date.now();

    // validation_error — reject immediately, no DB record
    if (dto.type === 'validation_error') {
      this.logger.warn({
        event: 'scenario_validation_error',
        scenarioType: dto.type,
        message: 'Invalid scenario input rejected',
      });
      this.metrics.scenarioRunsTotal.inc({ type: dto.type, status: 'error' });
      throw new BadRequestException({
        statusCode: 400,
        message: 'validation_error scenario: invalid input rejected',
        type: dto.type,
      });
    }

    // teapot — Easter egg: HTTP 418, signal: 42
    if (dto.type === 'teapot') {
      const run = await this.prisma.scenarioRun.create({
        data: {
          type: dto.type,
          status: 'completed',
          duration: 0,
          metadata: { easter: true, signal: 42 },
        },
      });
      this.logger.log({
        event: 'scenario_teapot',
        scenarioType: dto.type,
        scenarioId: run.id,
        signal: 42,
      });
      this.metrics.scenarioRunsTotal.inc({ type: dto.type, status: 'teapot' });
      throw new HttpException(
        { signal: 42, message: "I'm a teapot", id: run.id },
        HttpStatus.I_AM_A_TEAPOT,
      );
    }

    // Persist initial record
    const run = await this.prisma.scenarioRun.create({
      data: {
        type: dto.type,
        status: 'running',
      },
    });

    this.logger.log({
      event: 'scenario_run_start',
      scenarioType: dto.type,
      scenarioId: run.id,
      name: dto.name ?? null,
    });

    // Start histogram timer
    const endTimer = this.metrics.scenarioRunDurationSeconds.startTimer({ type: dto.type });

    try {
      await this.executeScenario(dto.type);

      const duration = Date.now() - startedAt;
      endTimer();

      this.metrics.scenarioRunsTotal.inc({ type: dto.type, status: 'completed' });

      this.logger.log({
        event: 'scenario_run_complete',
        scenarioType: dto.type,
        scenarioId: run.id,
        duration,
        durationMs: duration,
      });

      const updated = await this.prisma.scenarioRun.update({
        where: { id: run.id },
        data: { status: 'completed', duration },
      });

      return {
        id: updated.id,
        type: updated.type,
        status: updated.status,
        duration: updated.duration,
        error: null,
        createdAt: updated.createdAt,
      };
    } catch (err) {
      endTimer();

      // Re-throw NestJS HTTP exceptions without wrapping
      if (err instanceof HttpException) throw err;

      const message = err instanceof Error ? err.message : String(err);
      const duration = Date.now() - startedAt;

      this.metrics.scenarioRunsTotal.inc({ type: dto.type, status: 'failed' });

      this.logger.error({
        event: 'scenario_run_failed',
        scenarioType: dto.type,
        scenarioId: run.id,
        error: message,
        duration,
        durationMs: duration,
      });

      Sentry.captureException(err, {
        tags: { type: dto.type, scenarioType: dto.type },
        extra: { runId: run.id, scenarioId: run.id },
      });

      await this.prisma.scenarioRun.update({
        where: { id: run.id },
        data: { status: 'failed', duration, error: message },
      });

      throw new InternalServerErrorException({
        statusCode: 500,
        message,
        type: dto.type,
        id: run.id,
      });
    }
  }

  async findAll() {
    return this.prisma.scenarioRun.findMany({
      orderBy: { createdAt: 'desc' },
      take: 20,
    });
  }

  private async executeScenario(type: string): Promise<void> {
    switch (type) {
      case 'system_error':
        throw new Error('Simulated system failure');

      case 'slow_request': {
        // PRD 002 F4: 2-5 second artificial delay
        const delay = 2000 + Math.floor(Math.random() * 3000);
        this.logger.warn({
          event: 'scenario_slow_request',
          scenarioType: type,
          delayMs: delay,
          message: 'Slow request — artificial delay injected',
        });
        await new Promise((r) => setTimeout(r, delay));
        return;
      }

      case 'chaos_monkey': {
        // Bonus: random failure ~50% + random delay 0-1s
        const delay = Math.floor(Math.random() * 1000);
        await new Promise((r) => setTimeout(r, delay));
        if (Math.random() < 0.5) {
          throw new Error('Chaos monkey struck — random failure');
        }
        return;
      }

      case 'success':
      case 'load_test':
      case 'stress_test':
      default:
        return;
    }
  }
}
