'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { runScenario } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { FormField } from '@/components/ui/form-field';
import { Toast } from '@/components/ui/toast';

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
type ToastState = { kind: 'success' | 'error'; message: string } | null;

export function RunScenarioForm() {
  const queryClient = useQueryClient();
  const [toast, setToast] = useState<ToastState>(null);

  const { register, handleSubmit, reset, formState: { errors } } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { type: 'success' },
  });

  const showToast = (kind: 'success' | 'error', message: string) => {
    setToast({ kind, message });
    setTimeout(() => setToast(null), 4000);
  };

  const mutation = useMutation({
    mutationFn: (v: FormValues) => runScenario({ type: v.type, name: v.name }),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['runs'] });
      showToast('success', `✓ Run ${data.id.slice(0, 8)}… — ${data.status}`);
      reset({ type: 'success' });
    },
    onError: (err) => showToast('error', `✗ ${(err as Error).message}`),
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle>Run Scenario</CardTitle>
        <CardDescription>Select a type and trigger a run</CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-3">
        <form onSubmit={handleSubmit((v) => mutation.mutate(v))} className="flex flex-col gap-3">
          <FormField id="type" label="Scenario type" error={errors.type?.message}>
            <Select id="type" {...register('type')} aria-invalid={!!errors.type}>
              {SCENARIO_TYPES.map(({ value, label }) => (
                <option key={value} value={value}>{label}</option>
              ))}
            </Select>
          </FormField>

          <FormField id="name" label="Name" hint="optional">
            <Input id="name" placeholder="e.g. my-test-run" {...register('name')} />
          </FormField>

          <Button type="submit" disabled={mutation.isPending} className="w-full">
            {mutation.isPending ? 'Running…' : 'Run Scenario'}
          </Button>
        </form>

        {toast && <Toast kind={toast.kind} message={toast.message} />}
      </CardContent>
    </Card>
  );
}
