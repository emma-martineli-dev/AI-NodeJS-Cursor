import { Controller, Get, Res } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { Response } from 'express';
import { MetricsService } from './metrics.service';

@ApiTags('metrics')
@Controller()
export class MetricsController {
  constructor(private readonly metrics: MetricsService) {}

  // Exposed at /metrics (no /api prefix) for Prometheus scraping
  @Get('/metrics')
  @ApiOperation({ summary: 'Prometheus metrics endpoint' })
  async getMetrics(@Res() res: Response) {
    res.set('Content-Type', 'text/plain; version=0.0.4; charset=utf-8');
    res.send(await this.metrics.registry.metrics());
  }
}
