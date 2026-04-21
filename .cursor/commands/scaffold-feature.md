# Command: scaffold:feature

**Trigger:** "scaffold:feature [name]" | "scaffold feature [name]" | "add feature [name]"

Builds a complete feature end-to-end in 6 ordered steps.
Each step has a gate — do not proceed if the gate fails.

---

## Pre-flight

Before starting, read:
- `signal-lab/apps/api/src/app.module.ts` — current module imports
- `prisma/schema.prisma` — current models
- `signal-lab/apps/web/src/components/ScenarioForm.tsx` — UI reference pattern

Derive from `[name]`:
- `Resource` = PascalCase (e.g. `alert` → `Alert`)
- `resource` = camelCase (e.g. `alert`)
- `resources` = plural camelCase (e.g. `alerts`)

---

## Step 1 — DB schema
**Skill:** edit `prisma/schema.prisma`

Add:
```prisma
model [Resource] {
  id        String   @id @default(uuid())
  name      String
  status    String   @default("pending")
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
}
```

Run:
```bash
npx prisma db push
npx prisma generate
```

**Gate:** `npx prisma db push` exits 0 and `npx prisma generate` produces updated client.

---

## Step 2 — API feature slice
**Skill:** `create-endpoint`

Execute the full `create-endpoint` skill for `[resource]`.
Produces: DTO → Service → Controller → Module → wired into AppModule.

**Gate:**
```bash
curl -s -X POST http://localhost:3001/api/[resources] \
  -H "Content-Type: application/json" \
  -d '{"name":"gate-test"}' | jq -r .status
# must return: pending
```

---

## Step 3 — Prometheus metrics
**Skill:** `add-metric`

If `MetricsModule` does not exist yet, create it (full `add-metric` skill).
If it exists, only do Step 5 of `add-metric` — instrument the new `[Resource]Service`.

Add to `MetricsService`:
```ts
readonly [resource]Counter = new Counter({
  name: '[resource]_runs_total',
  help: 'Total [resource] operations',
  labelNames: ['status'] as const,
  registers: [this.registry],
});
```

**Gate:**
```bash
curl -s http://localhost:3001/api/metrics | grep [resource]_runs_total
# must return a metric line
```

---

## Step 4 — Structured logs + observability audit
**Skill:** `observability-check`

Run `observability-check` on `signal-lab/apps/api/src/[resource]/[resource].service.ts`.

**Gate:** All 3 pillars PASS — logs ✅ metrics ✅ errors ✅

If any pillar fails, fix it before proceeding to Step 5.

---

## Step 5 — UI component

Create `signal-lab/apps/web/src/components/[Resource]Form.tsx`:

```tsx
"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";

const BASE = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3001/api";

const schema = z.object({ name: z.string().min(1, "Name is required") });
type FormValues = z.infer<typeof schema>;

export function [Resource]Form() {
  const queryClient = useQueryClient();
  const { register, handleSubmit, formState: { errors } } = useForm<FormValues>({
    resolver: zodResolver(schema),
  });

  const mutation = useMutation({
    mutationFn: async (values: FormValues) => {
      const res = await fetch(`${BASE}/[resources]`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(values),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      return res.json();
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["[resources]"] }),
  });

  return (
    <section className="card">
      <h2>[Resource]</h2>
      <form onSubmit={handleSubmit((v) => mutation.mutate(v))} className="form">
        <div className="field">
          <label htmlFor="[resource]-name">Name</label>
          <input id="[resource]-name" {...register("name")} placeholder="[resource] name" />
          {errors.name && <span className="error">{errors.name.message}</span>}
        </div>
        <div className="actions">
          <button type="submit" className="btn btn-primary" disabled={mutation.isPending}>
            {mutation.isPending ? "Running…" : "Run [resource]"}
          </button>
        </div>
      </form>
      {mutation.isSuccess && (
        <div className={`result result--${mutation.data.status}`}>
          {mutation.data.status.toUpperCase()} — {mutation.data.name}
        </div>
      )}
    </section>
  );
}
```

Add `<[Resource]Form />` to `signal-lab/apps/web/src/app/page.tsx`.

**Gate:** Component renders in browser without console errors.

---

## Step 6 — Health check

```bash
node signal-lab/scripts/healthcheck.mjs
```

**Gate:** All 6 services report PASS.

---

## Final summary output

```
scaffold:feature [name] — complete

  [1/6] ✅ DB schema       — [Resource] model created, db push OK
  [2/6] ✅ API slice        — POST/GET /api/[resources] live
  [3/6] ✅ Metrics          — [resource]_runs_total registered
  [4/6] ✅ Observability    — 3/3 pillars PASS
  [5/6] ✅ UI component     — [Resource]Form rendered
  [6/6] ✅ Health check     — all services PASS
```
