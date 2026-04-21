# PRD 003 — Signal Lab: Cursor AI Layer

## Goal
Turn the repository into an environment where a new Cursor chat can continue development
without manual onboarding. Create rules, skills, commands, hooks, and marketplace skills.

## Why this matters
Without an AI layer, every new chat:
- Doesn't know the stack and constraints
- Doesn't know observability conventions
- May add Redux instead of TanStack Query, or SWR instead of TanStack Query
- Has no ready workflows for common tasks

## Requirements

### R1. Rules (.cursor/rules/)
Minimum coverage:

| Rule | What it fixes |
|------|--------------|
| stack-constraints | Forbidden and approved libraries |
| observability-conventions | Metric naming, log format, when to send to Sentry |
| prisma-patterns | How to use Prisma, what's forbidden (raw SQL, other ORMs) |
| frontend-patterns | TanStack Query for server state, RHF for forms, shadcn for UI |
| error-handling | How to handle errors on backend and frontend |
| nestjs-patterns | Controller/service/module/DTO layer rules |

Rules must not conflict. Each rule — 1 file with clear scope.

### R2. Custom Skills (.cursor/skills/)
Minimum 3 custom skills. Required:
- **Observability skill** — how to add metrics, logs, Sentry to a new endpoint
- 2 more of candidate's choice

Each skill must have:
- SKILL.md with frontmatter (name, description)
- Clear "When to Use" section
- Specific instructions, not general advice
- Max 500 lines (progressive disclosure via additional files)

### R3. Commands (.cursor/commands/)
Minimum 3 commands:
- `/add-endpoint` — scaffold new NestJS endpoint with observability
- `/check-obs` — verify observability is connected correctly
- `/run-prd` — run PRD implementation via orchestrator
- `/health-check` — check docker stack status

### R4. Hooks
Minimum 2 hooks with real value:
- After schema change: remind about migration and type update
- After new endpoint: check that metrics and logging are added

### R5. Marketplace Skills
Minimum 6 connected marketplace skills relevant to the stack:
- next-best-practices or vercel-react-best-practices
- shadcn-ui
- tailwind-design-system or tailwind-v4-shadcn
- nestjs-best-practices
- prisma-orm
- docker-expert

Candidate must explain why each was chosen and what custom skills cover that marketplace skills don't.

### R6. AI Layer Documentation
Separate file or README section:
- List of all rules and what each fixes
- List of skills and when to use
- List of commands
- List of hooks and what problem they solve
- List of marketplace skills and why each

## Acceptance criteria
- Minimum 5 rule files with clear scope
- Minimum 3 custom skills with frontmatter and "When to Use"
- Minimum 3 commands
- Minimum 2 hooks with problem description
- Minimum 6 marketplace skills with justification
- New Cursor chat can continue work on PRD without manual context
