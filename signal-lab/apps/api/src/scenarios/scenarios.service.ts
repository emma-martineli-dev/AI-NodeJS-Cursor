import { Injectable, Logger } from "@nestjs/common";
import * as Sentry from "@sentry/node";
import { PrismaService } from "../prisma/prisma.service";
import { CreateScenarioDto } from "./dto/create-scenario.dto";

@Injectable()
export class ScenariosService {
  private readonly logger = new Logger(ScenariosService.name);

  constructor(private readonly prisma: PrismaService) {}

  async findAll() {
    return this.prisma.scenarioRun.findMany({
      orderBy: { createdAt: "desc" },
      take: 50,
    });
  }

  async create(dto: CreateScenarioDto) {
    // 1. Persist initial record
    const run = await this.prisma.scenarioRun.create({
      data: { name: dto.name, status: "running" },
    });

    this.logger.log({
      event: "scenario_started",
      scenario: dto.name,
      runId: run.id,
    });

    let status: string;
    let metric: number | null = null;
    let log: string | null = null;
    let error: string | null = null;

    try {
      // 2. Run scenario logic
      const result = await this.runScenario(dto.name);
      metric = result.metric;
      log = result.log;
      status = "completed";

      this.logger.log({
        event: "scenario_completed",
        scenario: dto.name,
        runId: run.id,
        metric,
      });
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      error = message;
      status = "failed";

      this.logger.error({
        event: "scenario_failed",
        scenario: dto.name,
        runId: run.id,
        error: message,
      });

      // 3. Send to Sentry
      Sentry.captureException(err, {
        tags: { scenario: dto.name },
        extra: { runId: run.id },
      });
    }

    // 4. Persist final state
    return this.prisma.scenarioRun.update({
      where: { id: run.id },
      data: { status, metric, log, error },
    });
  }

  private async runScenario(name: string): Promise<{ metric: number; log: string }> {
    if (name === "system_error") {
      throw new Error("Simulated failure");
    }

    const metric = parseFloat((Math.random() * 100).toFixed(2));
    const log = `Scenario "${name}" executed successfully. Score: ${metric}`;

    this.logger.log({
      event: "scenario_run",
      scenario: name,
      metric,
    });

    return { metric, log };
  }
}
