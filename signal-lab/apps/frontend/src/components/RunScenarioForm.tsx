'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { runScenario } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

const schema = z.object({
  type: z.string().min(1, 'Scenario type is required'),
});

type FormValues = z.infer<typeof schema>;

export function RunScenarioForm() {
  const queryClient = useQueryClient();

  const { register, handleSubmit, reset, formState: { errors } } = useForm<FormValues>({
    resolver: zodResolver(schema),
  });

  const mutation = useMutation({
    mutationFn: (values: FormValues) => runScenario({ type: values.type }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['runs'] });
      reset();
    },
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle>Run Scenario</CardTitle>
        <CardDescription>Trigger a new scenario run</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit((v) => mutation.mutate(v))} className="flex flex-col gap-3">
          <div className="flex gap-2">
            <Input
              placeholder="Scenario type (e.g. load_test)"
              {...register('type')}
              className="flex-1"
            />
            <Button type="submit" disabled={mutation.isPending}>
              {mutation.isPending ? 'Running…' : 'Run'}
            </Button>
          </div>

          {errors.type && (
            <p className="text-sm text-destructive">{errors.type.message}</p>
          )}

          {mutation.isSuccess && (
            <p className="text-sm text-green-600">
              ✓ Run created — ID: <code className="font-mono">{mutation.data.id}</code>
            </p>
          )}

          {mutation.isError && (
            <p className="text-sm text-destructive">
              {(mutation.error as Error).message}
            </p>
          )}
        </form>
      </CardContent>
    </Card>
  );
}
