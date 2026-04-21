'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { runScenario } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

const SCENARIO_TYPES = [
  { value: 'success',          label: 'success — completes normally' },
  { value: 'validation_error', label: 'validation_error — returns 400' },
  { value: 'system_error',     label: 'system_error — throws 500 + Sentry' },
  { value: 'slow_request',     label: 'slow_request — 2-5s delay' },
  { value: 'chaos_monkey',     label: 'chaos_monkey — random failure' },
  { value: 'teapot',           label: 'teapot — 🫖 Easter egg' },
];

const schema = z.object({
  type: z.string().min(1, 'Select a scenario type'),
  name: z.string().max(100).optional(),
});

type FormValues = z.infer<typeof schema>;

export function RunScenarioForm() {
  const queryClient = useQueryClient();
  const [toast, setToast] = useState<{ kind: 'success' | 'error'; message: string } | null>(null);

  const { register, handleSubmit, reset, formState: { errors } } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { type: 'success' },
  });

  const mutation = useMutation({
    mutationFn: (values: FormValues) =>
      runScenario({ type: values.type, name: values.name }),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['runs'] });
      setToast({ kind: 'success', message: `✓ Run ${data.id.slice(0, 8)}… — ${data.status}` });
      reset({ type: 'success' });
      setTimeout(() => setToast(null), 4000);
    },
    onError: (err) => {
      setToast({ kind: 'error', message: `✗ ${(err as Error).message}` });
      setTimeout(() => setToast(null), 4000);
    },
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle>Run Scenario</CardTitle>
        <CardDescription>Select a scenario type and trigger a run</CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-3">
        <form
          onSubmit={handleSubmit((v) => mutation.mutate(v))}
          className="flex flex-col gap-3"
        >
          {/* Select — scenario type */}
          <div className="flex flex-col gap-1">
            <label htmlFor="type" className="text-sm text-muted-foreground">
              Scenario type
            </label>
            <Select id="type" {...register('type')} aria-invalid={!!errors.type}>
              {SCENARIO_TYPES.map((s) => (
                <option key={s.value} value={s.value}>{s.label}</option>
              ))}
            </Select>
            {errors.type && (
              <p className="text-xs text-destructive" role="alert">{errors.type.message}</p>
            )}
          </div>

          {/* Optional name input */}
          <div className="flex flex-col gap-1">
            <label htmlFor="name" className="text-sm text-muted-foreground">
              Name <span className="text-xs">(optional)</span>
            </label>
            <Input
              id="name"
              placeholder="e.g. my-test-run"
              {...register('name')}
            />
          </div>

          <Button type="submit" disabled={mutation.isPending} className="w-full">
            {mutation.isPending ? 'Running…' : 'Run Scenario'}
          </Button>
        </form>

        {/* Toast */}
        {toast && (
          <div
            role="alert"
            className={`rounded-md px-4 py-2 text-sm font-medium ${
              toast.kind === 'success'
                ? 'bg-green-50 text-green-800 border border-green-200'
                : 'bg-red-50 text-red-800 border border-red-200'
            }`}
          >
            {toast.message}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
