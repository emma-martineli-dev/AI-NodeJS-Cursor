import { NestFactory } from "@nestjs/core";
import * as Sentry from "@sentry/node";
import { AppModule } from "./app.module";
import { JsonLogger } from "./common/logger/json.logger";

async function bootstrap() {
  Sentry.init({
    dsn: process.env.SENTRY_DSN,
    environment: process.env.NODE_ENV ?? "development",
    // Only initialises when DSN is present — safe to leave blank locally
  });

  const app = await NestFactory.create(AppModule, {
    logger: new JsonLogger(),
  });

  app.setGlobalPrefix("api");
  await app.listen(process.env.PORT ?? 3001);
}

bootstrap();
