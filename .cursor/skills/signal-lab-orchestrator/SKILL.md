---
name: signal-lab-orchestrator
description: Accepts a PRD and drives it through a 7-phase pipeline. Minimises main-chat context by delegating all heavy work to subagents. State persists in context.json so execution can resume after any interruption.
version: 1.0.0
---

# Signal Lab Orchestrator

## When to Use
- You receive a PRD (text or file path) and need to implement it
- `/run-prd` command is invoked
- A previous execution was interrupted and needs to resume
- You need to implement a multi-layer feature (DB + API + Frontend)

## What this skill does NOT do
- Write code itself — all implementation is delegated to subagents
- Load the full codebase — each phase gets only the files it needs
- Re-execute completed phases — reads context.json and skips them
- Block on a single failure — failed tasks are marked and skipped

---

## Execution model

```
Main chat (orchestrator)          Subagents (workers)
─────────────────────────         ──────────────────────────────
Read PRD                    →
Create .execution/<id>/           
Write context.json          →
                                  Phase 1: PRD Analysis     [fast]
Update context.json         ←
                                  Phase 2: Codebase Scan    [fast]
Update context.json         ←
                                  Phase 3: Planning         [default]
Update context.json         ←
                                  Phase 4: Decomposition    [default]
Update context.json         ←
                            →     Phase 5: Implementation   [fast×80% / default×20%]
Update context.json         ←
                                  Phase 6: Review           [fast, readonly]
Update context.json         ←
                                  Phase 7: Report           [fast]
Print final report          ←
```

Main chat token budget: ~15k tokens total across all phases.
Subagents handle all file reads, writes, and implementation.

---

## Step 0 — Check for existing execution (resume logic)

Before doing anything else:

```
1. Check if .execution/ directory exists
2. Find the most recent context.json by timestamp
3. If found and status !== "completed":
   - Read context.json
   - Print: "Resuming execution <id> from phase: <currentPhase>"
   - Skip to the current phase
4. If not found or status === "completed":
   - Start fresh from Step 1
```

---

## Step 1 — Initialise execution

```
executionId = timestamp in format YYYY-MM-DD-HH-mm
workDir    = .execution/<executionId>/
```

Create `workDir/context.json`:

```json
{
  "executionId": "<id>",
  "prdPath": "<path or 'inline'>",
  "prdText": "<full PRD text>",
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

Print: `Execution <id> initialised. Working directory: .execution/<id>/`

---

## Phase 1 — PRD Analysis `[fast model]`

**Context loaded by subagent:** PRD text only (no codebase files)

**Subagent prompt** (from COORDINATION.md → `analysis-agent`):
> Read the PRD text. Extract and return JSON with:
> - `features`: array of feature names
> - `constraints`: technical constraints mentioned
> - `acceptanceCriteria`: list of acceptance criteria
> - `layers`: which layers are touched (database/backend/frontend/infra)
> - `newResources`: new Prisma models or API resources needed
> - `extensions`: existing resources being extended

**Update context.json:**
```json
"analysis": {
  "status": "completed",
  "result": { /* subagent output */ }
}
```

**Gate:** `result.features.length > 0`

---

## Phase 2 — Codebase Scan `[fast model]`

**Context loaded by subagent:** Directory listings only — no file contents

**Subagent prompt** (from COORDINATION.md → `codebase-agent`):
> List the contents of these directories (no file reads):
> - signal-lab/apps/backend/src/
> - signal-lab/apps/frontend/src/
> - signal-lab/prisma/
> Return JSON with:
> - `existingModules`: NestJS modules already present
> - `existingModels`: Prisma models already in schema
> - `existingComponents`: Frontend components already present
> - `conflicts`: anything in the PRD that conflicts with existing code

**Update context.json:**
```json
"codebase": {
  "status": "completed",
  "result": { /* subagent output */ }
}
```

**Gate:** `result.existingModels` is populated

---

## Phase 3 — Planning `[default model]`

**Context loaded by subagent:** analysis.result + codebase.result only

**Subagent prompt** (from COORDINATION.md → `planning-agent`):
> Given the PRD analysis and codebase scan, produce a high-level implementation plan.
> Return JSON with:
> - `approach`: 2-3 sentence description of the implementation strategy
> - `layerOrder`: ordered list of layers to implement (e.g. ["database","backend","frontend"])
> - `risks`: potential issues or blockers
> - `estimatedTasks`: rough count of atomic tasks needed

**Update context.json:**
```json
"planning": {
  "status": "completed",
  "result": { /* subagent output */ }
}
```

**Gate:** `result.layerOrder.length > 0`

---

## Phase 4 — Decomposition `[default model]`

**Context loaded by subagent:** analysis.result + planning.result + relevant existing files

**Subagent prompt** (from COORDINATION.md → `decomposition-agent`):
> Break the implementation plan into atomic tasks.
> Each task must be completable in 5-10 minutes.
> Return a JSON array of tasks. Each task:
> ```json
> {
>   "id": "task-001",
>   "title": "One-line description",
>   "description": "1-3 sentences of what to do",
>   "type": "database|backend|frontend|infra",
>   "complexity": "low|medium|high",
>   "model": "fast|default",
>   "skill": "nestjs-endpoint|shadcn-form|observability|prisma-patterns|direct-edit",
>   "dependsOn": ["task-id"],
>   "files": ["exact/file/paths/to/read"],
>   "status": "pending"
> }
> ```
> Model selection rules:
> - fast: add field to schema, create DTO, simple endpoint, add metric/log, UI component
> - default: architecture decisions, complex business logic, multi-system integration

**Update context.json:**
```json
"decomposition": { "status": "completed" },
"tasks": [ /* task array */ ]
```

Also update `implementation.totalTasks`.

**Gate:** `tasks.length > 0` and all tasks have `model` field

---

## Phase 5 — Implementation `[fast 80% / default 20%]`

**Execute tasks in dependency order.**

For each task group (tasks with no pending dependencies):

### 5a — Select model
```
task.model === "fast"    → use fast/small model subagent
task.model === "default" → use default model subagent
```

### 5b — Build subagent prompt

Load ONLY the files listed in `task.files`. Nothing else.

```
Task: <task.title>
Description: <task.description>
Type: <task.type>
Skill to use: <task.skill> (see .cursor/skills/<skill>.md)
Files to read: <task.files>
Rules to follow: .cursor/rules/<relevant>.mdc

Implement this task. Return:
- List of files modified/created
- Brief description of what was done
- Any blockers encountered
```

### 5c — Update context.json after each task

```json
{
  "id": "task-001",
  "status": "completed",
  "result": "Added ScenarioRun model with metric/log/error fields"
}
```

Increment `implementation.completedTasks`.

### 5d — Print progress after each task

```
[5/12] ✅ task-001 — Add ScenarioRun model to Prisma schema  [fast]
[6/12] ✅ task-002 — Create RunScenarioDto with validation   [fast]
[7/12] ⏳ task-003 — Implement ScenariosService.run()        [default]
```

### 5e — Failed task handling

If a task fails:
```json
{ "status": "failed", "error": "reason", "retries": 1 }
```
Mark as failed, continue with next independent task. Do NOT block the pipeline.

---

## Phase 6 — Review `[fast model, readonly]`

**Run one reviewer per domain that was touched.**

For each domain in `planning.result.layerOrder`:

### 6a — Reviewer subagent prompt

```
You are a code reviewer. Read-only — do not modify files.
Domain: <database|backend|frontend>
Files to review: <files modified in Phase 5 for this domain>
Rules to check: .cursor/rules/<relevant>.mdc

Check:
1. Does the code follow the rules in the referenced .mdc file?
2. Are all acceptance criteria from the PRD met?
3. For backend: does /check-obs pass? (logs + metrics + Sentry)
4. For frontend: are loading/error states handled?
5. For database: is the migration present?

Return JSON:
{
  "passed": true|false,
  "issues": ["list of specific issues"],
  "suggestions": ["optional improvements"]
}
```

### 6b — Review loop (max 3 retries per domain)

```
attempt = 1
while attempt <= 3:
  run reviewer subagent
  if result.passed:
    mark domain review as "passed"
    break
  else:
    run implementer subagent with result.issues as feedback
    attempt++

if attempt > 3:
  mark domain review as "failed"
  add to final report "Failed" section
  continue to next domain
```

**Update context.json:**
```json
"review": {
  "status": "completed",
  "domains": {
    "backend": { "passed": true, "attempts": 1 },
    "frontend": { "passed": true, "attempts": 2 },
    "database": { "passed": true, "attempts": 1 }
  }
}
```

---

## Phase 7 — Report `[fast model]`

**Context loaded:** context.json only (no codebase files)

Generate and print the final report:

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Signal Lab PRD Execution — Complete
Execution ID: <id>
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Tasks:    <N> completed, <F> failed, <R> retries
Duration: ~<T> min
Models:   <fast_count> fast, <default_count> default

Completed:
  ✓ <task title>
  ✓ <task title>
  ...

Failed:
  ✗ <task title> — <reason>

Review:
  ✓ database  — passed (1 attempt)
  ✓ backend   — passed (2 attempts)
  ✗ frontend  — failed (max retries)

Next steps:
  - <manual fix for failed items>
  - Run /health-check to verify stack
  - Run /check-obs to verify observability
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

**Update context.json:**
```json
{
  "status": "completed",
  "currentPhase": "report"
}
```

---

## Context economy summary

| Phase | Files loaded | Token budget |
|-------|-------------|--------------|
| Analysis | PRD text only | ~2k |
| Codebase | Directory listings only | ~1k |
| Planning | analysis + codebase results | ~3k |
| Decomposition | planning + analysis + 2-3 key files | ~5k |
| Implementation (per task) | task.files only (1-3 files) | ~2k each |
| Review (per domain) | modified files for that domain | ~3k each |
| Report | context.json only | ~1k |

**Total main-chat budget: ~15k tokens**
Heavy work (implementation, review) runs in subagents with isolated context.
