# Skill: orchestrator

**Trigger:** Any task that touches more than one file or layer.
"add [X]" | "build [X]" | "implement [X]" | "scaffold [X]"

This is the AI brain. It does not write code directly.
It decomposes the task, assigns each piece to the right skill with the minimum
context needed, runs gates, and tracks progress.

---

## Core principle — context economy

Every step gets **only the files it needs**. Nothing more.

Loading the full codebase for a one-line schema change wastes context window,
introduces noise, and produces worse output. The orchestrator enforces this.

| Budget   | Context loaded                                              | Use when                                      |
|----------|-------------------------------------------------------------|-----------------------------------------------|
| `nano`   | 1 file only                                                 | Single-field schema change, config tweak      |
| `micro`  | 1 file + its direct imports                                 | Adding a method to an existing service        |
| `small`  | Feature directory (3–5 files)                               | New branch in existing logic                  |
| `medium` | Feature directory + relevant rule `.mdc`                    | New DTO + service method + controller route   |
| `large`  | Full feature slice + AppModule + schema                     | New module from scratch                       |
| `full`   | Entire `src/` tree + all rules + infra                      | Cross-cutting change (new global module, etc) |

**Rule:** Start at the smallest budget that can complete the step.
Escalate only if the step fails due to missing context.

---

## Orchestrator execution loop

```
1. PARSE    — extract task intent, resource name, affected layers
2. PLAN     — build ordered step list with budget + skill + gate per step
3. ANNOUNCE — print the full plan before executing anything
4. EXECUTE  — run steps sequentially, one at a time
5. GATE     — verify each step before proceeding
6. RETRY    — on gate failure: diagnose, fix, re-gate (max 1 retry)
7. REPORT   — print final summary with per-step status
```

Never skip ANNOUNCE. The user must see the plan before execution starts.
Never run two steps in parallel — each step's output feeds the next.

---

## Step definition format

```
Step N — [label]                           [budget: X]
  Skill   : [skill name or "direct edit"]
  Reads   : [exact file paths loaded into context]
  Writes  : [exact file paths modified or created]
  Does    : [one sentence description]
  Gate    : [exact command + expected output]
```

---

## Gate failure protocol

```
Gate FAILED — Step N
  Expected : [what should have been true]
  Got      : [what actually happened]
  Diagnosis: [root cause in one sentence]
  Fix      : [exact change to make]
  Action   : retry Step N with fix applied
```

If retry also fails:
```
Step N BLOCKED after retry
  Cannot proceed automatically.
  User action required: [specific instruction]
```

Stop execution. Do not attempt Step N+1.

---

## Progress tracker format

Print this after every step completes or fails:

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Task: [task name]
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  [1/N] ✅  [label]
  [2/N] ✅  [label]
  [3/N] ❌  [label] — gate failed, retrying
  [3/N] ✅  [label] — retry OK
  [4/N] ⏳  [label] — in progress
  [5/N] —   [label] — pending
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

---

## Worked example — "Add new scenario type: stress_test"

### PARSE
- Task type: extend existing feature (not new module)
- Resource: `ScenarioRun` (already exists)
- Layers touched: service logic, metrics, logs, UI
- New files: 0 — all changes are extensions

### PLAN

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Task: Add stress_test scenario type
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Step 1 — DB schema check                   [budget: nano]
  Skill   : direct read
  Reads   : prisma/schema.prisma
  Writes  : nothing (stress_test is a name value, not a new model)
  Does    : confirm ScenarioRun model already has metric/log/error fields
  Gate    : fields metric, log, error exist in ScenarioRun → proceed

Step 2 — Service logic                     [budget: micro]
  Skill   : direct edit
  Reads   : signal-lab/apps/api/src/scenarios/scenarios.service.ts
  Writes  : signal-lab/apps/api/src/scenarios/scenarios.service.ts
  Does    : add branch in runScenario() for name === 'stress_test'
            returns { metric: simulatedCpuLoad, log: 'stress test completed' }
  Gate    : POST /api/scenarios {"name":"stress_test"}
            → HTTP 201, body.status === "completed", body.metric !== null

Step 3 — Metrics                           [budget: micro]
  Skill   : add-metric (Step 5 only — MetricsModule already exists)
  Reads   : signal-lab/apps/api/src/scenarios/scenarios.service.ts
            signal-lab/apps/api/src/metrics/metrics.service.ts
  Writes  : signal-lab/apps/api/src/scenarios/scenarios.service.ts
  Does    : confirm scenarioCounter.inc() is called with scenario='stress_test'
  Gate    : run scenario → curl /api/metrics | grep 'scenario_runs_total{scenario="stress_test"'
            → line found with value >= 1

Step 4 — Observability audit               [budget: micro]
  Skill   : observability-check
  Reads   : signal-lab/apps/api/src/scenarios/scenarios.service.ts
  Writes  : nothing (audit only — fix in place if needed)
  Does    : verify all 3 pillars pass after Step 2 changes
  Gate    : observability-check reports 3/3 PASS for scenarios.service.ts

Step 5 — UI quick-fire button              [budget: small]
  Skill   : direct edit
  Reads   : signal-lab/apps/web/src/components/ScenarioForm.tsx
  Writes  : signal-lab/apps/web/src/components/ScenarioForm.tsx
  Does    : add "Run stress_test" button mirroring the "Run system_error" pattern
            onClick: setValue("name","stress_test") → handleSubmit(onSubmit)()
  Gate    : button renders in browser, click fires POST, RunHistory table updates

Step 6 — Health check                      [budget: nano]
  Skill   : run healthcheck
  Reads   : nothing
  Writes  : nothing
  Does    : confirm all 6 services still pass after changes
  Gate    : node signal-lab/scripts/healthcheck.mjs → all PASS, exit 0

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Total context loaded: 4 files across 6 steps
(vs 40+ files if full codebase loaded for every step)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

### EXECUTE — Step 2 (service logic)

Context loaded: `scenarios.service.ts` only.

```ts
// Add to runScenario() in scenarios.service.ts
if (name === 'stress_test') {
  const cpuLoad = parseFloat((Math.random() * 100).toFixed(2));
  const log = `Stress test completed. Simulated CPU load: ${cpuLoad}%`;
  return { metric: cpuLoad, log };
}
```

Gate check:
```bash
curl -s -X POST http://localhost:3001/api/scenarios \
  -H "Content-Type: application/json" \
  -d '{"name":"stress_test"}' | jq '{status, metric}'
# → { "status": "completed", "metric": 84.21 }  ✅
```

### EXECUTE — Step 3 (metrics gate failure example)

Gate check:
```bash
curl -s http://localhost:3001/api/metrics | grep 'scenario_runs_total{scenario="stress_test"'
# → (empty)  ❌
```

```
Gate FAILED — Step 3
  Expected : scenario_runs_total{scenario="stress_test",...} in /api/metrics
  Got      : metric line not found
  Diagnosis: MetricsService.scenarioCounter.inc() is called but
             MetricsService was not injected after the service was edited
  Fix      : verify constructor still has `private readonly metrics: MetricsService`
             and that inc() call uses dto.name not a hardcoded string
  Action   : re-read scenarios.service.ts constructor, fix injection, retry gate
```

Retry gate:
```bash
curl -s http://localhost:3001/api/metrics | grep 'scenario_runs_total{scenario="stress_test"'
# → scenario_runs_total{scenario="stress_test",status="completed"} 1  ✅
```

### FINAL REPORT

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Task: Add stress_test scenario type — COMPLETE
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  [1/6] ✅  DB schema check     — ScenarioRun fields confirmed, no change needed
  [2/6] ✅  Service logic       — stress_test branch added, gate passed
  [3/6] ✅  Metrics             — gate failed → diagnosed → retry passed
  [4/6] ✅  Observability audit — 3/3 pillars PASS
  [5/6] ✅  UI button           — "Run stress_test" renders and fires correctly
  [6/6] ✅  Health check        — all 6 services PASS

  Files changed : 2
  Files read    : 4
  Context saved : ~36 files never loaded
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

---

## Task type → default step sequence

Use this as the starting plan for common task types, then adjust.

### Extend existing feature (new scenario type, new status, new field)
```
1. Read schema          [nano]   — confirm model has needed fields
2. Edit service logic   [micro]  — add branch / new method
3. Metrics gate         [micro]  — confirm counter fires
4. Observability audit  [micro]  — 3/3 pillars check
5. UI update            [small]  — add button or display field
6. Health check         [nano]   — all services PASS
```

### New feature from scratch (new resource)
```
1. Prisma model         [nano]   — add model, db push, generate
2. API slice            [large]  — create-endpoint skill (DTO+service+controller+module)
3. Metrics module       [large]  — add-metric skill (if MetricsModule missing)
4. Instrument service   [medium] — inject MetricsService, add counter+histogram
5. Observability audit  [micro]  — 3/3 pillars check
6. UI component         [medium] — new Form component + add to page
7. Health check         [nano]   — all services PASS
```

### Bug fix
```
1. Reproduce            [small]  — read failing code + write reproduction case
2. Diagnose             [small]  — identify root cause, state hypothesis
3. Fix                  [micro]  — minimal change to fix root cause only
4. Verify fix           [micro]  — re-run reproduction case, confirm resolved
5. Observability check  [micro]  — confirm fix didn't remove any pillars
6. Health check         [nano]   — all services PASS
```

### Observability gap (missing logs/metrics/errors)
```
1. Audit                [micro]  — observability-check skill on target service
2. Fix logs             [micro]  — add structured logger calls if missing
3. Fix metrics          [medium] — add-metric skill if missing
4. Fix Sentry           [micro]  — add captureException with tags if missing
5. Re-audit             [micro]  — confirm 3/3 PASS
6. Health check         [nano]   — all services PASS
```

---

## What the orchestrator never does

- ❌ Loads the full codebase when a single file is enough
- ❌ Skips the ANNOUNCE step (user must see the plan first)
- ❌ Proceeds past a failed gate without diagnosing
- ❌ Retries more than once without escalating to the user
- ❌ Runs steps in parallel (each step feeds the next)
- ❌ Writes code itself — it delegates to skills and direct edits with scoped context
