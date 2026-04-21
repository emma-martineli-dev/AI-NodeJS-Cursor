# Marketplace Skills

Six external integrations wired into Signal Lab workflows.
Each entry explains what it does, how to connect it, and how it fits the project.

---

## 1. Code Generation — Cursor Tab (built-in)

**What it does:** Autocompletes boilerplate as you type — DTOs, Prisma queries, controller stubs.

**How to connect:** Already active in Cursor. No setup needed.

**How we use it in Signal Lab:**
- Start typing `export class Create` → Tab completes the DTO with `class-validator` decorators
- Start typing `this.prisma.scenarioRun.` → Tab suggests `findMany`, `create`, `update` with correct args
- Pair with `create-endpoint` skill: Cursor Tab fills the repetitive parts, the skill enforces structure

**Constraint:** Tab-completed code must still pass `observability-check` before commit.
The hook will catch anything missing.

---

## 2. Refactoring — Cursor Cmd+K

**What it does:** Inline AI edits — extract method, rename, simplify, restructure.

**How to connect:** Select code → `Cmd+K` (Mac) / `Ctrl+K` (Windows) → describe the change.

**How we use it in Signal Lab:**

Extract the repeated try/catch/log/metric/sentry pattern into a wrapper:
```
Select the try/catch block in scenarios.service.ts
Cmd+K → "extract into a withObservability(name, fn) helper that handles
         logging, metrics, and Sentry automatically"
```

Rename after a Prisma migration:
```
Cmd+K → "rename all references from scenarioRun to ScenarioExecution
         to match the updated Prisma schema"
```

**Constraint:** After any refactor, run `observability-check` to confirm
`logger`, `metrics`, and `Sentry` calls were not removed.

---

## 3. Testing — Cursor Chat + Vitest

**What it does:** Generates unit tests from service method signatures.

**How to connect:**
```bash
yarn workspace @signal-lab/api add -D vitest @vitest/coverage-v8
```
Add to `signal-lab/apps/api/package.json`:
```json
"scripts": { "test": "vitest run", "test:watch": "vitest" }
```

**How we use it in Signal Lab:**

Open `scenarios.service.ts` → Cursor Chat:
```
Write Vitest unit tests for ScenariosService covering:
1. create() — success path: returns completed run with metric
2. create() — system_error: returns failed run with error message
3. create() — DB failure: Sentry.captureException is called
Mock PrismaService and MetricsService. Do not hit the real DB.
```

Output location: `signal-lab/apps/api/src/scenarios/scenarios.service.spec.ts`

**Constraint:** Tests must mock `PrismaService` and `MetricsService`.
Never use a real DB connection in unit tests.

---

## 4. Documentation — Cursor Chat + Markdown

**What it does:** Generates API reference docs from controllers and DTOs.

**How to connect:** No install needed — use Cursor Chat with the file in context.

**How we use it in Signal Lab:**

Open `scenarios.controller.ts` + `create-scenario.dto.ts` → Cursor Chat:
```
Generate API reference documentation for these endpoints in Markdown.
Include: method, path, request body schema, response schema, example request/response.
Output to docs/api/scenarios.md
```

For OpenAPI spec generation:
```bash
yarn workspace @signal-lab/api add @nestjs/swagger swagger-ui-express
```
Then add `SwaggerModule.setup('docs', app, ...)` in `main.ts` →
Swagger UI available at `http://localhost:3001/docs`.

---

## 5. Security Scanning — Snyk

**What it does:** Scans `package.json` dependencies for known CVEs.

**How to connect:**
```bash
npm install -g snyk
snyk auth   # opens browser for login
```

**How we use it in Signal Lab:**
```bash
# Scan from workspace root
snyk test --severity-threshold=high

# Monitor continuously (sends to Snyk dashboard)
snyk monitor
```

**Wire into CI** (GitHub Actions):
```yaml
- name: Security scan
  run: npx snyk test --severity-threshold=high
  env:
    SNYK_TOKEN: ${{ secrets.SNYK_TOKEN }}
```

**Block on:** High-severity CVEs in `@nestjs/*`, `@prisma/client`, `@sentry/node`, `next`.

---

## 6. Observability AI — Grafana Sift

**What it does:** Automatically correlates metrics spikes with log anomalies —
no manual query writing needed.

**How to connect:**
1. Open Grafana at `http://localhost:3200`
2. Go to **Explore** → select **Loki** datasource
3. For cloud: enable **Sift** in Grafana Cloud settings → point at Signal Lab datasources

**How we use it in Signal Lab:**

After running `system_error` scenario:
- Sift detects spike in `scenario_runs_total{status="failed"}`
- Automatically surfaces correlated Loki entries: `event="scenario_failed"`
- Links to the Sentry issue via the `runId` in the log

Manual Loki query for the same result:
```logql
{container="signal-lab-api"} | json
  | event=`scenario_failed`
  | line_format `{{.scenario}} — {{.error}}`
```

**Grafana dashboard:** Pre-provisioned at `signal-lab/infra/docker/grafana/provisioning/dashboards/signal-lab.json`
Opens automatically when Grafana container starts.
