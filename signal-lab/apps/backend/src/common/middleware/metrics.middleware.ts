import { Injectable, NestMiddleware } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { MetricsService } from '../../metrics/metrics.service';

@Injectable()
export class MetricsMiddleware implements NestMiddleware {
  constructor(private readonly metrics: MetricsService) {}

  use(req: Request, res: Response, next: NextFunction) {
    res.on('finish', () => {
      // Normalize path — replace IDs with :id to avoid cardinality explosion
      const path = req.path.replace(/\/[a-z0-9]{20,}/gi, '/:id');
      this.metrics.httpRequestsTotal.inc({
        method: req.method.toLowerCase(),
        path,
        status_code: String(res.statusCode),
      });
    });
    next();
  }
}
