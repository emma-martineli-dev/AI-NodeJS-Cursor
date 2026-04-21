# Example — PRD 002: Observability Demo

This is a complete walkthrough of the orchestrator executing PRD 002.
Shows context.json at each phase and the exact subagent calls made.

---

## Invocation

```
/run-prd prds/002_observability-demo.md
```

---

## Step 0 — Resume check

```
.execution/ does not exist → starting fresh
```

---

## Step 1 — Initialise

Creates `.execution/2026-04-22-14-30/context.json`:

```json
{
  "executionId": "2026-04-22-14-30",
  "prdPath": "prds/002_observability-demo.md",
  "status": "in_progress",
  "currentPhase": "analysis",
  "phases": {
    "analysis":       { "status": "pending" },
    "codebase":       { "status": "pending" },
    "planning":       { "status": "pending" },
    "decomposition":  { "status": "pending" },
    "implementation": { "status": "pending", "completedTasks": 0, "totalTasks": 0 },
    "review":         { "status": "pending" },
    "report":         { "status": "pending" }
  },
  "signal": 0,
  "tasks": []
}
```

---

## Phase 1 — Analysis `[fast]`

**Subagent:** `analysis-agent`
**Context loaded:** PRD text only (~1.5k tokens)

**Output:**
```json
{
  "features": ["structured JSON logging", "Prometheus metrics", "Sentry integration", "Grafana dashboard"],
  "constraints": ["NestJS backend", "prom-client for metrics", "Loki for logs"],
  "acceptanceCriteria": [
    "GET /api/metrics returns Prometheus text format",
    "Logs are JSON with event field",
    "Sentry captures exceptions with tags",
    "Grafana dashboard shows scenario_runs_total"
  ],
  "layers": ["backend", "infra"],
  "newResources": ["MetricsModule"],
  "extensions": ["ScenariosService — add observability"]
}
```

**context.json after:**
```json
"analysis": { "status": "completed", "result": { ... } }
```

---

## Phase 2 — Codebase Scan `[fast]`

**Subagent:** `codebase-agent`
**Context loaded:** Directory listings only (~0.5k tokens)

**Output:**
```json
{
  "existingModules": ["PrismaModule", "HealthModule", "ScenariosModule"],
  "existingModels": ["ScenarioRun"],
  "existingComponents": ["RunScenarioForm", "RunHistory", "HealthStatus"],
  "conflicts": []
}
```

---

## Phase 3 — Planning `[default]`

**Subagent:** `planning-agent`
**Context loaded:** analysis.result + codebase.result (~3k tokens)

**Output:**
```json
{
  "approach": "Add MetricsModule as a global NestJS module exposing /api/metrics. Instrument ScenariosService with counter and histogram. Add structured JSON logger. Wire Sentry in main.ts.",
  "layerOrder": ["backend", "infra"],
  "risks": ["prom-client registry conflicts if instantiated twice"],
  "estimatedTasks": 6,
  "notes": "MetricsModule must be @Global() to avoid multiple Registry instances"
}
```

---

## Phase 4 — Decomposition `[default]`

**Subagent:** `decomposition-agent`
**Context loaded:** analysis + planning + schema.prisma + app.module.ts (~4k tokens)

**Output — tasks array:**

```json
[
  {
    "id": "task-001",
    "title": "Create MetricsService with counter and histogram",
    "description": "Create signal-lab/apps/backend/src/metrics/metrics.service.ts with a Registry, scenario_runs_total Counter (labels: type, status), and scenario_duration_ms Histogram.",
    "type": "backend",
    "complexity": "low",
    "model": "fast",
    "skill": "direct-edit",
    "dependsOn": [],
    "files": ["signal-lab/apps/backend/src/scenarios/scenarios.service.ts"],
    "status": "pending"
  },
  {
    "id": "task-002",
    "title": "Create MetricsController exposing /api/metrics",
    "description": "Create metrics.controller.ts with GET /metrics returning registry.metrics() as text/plain Prometheus format.",
    "type": "backend",
    "complexity": "low",
    "model": "fast",
    "skill": "direct-edit",
    "dependsOn": ["task-001"],
    "files": [],
    "status": "pending"
  },
  {
    "id": "task-003",
    "title": "Create MetricsModule and wire into AppModule",
    "description": "Create metrics.module.ts with @Global() decorator. Add MetricsModule to AppModule imports.",
    "type": "backend",
    "complexity": "low",
    "model": "fast",
    "skill": "direct-edit",
    "dependsOn": ["task-001", "task-002"],
    "files": ["signal-lab/apps/backend/src/app.module.ts"],
    "status": "pending"
  },
  {
    "id": "task-004",
    "title": "Create JsonLogger for structured JSON output",
    "description": "Create common/logger/json.logger.ts implementing LoggerService. All log methods write single-line JSON with level, message/object, context, and ts fields.",
    "type": "backend",
    "complexity": "low",
    "model": "fast",
    "skill": "direct-edit",
    "dependsOn": [],
    "files": [],
    "status": "pending"
  },
  {
    "id": "task-005",
    "title": "Instrument ScenariosService with metrics, logs, Sentry",
    "description": "Inject MetricsService into ScenariosService. Add structured logger calls with event field. Add counter.inc() on success and failure. Add Sentry.captureException with tags in catch block.",
    "type": "backend",
    "complexity": "medium",
    "model": "default",
    "skill": "observability",
    "dependsOn": ["task-003", "task-004"],
    "files": [
      "signal-lab/apps/backend/src/scenarios/scenarios.service.ts",
      "signal-lab/apps/backend/src/metrics/metrics.service.ts",
      ".cursor/skills/observability.md",
      ".cursor/rules/observability-conventions.mdc"
    ],
    "status": "pending"
  },
  {
    "id": "task-006",
    "title": "Init Sentry in main.ts",
    "description": "Add Sentry.init({ dsn: process.env.SENTRY_DSN, environment: process.env.NODE_ENV }) before NestFactory.create(). Install @sentry/node if not present.",
    "type": "backend",
    "complexity": "low",
    "model": "fast",
    "skill": "direct-edit",
    "dependsOn": [],
    "files": ["signal-lab/apps/backend/src/main.ts"],
    "status": "pending"
  }
]
```

**context.json after:**
```json
"decomposition": { "status": "completed" },
"implementation": { "status": "pending", "completedTasks": 0, "totalTasks": 6 },
"tasks": [ /* 6 tasks */ ]
```

---

## Phase 5 — Implementation

### Execution order (by dependencies)

```
Round 1 (no deps):     task-001, task-004, task-006  [all fast]
Round 2 (deps met):    task-002                       [fast]
Round 3 (deps met):    task-003                       [fast]
Round 4 (deps met):    task-005                       [default]
```

### Progress output

```
[1/6] ✅ task-001 — Create MetricsService              [fast]   ~45s
[2/6] ✅ task-004 — Create JsonLogger                  [fast]   ~30s
[3/6] ✅ task-006 — Init Sentry in main.ts             [fast]   ~20s
[4/6] ✅ task-002 — Create MetricsController           [fast]   ~30s
[5/6] ✅ task-003 — Create MetricsModule + AppModule   [fast]   ~25s
[6/6] ✅ task-005 — Instrument ScenariosService        [default] ~90s
```

### context.json after task-005

```json
{
  "id": "task-005",
  "status": "completed",
  "result": "Injected MetricsService, added 4 structured log calls, counter on success/failure, Sentry.captureException with tags: { domain: 'scenarios', type: dto.type }"
}
```

---

## Phase 6 — Review

### Backend review (attempt 1)

**Reviewer reads:** scenarios.service.ts, metrics.service.ts, metrics.controller.ts

```json
{
  "passed": false,
  "issues": [
    "metrics.controller.ts: missing @ApiTags('metrics') decorator",
    "scenarios.service.ts: Sentry.captureException called without extra field"
  ]
}
```

**Fix-agent** corrects both issues.

### Backend review (attempt 2)

```json
{ "passed": true, "issues": [] }
```

**context.json:**
```json
"review": {
  "status": "completed",
  "domains": {
    "backend": { "passed": true, "attempts": 2 }
  }
}
```

---

## Phase 7 — Report

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Signal Lab PRD Execution — Complete
Execution ID: 2026-04-22-14-30
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Tasks:    6 completed, 0 failed, 1 retry
Models:   5 fast, 1 default

Completed:
  ✓ Create MetricsService with counter and histogram
  ✓ Create MetricsController exposing /api/metrics
  ✓ Create MetricsModule and wire into AppModule
  ✓ Create JsonLogger for structured JSON output
  ✓ Instrument ScenariosService with metrics, logs, Sentry
  ✓ Init Sentry in main.ts

Failed:
  (none)

Review:
  ✓ backend — passed (2 attempts)

Next steps:
  - Run /health-check to verify stack
  - Run /check-obs to verify observability
  - curl http://localhost:3001/api/metrics to confirm Prometheus output
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

---

## Resume scenario

Suppose the orchestrator was interrupted after task-003 completed.

On restart:
```
/run-prd prds/002_observability-demo.md
```

Orchestrator reads `.execution/2026-04-22-14-30/context.json`:
```
Resuming execution 2026-04-22-14-30 from phase: implementation
Completed tasks: 5/6
Pending: task-005
```

Skips phases 1-4 (all completed).
Skips tasks 001-004 (all completed).
Resumes from task-005.

---

## Token budget breakdown

| Phase | Subagent | Tokens |
|-------|----------|--------|
| Analysis | analysis-agent | ~1.5k |
| Codebase | codebase-agent | ~0.5k |
| Planning | planning-agent | ~3k |
| Decomposition | decomposition-agent | ~4k |
| task-001..004 | fast × 4 | ~1k each = 4k |
| task-005 | default × 1 | ~3k |
| task-006 | fast × 1 | ~1k |
| Review | reviewer × 1 | ~2k |
| Fix | fix-agent × 1 | ~1.5k |
| Report | report-agent | ~0.5k |
| **Main chat** | orchestrator | **~15k** |
| **Total** | | **~36k** |

Without orchestration (single chat): ~80-100k tokens for the same work.
**Savings: ~60%**
