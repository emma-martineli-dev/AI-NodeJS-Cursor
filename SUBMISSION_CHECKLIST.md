# Signal Lab — Submission Checklist

---

## Репозиторий

**URL:** https://github.com/emma-martineli-dev/AI-NodeJS-Cursor  
**Ветка:** main  
**Время работы:** ~8 часов

---

## Запуск

```bash
# Команда запуска:
git clone https://github.com/emma-martineli-dev/AI-NodeJS-Cursor
cd AI-NodeJS-Cursor
docker compose up -d

# Команда проверки:
curl http://localhost:3001/api/health

# Команда остановки:
docker compose down
```

**Предусловия:**
- Docker Desktop 24+ (с Docker Compose v2)
- Свободные порты: 3000, 3001, 3100, 3200, 5432, 9090
- Node.js 20+ нужен только для локальной разработки без Docker

---

## Стек — подтверждение использования

| Технология | Используется? | Где посмотреть |
|-----------|--------------|----------------|
| Next.js (App Router) | ✅ | `signal-lab/apps/frontend/src/app/` — layout.tsx, page.tsx |
| shadcn/ui | ✅ | `signal-lab/apps/frontend/src/components/ui/` — button, card, input |
| Tailwind CSS | ✅ | `signal-lab/apps/frontend/tailwind.config.ts`, globals.css |
| TanStack Query | ✅ | `RunHistory.tsx`, `HealthStatus.tsx` — useQuery + useMutation |
| React Hook Form | ✅ | `RunScenarioForm.tsx` — useForm + zodResolver |
| NestJS | ✅ | `signal-lab/apps/backend/src/` — modules, controllers, services |
| PostgreSQL | ✅ | docker-compose.yml — postgres:16-alpine, port 5432 |
| Prisma | ✅ | `signal-lab/prisma/schema.prisma` + migrations/ |
| Sentry | ✅ | `main.ts` Sentry.init + `scenarios.service.ts` captureException |
| Prometheus | ✅ | `GET /api/metrics` — prom-client, scraped every 15s |
| Grafana | ✅ | http://localhost:3200 — provisioned dashboard, 7 panels |
| Loki | ✅ | Promtail scrapes container stdout → Loki → Grafana logs panels |

---

## Observability Verification

| Сигнал | Как воспроизвести | Где посмотреть результат |
|--------|------------------|--------------------------|
| Prometheus metric | `curl -X POST http://localhost:3001/api/scenarios/run -H "Content-Type: application/json" -d '{"type":"load_test"}'` | `curl http://localhost:3001/api/metrics \| grep scenario_runs_total` → строка с `status="completed"` |
| Grafana dashboard | Запустить 3-4 сценария разных типов | http://localhost:3200 → Dashboards → Signal Lab → панели "Runs per minute" и "Error rate" обновятся |
| Loki log | `curl -X POST http://localhost:3001/api/scenarios/run -d '{"type":"slow_query"}' -H "Content-Type: application/json"` | `docker compose logs backend \| grep '"event"'` или Grafana → панель "All scenario logs" |
| Sentry exception | `curl -X POST http://localhost:3001/api/scenarios/run -d '{"type":"system_error"}' -H "Content-Type: application/json"` | Sentry dashboard (требует `SENTRY_DSN` в `.env`) — новый event с тегом `type=system_error` |

**Bonus — chaos_monkey:**
```bash
# Запустить 4 раза — ~50% упадут, ~50% пройдут
for i in 1 2 3 4; do
  curl -s -X POST http://localhost:3001/api/scenarios/run \
    -H "Content-Type: application/json" \
    -d '{"type":"chaos_monkey"}' | jq '{status,error}'
done
```
Grafana → панель "chaos_monkey success rate" покажет ~50% gauge.

---

## Cursor AI Layer

### Custom Skills

| # | Skill name | Назначение |
|---|-----------|-----------|
| 1 | `observability` | Добавить все 3 столпа (логи + метрики + Sentry) к любому service методу. Включает checklist и пошаговые инструкции с реальным кодом. |
| 2 | `nestjs-endpoint` | Сгенерировать полный NestJS feature slice: DTO → Service → Controller → Module → AppModule → Prisma model. |
| 3 | `shadcn-form` | Добавить форму с RHF + zod + shadcn компонентами + TanStack Query mutation. Включает accessibility атрибуты. |
| 4 | `orchestrator` (signal-lab-orchestrator) | AI brain: 7-фазный pipeline с context economy, atomic decomposition, resume logic. |

### Commands

| # | Command | Что делает |
|---|---------|-----------|
| 1 | `/add-endpoint [resource]` | Scaffold полного NestJS endpoint с observability. Запускает `nestjs-endpoint` + `observability` skills, проверяет gate через curl. |
| 2 | `/check-obs [service?]` | Аудит всех (или одного) service на 3 столпа observability. Выдаёт PASS/FAIL по каждому столпу с auto-fix инструкциями. |
| 3 | `/run-prd [prd-file]` | Запускает PRD через orchestrator: анализ → план → декомпозиция → реализация → review. |
| 4 | `/health-check` | Проверяет все Docker сервисы через `healthcheck.mjs`. Выдаёт PASS/FAIL по каждому. |

### Hooks

| # | Hook | Какую проблему решает |
|---|------|----------------------|
| 1 | `after-schema-change` | Разработчик редактирует `schema.prisma` и забывает запустить `prisma migrate dev` и `prisma generate`. Это приводит к runtime ошибкам где DB schema и Prisma client рассинхронизированы — часто обнаруживается только в продакшне. |
| 2 | `after-new-endpoint` | Новый `*.service.ts` или `*.controller.ts` создаётся без observability столпов. Endpoint уходит в прод невидимым для Grafana и Loki. Hook автоматически запускает `/check-obs` на новом файле. |

### Rules

| # | Rule file | Что фиксирует |
|---|-----------|--------------|
| 1 | `stack-constraints.mdc` | Запрещённые и разрешённые библиотеки. Предотвращает Redux, SWR, MUI, Formik, TypeORM. Таблица approved/forbidden с примерами кода. |
| 2 | `nestjs-patterns.mdc` | Controller/service/module/DTO layer rules. Предотвращает бизнес-логику в контроллерах, ручной DI, untyped body. |
| 3 | `prisma-patterns.mdc` | Только Prisma через PrismaService. Запрещает `$queryRaw`, raw drivers, manual DDL, дублирование типов. |
| 4 | `frontend-patterns.mdc` | TanStack Query для server state, RHF для форм, shadcn для UI, Tailwind для layout. Предотвращает `useEffect+fetch`, Formik, MUI, inline styles. |
| 5 | `observability-conventions.mdc` | Naming для метрик (`[domain]_[action]_[unit]`), format для логов (`{ event: 'snake_case' }`), когда кидать в Sentry. |
| 6 | `error-handling.mdc` | NestJS exception types, паттерн catch block в service, обработка error states на frontend. |

### Marketplace Skills

| # | Skill | Зачем подключён |
|---|-------|----------------|
| 1 | `nestjs-best-practices` | NestJS module/DI/pipe conventions. Предотвращает Express middleware паттерны и ручной DI. |
| 2 | `prisma-orm` | Prisma query API, relations, migrations, type safety. Предотвращает TypeORM паттерны. |
| 3 | `next-best-practices` | App Router conventions, Server vs Client components, metadata API. Предотвращает смешивание Pages Router паттернов. |
| 4 | `shadcn-ui` | Component API, variant system, copy-paste model. Предотвращает `import from '@shadcn/ui'` (не существует). |
| 5 | `tailwind-design-system` | Utility classes, CSS variables, responsive design. Предотвращает inline styles и emotion/styled-components. |
| 6 | `docker-expert` | Multi-stage builds, health checks, hot reload volumes. Предотвращает наивные single-stage builds. |

**Что закрыли custom skills, чего нет в marketplace:**
- **Observability 3-pillar requirement** — ни один marketplace skill не знает наш конкретный паттерн: `{ event: 'snake_case' }` в логах, `[domain]_[action]_[unit]` в метриках, `Sentry.captureException(err, { tags, extra })` обязательно в каждом catch. Это Signal Lab-специфично.
- **Stack constraints** — marketplace skills знают свою технологию, но не знают что в нашем проекте запрещены Redux, SWR, MUI. Только `stack-constraints.mdc` фиксирует полный список forbidden/approved.
- **Orchestrator** — нет marketplace skill для multi-agent PRD execution с context economy и resume logic.
- **Error handling cross-layer** — нет skill который покрывает и NestJS exceptions (backend) и TanStack Query error states (frontend) как единую систему.

---

## Orchestrator

**Путь к skill:** `.cursor/skills/signal-lab-orchestrator/SKILL.md`  
**Путь к context file (пример):** `.execution/2026-04-22-14-30/context.json`  
**Сколько фаз:** 7 (analysis → codebase → planning → decomposition → implementation → review → report)

**Какие задачи для fast model:**
- Добавить поле в Prisma schema
- Создать DTO с валидацией
- Создать простой CRUD endpoint
- Добавить метрику или лог в существующий service
- Создать UI компонент без сложной логики
- Init Sentry в main.ts
- Создать MetricsController

**Поддерживает resume:** да — Step 0 читает `.execution/<id>/context.json`, пропускает completed фазы, продолжает с `currentPhase`.

---

## Скриншоты / видео

Для верификации без запуска — см. DEMO.md с пошаговыми curl командами и ожидаемыми ответами.

Grafana dashboard: http://localhost:3200 → Dashboards → Signal Lab  
7 панелей: runs/min, error rate, duration p50/p95, total stats, chaos_monkey gauge, all logs, failed logs.

---

## Что не успел и что сделал бы первым при +4 часах

1. **Seed файл** — `prisma/seed.ts` с 10-20 pre-populated ScenarioRun записями разных типов. Grafana dashboard сразу показывал бы данные без ручного запуска сценариев.
2. **Prometheus metrics в MetricsModule** — сейчас метрики определены в `scenarios.service.ts`. При +4 часах вынес бы в отдельный `MetricsService` с `@Global()` модулем, как описано в `add-metric` skill.
3. **Frontend quick-fire buttons** — кнопки "Run load_test", "Run system_error", "Run chaos_monkey" прямо в UI без ввода текста. Сейчас есть только текстовый input.
4. **E2E тест** — один Playwright тест: открыть UI → нажать Run → проверить что строка появилась в таблице. Доказывает end-to-end flow автоматически.

---

## Вопросы для защиты

**Почему именно такая декомпозиция skills?**  
Каждый skill закрывает один повторяющийся workflow: `nestjs-endpoint` — новый ресурс, `observability` — инструментирование, `shadcn-form` — UI форма. Они не пересекаются по scope и вызывают друг друга явно (nestjs-endpoint вызывает observability в финальном шаге). Это позволяет orchestrator'у назначать минимальный контекст на каждый шаг.

**Какие задачи подходят для малой модели и почему?**  
Задачи с детерминированным шаблоном и ограниченным контекстом: добавить поле в schema (1 файл, 1 строка), создать DTO (шаблон из skill), добавить метрику (inject + 2 строки). Малая модель не принимает архитектурных решений — она заполняет шаблон. Сложные задачи (интеграция нескольких систем, review с trade-offs) требуют default модели потому что нужно удерживать несколько файлов и принимать решения.

**Какие marketplace skills подключил, а какие заменил custom — и почему?**  
Marketplace skills покрывают общие best practices технологии. Custom skills покрывают Signal Lab-специфичные conventions: наш metric naming pattern, наш 3-pillar observability requirement, наш approved library list. Marketplace skill `nestjs-best-practices` не знает что у нас `PrismaModule` глобальный и `MetricsModule` тоже — это фиксирует `nestjs-patterns.mdc`. Observability вообще нет в marketplace — это полностью custom.

**Какие hooks реально снижают ошибки в повседневной работе?**  
`after-schema-change` — самая частая ошибка в Prisma проектах: изменил schema, забыл `generate`, получил runtime error через 2 часа. Hook срабатывает сразу при сохранении файла. `after-new-endpoint` — второй по частоте: создал service, не добавил метрики, endpoint невидим в Grafana. Hook запускает `/check-obs` автоматически, не давая забыть.

**Как orchestrator экономит контекст по сравнению с одним большим промптом?**  
Один большой промпт загружает весь codebase (~80-100k токенов) и держит его на протяжении всей реализации. Orchestrator загружает только то что нужно конкретному шагу: analysis читает только PRD (~1.5k), task-001 читает только 1-2 файла (~2k). Итого ~36k токенов на весь PRD против ~80-100k. Экономия ~60%. Плюс каждый subagent работает с чистым контекстом без "шума" от предыдущих шагов.
