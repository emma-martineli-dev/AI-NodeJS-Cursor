import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { RunScenarioDto } from './dto/run-scenario.dto';

@Injectable()
export class ScenariosService {
  constructor(private readonly prisma: PrismaService) {}

  async run(dto: RunScenarioDto) {
    const run = await this.prisma.scenarioRun.create({
      data: {
        type: dto.type,
        status: 'pending',
        metadata: dto.metadata ?? undefined,
      },
    });

    return { id: run.id, status: run.status, createdAt: run.createdAt };
  }

  async findAll() {
    return this.prisma.scenarioRun.findMany({
      orderBy: { createdAt: 'desc' },
      take: 50,
    });
  }
}
