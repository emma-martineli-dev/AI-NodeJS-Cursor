---
name: marketplace
description: Six marketplace skills connected to Signal Lab. Explains what each covers and what custom skills fill in the gaps.
version: 1.0.0
---

# Marketplace Skills

## Why marketplace + custom skills together

Marketplace skills cover general best practices for each technology.
Custom skills cover Signal Lab-specific conventions that marketplace skills cannot know:
- Our exact metric naming pattern (`[domain]_[action]_[unit]`)
- Our structured log format (`{ event: 'snake_case_verb_noun', ... }`)
- Our approved library list (TanStack Query, not SWR; shadcn, not MUI)
- Our Prisma schema location and migration workflow
- Our observability 3-pillar requirement on every service method

---

## 1. nestjs-best-practices

**Why:** NestJS has many valid patterns. This skill locks in the ones Signal Lab uses:
module-per-feature, constructor DI, global pipes, global exception filter.
Prevents a new chat from suggesting Express middleware patterns or manual DI.

**Gap covered by custom skills:** `nestjs-patterns.mdc` adds Signal Lab-specific
rules (no logic in controllers, PrismaModule is global, exception map).

---

## 2. prisma-orm

**Why:** Covers Prisma query API, relations, migrations, and type safety.
Prevents a new chat from suggesting raw SQL or TypeORM patterns.

**Gap covered by custom skills:** `prisma-patterns.mdc` adds our specific
forbidden patterns (`$queryRaw`, raw drivers), our schema location
(`signal-lab/prisma/schema.prisma`), and our migration workflow.

---

## 3. next-best-practices (vercel/next.js)

**Why:** Covers App Router conventions, Server vs Client components,
metadata API, and image optimization. Prevents mixing Pages Router patterns
into the App Router codebase.

**Gap covered by custom skills:** `frontend-patterns.mdc` adds our specific
library choices (TanStack Query not SWR, RHF not Formik, shadcn not MUI)
and our `'use client'` minimization rule.

---

## 4. shadcn-ui

**Why:** shadcn/ui components are copy-pasted, not installed as a package.
This skill knows the component API, variant system, and how to extend them.
Prevents a new chat from importing from `@shadcn/ui` (which doesn't exist).

**Gap covered by custom skills:** `shadcn-form.md` skill adds the full
RHF + zod + shadcn integration pattern specific to Signal Lab forms,
including accessibility attributes (`aria-invalid`, `role="alert"`).

---

## 5. tailwind-design-system

**Why:** Covers Tailwind utility classes, responsive design, dark mode with
CSS variables, and the `cn()` utility pattern. Prevents inline styles and
ensures consistent spacing/color usage.

**Gap covered by custom skills:** `frontend-patterns.mdc` adds our specific
CSS variable setup (HSL values in `globals.css`) and the rule that
styled-components/emotion are forbidden.

---

## 6. docker-expert

**Why:** Covers multi-stage Dockerfiles, health checks, volume mounts for
hot reload, and compose service dependencies. Prevents naive single-stage
builds and missing `depends_on` conditions.

**Gap covered by custom skills:** Our `docker-compose.yml` uses
`condition: service_healthy` on postgres and runs `prisma migrate deploy`
as part of the backend startup command — patterns specific to Signal Lab
that marketplace skills don't know.

---

## Coverage map

| Concern | Marketplace skill | Custom rule/skill |
|---------|------------------|-------------------|
| NestJS architecture | nestjs-best-practices | `nestjs-patterns.mdc` |
| Prisma ORM | prisma-orm | `prisma-patterns.mdc` |
| Next.js App Router | next-best-practices | `frontend-patterns.mdc` |
| shadcn/ui components | shadcn-ui | `shadcn-form.md` skill |
| Tailwind CSS | tailwind-design-system | `frontend-patterns.mdc` |
| Docker Compose | docker-expert | `docker-compose.yml` patterns |
| Observability | *(not in marketplace)* | `observability-conventions.mdc` + `observability.md` skill |
| Stack constraints | *(not in marketplace)* | `stack-constraints.mdc` |
| Error handling | *(not in marketplace)* | `error-handling.mdc` |
| Orchestration | *(not in marketplace)* | `orchestrator.md` skill |
