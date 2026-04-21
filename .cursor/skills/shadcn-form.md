---
name: shadcn-form
description: Add a validated form to the Next.js frontend using React Hook Form, zod, and shadcn/ui components.
version: 1.0.0
---

# Skill: shadcn-form

## When to Use
- Adding a new form to the frontend
- A PRD specifies a user input flow
- Replacing an unvalidated form with proper RHF + zod validation
- Adding a mutation-backed form that calls a backend endpoint

## What this skill produces
- A `[Name]Form.tsx` client component
- zod schema with field validation
- RHF integration with error display
- TanStack Query mutation wired to the API
- shadcn Button, Input, Card components

---

## Step 1 — Define the zod schema

```ts
import { z } from 'zod';

const [name]Schema = z.object({
  type: z.string().min(1, 'Type is required').max(100),
  // add fields matching the backend DTO
});

type [Name]FormValues = z.infer<typeof [name]Schema>;
```

---

## Step 2 — API function

Add to `signal-lab/apps/frontend/src/lib/api.ts`:

```ts
export async function create[Name](payload: [Name]FormValues) {
  const res = await fetch(`${BASE}/[resources]`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  if (!res.ok) throw new Error(`Request failed: ${res.status}`);
  return res.json();
}
```

---

## Step 3 — Form component

`signal-lab/apps/frontend/src/components/[Name]Form.tsx`:

```tsx
'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { create[Name] } from '@/lib/api';

const schema = z.object({
  type: z.string().min(1, 'Type is required').max(100),
});
type FormValues = z.infer<typeof schema>;

export function [Name]Form() {
  const queryClient = useQueryClient();

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<FormValues>({ resolver: zodResolver(schema) });

  const mutation = useMutation({
    mutationFn: create[Name],
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['[resources]'] });
      reset();
    },
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle>[Name]</CardTitle>
        <CardDescription>Description of what this form does</CardDescription>
      </CardHeader>
      <CardContent>
        <form
          onSubmit={handleSubmit((values) => mutation.mutate(values))}
          className="flex flex-col gap-3"
        >
          <div className="flex gap-2">
            <Input
              placeholder="Enter type"
              {...register('type')}
              className="flex-1"
              aria-invalid={!!errors.type}
            />
            <Button type="submit" disabled={mutation.isPending}>
              {mutation.isPending ? 'Submitting…' : 'Submit'}
            </Button>
          </div>

          {errors.type && (
            <p className="text-sm text-destructive" role="alert">
              {errors.type.message}
            </p>
          )}

          {mutation.isSuccess && (
            <p className="text-sm text-green-600">
              ✓ Created — ID: <code className="font-mono">{mutation.data.id}</code>
            </p>
          )}

          {mutation.isError && (
            <p className="text-sm text-destructive" role="alert">
              {(mutation.error as Error).message}
            </p>
          )}
        </form>
      </CardContent>
    </Card>
  );
}
```

---

## Step 4 — Add to page

In `signal-lab/apps/frontend/src/app/page.tsx`:

```tsx
import { [Name]Form } from '@/components/[Name]Form';

export default function Page() {
  return (
    <div className="flex flex-col gap-6">
      <[Name]Form />
    </div>
  );
}
```

---

## Checklist
- [ ] zod schema matches backend DTO fields
- [ ] `zodResolver` passed to `useForm`
- [ ] All fields have `{...register('fieldName')}`
- [ ] `errors.[field].message` displayed per field
- [ ] `mutation.isError` displayed
- [ ] `mutation.isSuccess` displayed with result
- [ ] `queryClient.invalidateQueries` called on success
- [ ] `aria-invalid` on inputs with errors (accessibility)
- [ ] `role="alert"` on error messages (accessibility)
