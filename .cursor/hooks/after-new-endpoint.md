# Hook: after-new-endpoint

**Problem it solves:** A new controller or service file is created but the developer forgets to add metrics, structured logs, and Sentry. The endpoint ships without observability, making it invisible in Grafana and Loki. This is the most common observability gap in the codebase.

**Trigger:** A new `*.service.ts` or `*.controller.ts` file is created in the backend

## What this hook does

When a new service or controller is created, automatically run `/check-obs` on it:

1. Read the new file
2. Check all 3 observability pillars (logs, metrics, Sentry)
3. If any pillar is missing — block and show exactly what to add
4. Remind to update Swagger if it's a controller

## Hook config (`.cursor/hooks/after-new-endpoint.json`)
```json
{
  "name": "After New Endpoint",
  "version": "1.0.0",
  "description": "Checks observability pillars when a new service or controller is created",
  "when": {
    "type": "fileCreated",
    "patterns": [
      "signal-lab/apps/backend/src/**/*.service.ts",
      "signal-lab/apps/backend/src/**/*.controller.ts"
    ]
  },
  "then": {
    "type": "askAgent",
    "prompt": "A new backend file was just created. Please: 1) Run /check-obs on the new file to verify all 3 observability pillars are present (structured logs with event field, Prometheus metrics, Sentry.captureException with tags). 2) If it is a controller, verify @ApiTags and @ApiOperation decorators are present for Swagger. 3) Report PASS or list exactly what is missing with the fix."
  }
}
```
