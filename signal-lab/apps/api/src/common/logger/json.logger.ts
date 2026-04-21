import { LoggerService, LogLevel } from "@nestjs/common";

export class JsonLogger implements LoggerService {
  private readonly levels: LogLevel[] = ["log", "error", "warn", "debug", "verbose"];

  private write(level: string, message: unknown, context?: string) {
    const entry =
      typeof message === "object" && message !== null
        ? { ...message as object, level, context, ts: new Date().toISOString() }
        : { level, message, context, ts: new Date().toISOString() };

    // Single-line JSON — Loki scrapes one log entry per line
    process.stdout.write(JSON.stringify(entry) + "\n");
  }

  log(message: unknown, context?: string) {
    this.write("info", message, context);
  }

  error(message: unknown, trace?: string, context?: string) {
    const base = typeof message === "object" && message !== null ? message as object : { message };
    process.stdout.write(
      JSON.stringify({ ...base, level: "error", trace, context, ts: new Date().toISOString() }) + "\n",
    );
  }

  warn(message: unknown, context?: string) {
    this.write("warn", message, context);
  }

  debug(message: unknown, context?: string) {
    this.write("debug", message, context);
  }

  verbose(message: unknown, context?: string) {
    this.write("verbose", message, context);
  }
}
