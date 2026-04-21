# Signal Lab — Evaluation Rubric

Total: 100 points

---

## 1. Engineering (35 pts)

### 1.1 Application starts (10 pts)
| Criteria | Points |
|----------|--------|
| `docker compose up -d` starts all services without errors | 4 |
| Frontend accessible at localhost:3000 | 2 |
| Backend accessible at localhost:3001 | 2 |
| `GET /api/health` returns `{ status: "ok", timestamp: "..." }` | 2 |

### 1.2 Scenario execution (10 pts)
| Criteria | Points |
|----------|--------|
| `POST /api/scenarios/run {"type":"load_test"}` → status `completed`, metric populated | 3 |
| `POST /api/scenarios/run {"type":"system_error"}` → status `failed`, error populated | 3 |
| Run history persisted in PostgreSQL via Prisma | 2 |
| Frontend form submits and shows result | 2 |

### 1.3 Observability (15 pts)
| Criteria | Points |
|----------|--------|
| `GET /api/metrics` returns Prometheus text with `scenario_runs_total` | 3 |
| Logs are JSON with `event` field (verifiable via `docker compose logs`) | 3 |
| Sentry receives exception on `system_error` (if DSN configured) | 3 |
| Grafana dashboard loads and shows scenario metrics | 3 |
| Loki has log entries after running a scenario | 3 |

---

## 2. AI Layer (40 pts)

### 2.1 Rules (10 pts)
| Criteria | Points |
|----------|--------|
| Minimum 5 rule files present | 2 |
| Each rule has clear single scope (no overlap) | 2 |
| `stack-constraints.mdc` lists forbidden libraries with examples | 2 |
| `observability-conventions.mdc` has metric naming + log format | 2 |
| Rules have `alwaysApply: true` and correct globs | 2 |

### 2.2 Custom Skills (10 pts)
| Criteria | Points |
|----------|--------|
| Minimum 3 skills present | 2 |
| Each skill has frontmatter (name, description) | 2 |
| Each skill has "When to Use" section | 2 |
| `observability.md` skill covers all 3 pillars with code examples | 2 |
| Skills reference each other correctly (e.g. nestjs-endpoint calls observability) | 2 |

### 2.3 Commands (8 pts)
| Criteria | Points |
|----------|--------|
| Minimum 3 commands present | 2 |
| `/add-endpoint` produces working NestJS slice | 2 |
| `/check-obs` correctly identifies missing pillars | 2 |
| Commands have gate checks (not just instructions) | 2 |

### 2.4 Hooks (6 pts)
| Criteria | Points |
|----------|--------|
| Minimum 2 hooks present as `.json` files | 2 |
| `after-schema-change` hook triggers on schema edit | 2 |
| `after-new-endpoint` hook checks observability on new files | 2 |

### 2.5 Marketplace Skills (6 pts)
| Criteria | Points |
|----------|--------|
| Minimum 6 marketplace skills listed | 2 |
| Each skill has justification for why it's relevant | 2 |
| Gap analysis: what custom skills cover that marketplace doesn't | 2 |

---

## 3. Orchestrator (20 pts)

### 3.1 Structure (5 pts)
| Criteria | Points |
|----------|--------|
| `SKILL.md`, `COORDINATION.md`, `EXAMPLE.md` all present | 2 |
| All 7 phases defined with model assignment | 3 |

### 3.2 Context economy (5 pts)
| Criteria | Points |
|----------|--------|
| Each phase specifies exactly which files to load | 2 |
| Main chat budget documented (~15k tokens) | 1 |
| Token budget breakdown present in EXAMPLE.md | 2 |

### 3.3 Task decomposition (5 pts)
| Criteria | Points |
|----------|--------|
| Tasks have `model: fast|default` field | 2 |
| 80%+ tasks marked as `fast` in example | 1 |
| Each task has `dependsOn`, `files`, `skill` fields | 2 |

### 3.4 Resumability (5 pts)
| Criteria | Points |
|----------|--------|
| Step 0 checks for existing `context.json` | 2 |
| Completed phases are skipped on resume | 2 |
| Resume scenario demonstrated in EXAMPLE.md | 1 |

---

## 4. Documentation (5 pts)

| Criteria | Points |
|----------|--------|
| README sufficient to start in 3 minutes | 2 |
| Demo walkthrough: "click here, see there" | 2 |
| AI layer documented (rules, skills, commands, hooks) | 1 |

---

## Penalties
| Issue | Penalty |
|-------|---------|
| Forbidden library used (Redux, SWR, MUI, Formik, TypeORM) | -5 per library |
| Raw SQL in application code | -5 |
| Hardcoded secrets in committed files | -10 |
| `docker compose up -d` fails | -15 |
| Stack element replaced without justification | -10 |
