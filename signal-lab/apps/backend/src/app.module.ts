import { Module, NestModule, MiddlewareConsumer } from '@nestjs/common';
import { PrismaModule } from './prisma/prisma.module';
import { HealthModule } from './health/health.module';
import { ScenariosModule } from './scenarios/scenarios.module';
import { MetricsModule } from './metrics/metrics.module';
import { MetricsMiddleware } from './common/middleware/metrics.middleware';

@Module({
  imports: [MetricsModule, PrismaModule, HealthModule, ScenariosModule],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(MetricsMiddleware).forRoutes('*');
  }
}
