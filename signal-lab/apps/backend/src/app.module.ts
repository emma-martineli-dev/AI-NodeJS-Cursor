import { Module } from '@nestjs/common';
import { PrismaModule } from './prisma/prisma.module';
import { HealthModule } from './health/health.module';
import { ScenariosModule } from './scenarios/scenarios.module';

@Module({
  imports: [PrismaModule, HealthModule, ScenariosModule],
})
export class AppModule {}
