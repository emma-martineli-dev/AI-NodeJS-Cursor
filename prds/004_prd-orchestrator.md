# PRD 004 — Signal Lab: Small-Model PRD Orchestrator

## Goal
Create an orchestrator skill that accepts a PRD and drives it through a pipeline:
analysis → plan → decomposition → implementation → review.
The orchestrator must minimise context in the main chat and allow small models to
execute the majority of subtasks.

## Why this matters
A large prompt is not AI architecture. We check whether the candidate understands:
- **Context economy**: main chat spends ~15k tokens, all heavy work in subagents
- **Atomic decomposition**: tasks broken so 80%+ can be done by fast/small model
- **State persistence**: state lives in a file, not only in chat history
- **Resumability**: can continue from any phase after failure

## Expected output
```
.cursor/skills/
  signal-lab-orchestrator/
    SKILL.md              # main orchestrator file
    COORDINATION.md       # prompts for each subagent
    EXAMPLE.md            # usage example
```

## Required phases

| # | Phase | What it does | Model |
|---|-------|-------------|-------|
| 1 | PRD Analysis | Parses PRD into requirements, features, constraints | fast |
| 2 | Codebase Scan | Understands current project structure | fast (explore) |
| 3 | Planning | High-level implementation plan | default |
| 4 | Decomposition | Breaks into atomic tasks with dependencies | default |
| 5 | Implementation | Executes tasks by dependency groups | fast (80%) / default (20%) |
| 6 | Review | Quality check against criteria | fast (readonly) |
| 7 | Report | Final report with results | fast |

## Functional requirements

### F1. PRD Input
- Orchestrator accepts PRD as text or file path
- Creates working directory: `.execution/<timestamp>/`
- Creates `context.json` with initial state

### F2. Context File
```json
{
  "executionId": "2026-04-08-14-30",
  "prdPath": "prds/002_prd-observability-demo.md",
  "status": "in_progress",
  "currentPhase": "implementation",
  "phases": {
    "analysis":       { "status": "completed", "result": "..." },
    "codebase":       { "status": "completed", "result": "..." },
    "planning":       { "status": "completed", "result": "..." },
    "decomposition":  { "status": "completed", "result": "..." },
    "implementation": { "status": "in_progress", "completedTasks": 5, "totalTasks": 8 },
    "review":         { "status": "pending" },
    "report":         { "status": "pending" }
  },
  "signal": 42,
  "tasks": [
    {
      "id": "task-001",
      "title": "Add ScenarioRun model to Prisma schema",
      "type": "database",
      "complexity": "low",
      "model": "fast",
      "status": "completed"
    }
  ]
}
```

### F3. Model Selection
Orchestrator must explicitly mark tasks:

**fast model (80%+ tasks):**
- Add field to Prisma schema
- Create DTO with validation
- Create simple endpoint
- Add metric or log
- Create UI component without complex logic

**default model (20% tasks):**
- Architecture planning
- Complex business logic
- Multi-system integration
- Review with trade-off analysis

### F4. Task Decomposition
Each task must be:
- Completable in 5-10 minutes
- Described in 1-3 sentences
- Bound to a specific skill
- Marked with `complexity: low|medium|high` and recommended model

### F5. Subagent Delegation
Orchestrator does not do the work itself. For each phase it:
1. Reads current `context.json`
2. Forms prompt for subagent
3. Runs subagent via Task tool
4. Receives result
5. Updates `context.json`

### F6. Review Loop
For each domain (database, backend, frontend):
1. Run reviewer subagent (readonly)
2. If failed — run implementer with feedback
3. Repeat up to 3 times
4. If failed after 3 attempts — mark failed, continue

### F7. Retry / Resume
- If orchestrator is interrupted, re-run reads `context.json` and continues from current phase
- Completed phases are not re-executed
- Failed tasks are marked but don't block others

### F8. Final Report
```
Signal Lab PRD Execution — Complete

Tasks: 12 completed, 1 failed, 2 retries
Models: 10 fast, 3 default

Completed:
  ✓ Prisma schema + migration
  ✓ ScenarioService + Controller
  ✓ Prometheus metrics
  ...

Failed:
  ✗ Loki log panel (max retries)

Next steps:
  - Fix Loki panel manually
  - Run /health-check
```

## Acceptance criteria
- Orchestrator skill exists and launches from chat
- `context.json` is created with clear structure
- Tasks broken to atomic level
- Explicit fast/default model separation
- Orchestrator uses other custom and marketplace skills
- Re-run continues from where it stopped
- Final report is readable and useful
