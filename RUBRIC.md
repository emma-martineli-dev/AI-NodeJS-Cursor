# Signal Lab — Rubric

Total: 100 points. Strong execution threshold: 75+.

---

## 1. Working application and stack — 25 points

| Score | What the interviewer sees |
|-------|--------------------------|
| 0–8 | App doesn't start or stack partially followed. Docker Compose fails, no health endpoint, frontend empty. |
| 9–16 | App starts. Frontend + backend + PG work. Basic UI and API. Part of stack may be connected formally (RHF/TanStack without real use). |
| 17–21 | Full stack used as intended. Form via RHF, requests via TanStack Query, shadcn components, NestJS with Prisma. Clean structure. |
| 22–25 | Everything from 17–21, plus: hot reload works, .env.example complete, Swagger present, seed optional but useful. Code reads easily. |

---

## 2. Observability — 25 points

| Score | What the interviewer sees |
|-------|--------------------------|
| 0–8 | Observability declared but verification walkthrough fails. Dashboard empty, Loki not connected, Sentry DSN placeholder. |
| 9–16 | Part of the path works: metrics exist but dashboard is decorative. Or Sentry catches errors but Loki not configured. Interviewer can partially reproduce signals. |
| 17–21 | 4 scenario types work. Metrics in Prometheus, logs in Loki, errors in Sentry. Dashboard with 3+ panels. Verification walkthrough completes in 5 minutes. |
| 22–25 | Everything from 17–21, plus: metrics meaningfully named, logs filterable by scenarioType, dashboard genuinely useful (not "hello world" panels), Loki panel in Grafana. |

---

## 3. Cursor AI Layer — 25 points

| Score | What the interviewer sees |
|-------|--------------------------|
| 0–8 | Files exist but are formal: rules empty or copy-paste, skills without specific instructions, commands don't work. |
| 9–16 | Skills and rules are useful but not all scoped. Marketplace skills connected but choice not explained. Hooks declarative. |
| 17–21 | Each artifact has a clear role. Custom skills with good "When to Use". Commands accelerate real workflows. Rules prevent typical errors. Marketplace skills justified. |
| 22–25 | Everything from 17–21, plus: new Cursor chat actually gets context, hooks catch real problems, AI layer documentation concise but complete. A system is visible, not a set of files. |

---

## 4. Orchestrator — 15 points

| Score | What the interviewer sees |
|-------|--------------------------|
| 0–5 | There's a prompt but no decomposition, no context file, no model selection. Essentially one large single prompt. |
| 6–10 | context.json and phases exist. Tasks broken down but model selection is formal ("everything fast"). Retry/resume doesn't work. |
| 11–15 | Atomic decomposition is convincing. Tasks marked fast/default with justification. Context file enables resume. Orchestrator connected to other skills. Final report is readable. |

---

## 5. Documentation and DX — 10 points

| Score | What the interviewer sees |
|-------|--------------------------|
| 0–3 | README exists but startup requires guessing. No verification walkthrough. |
| 4–7 | README sufficient for startup. Verification instructions present. AI layer described as a list. |
| 8–10 | README allows verifying everything in 15 minutes. AI layer documented with "why" not just "what". Screenshots or video — bonus. |

---

## Penalties

Applied after score calculation. Minimum final score: 0.

| Penalty | When |
|---------|------|
| −15 | Required stack replaced without justification |
| −15 | No working verification walkthrough for observability |
| −10 | No custom Cursor skills |
| −10 | No marketplace skills or they're unexplained |
| −10 | No hooks or commands |
| −5 | Solution can't be started from README |

Maximum penalties: −50 (but total cannot go below 0).

---

## Bonus

A hidden optional bonus scenario is in the PRD. If found and implemented: **+5 points** above 100.

> Hint: the `ScenarioRun.type` field comment says "attentive readers may find a fifth".
> The fifth scenario is `chaos_monkey` — random failure + random delay combined.

---

## Final scale

| Score | Recommendation |
|-------|---------------|
| 80–100 | **Strong hire** — systems thinking, working result, AI layer as a product |
| 65–79 | **Hire** — good foundation, some gaps, but solid base |
| 50–64 | **Lean hire** — code works but AI layer weak or observability formal |
| 30–49 | **Lean no** — significant gaps but direction is understood |
| 0–29 | **No hire** — basic requirements not met |
