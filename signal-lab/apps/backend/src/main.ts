import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import * as Sentry from '@sentry/node';
import { AppModule } from './app.module';
import { AllExceptionsFilter } from './common/filters/all-exceptions.filter';

async function bootstrap() {
  // Sentry must be initialised before NestFactory
  Sentry.init({
    dsn: process.env.SENTRY_DSN ?? '',
    environment: process.env.NODE_ENV ?? 'development',
    // Only active when DSN is provided — safe to leave blank locally
  });

  const app = await NestFactory.create(AppModule);

  // /metrics is served WITHOUT the /api prefix (Prometheus convention)
  // All other routes get /api prefix
  app.setGlobalPrefix('api', {
    exclude: ['/metrics'],
  });

  app.useGlobalPipes(
    new ValidationPipe({ whitelist: true, transform: true }),
  );

  app.useGlobalFilters(new AllExceptionsFilter());

  app.enableCors();

  const config = new DocumentBuilder()
    .setTitle('Signal Lab API')
    .setDescription('Signal Lab — observability playground')
    .setVersion('1.0')
    .addTag('scenarios')
    .addTag('health')
    .addTag('metrics')
    .build();
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/docs', app, document);

  const port = process.env.PORT ?? 3001;
  await app.listen(port);
  console.log(JSON.stringify({
    event: 'app_started',
    port,
    swagger: `http://localhost:${port}/api/docs`,
    metrics: `http://localhost:${port}/metrics`,
  }));
}

bootstrap();
