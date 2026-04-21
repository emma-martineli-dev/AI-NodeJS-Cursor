# /run-prd

Execute a PRD through the orchestrator. Breaks it into steps, assigns each to the right skill, gates each step before proceeding.

## Usage
```
/run-prd [prd-file-or-description]
```
Examples:
```
/run-prd PRD 002
/run-prd "Add alert notifications feature"
```

## Agent instructions

You are the orchestrator. Follow `.cursor/skills/orchestrator.md` exactly.

### 1. Parse the PRD

Read the PRD file or description. Extract:
- Feature name (kebab-case for file paths)
- Layers affected: DB / API / Frontend / Infra
- New resources vs extensions to existing ones
- Acceptance criteria (these become gates)

### 2. Select step template

From `orchestrator.md`, pick the closest task type:
- New resource → "New feature from scratch" template
- Extend existing → "Extend existing feature" template
- Bug → "Bug fix" template
- Missing observability → "Observability gap" template

### 3. ANNOUNCE the plan

Print the full step list with budget, skill, reads, writes, and gate for each step.
**Do not execute anything until the plan is printed.**

### 4. Execute steps sequentially

For each step:
1. Load only the files in `Reads` (context economy)
2. Execute the assigned skill or direct edit
3. Run the gate command
4. If gate passes → print `[N/total] ✅ [label]` and proceed
5. If gate fails → diagnose, fix, retry once
6. If retry fails → print `BLOCKED` and stop

### 5. Final report

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
/run-prd [name] — complete
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  [1/N] ✅  [label]
  [2/N] ✅  [label]
  ...
  Files changed: X
  Files read: Y (context economy: Z files not loaded)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

## Rules during execution
- Never load the full codebase — use budget levels from `orchestrator.md`
- Never skip a gate — acceptance criteria are non-negotiable
- Never run two steps in parallel
- If a step requires a library not in `stack-constraints.mdc`, stop and flag it
