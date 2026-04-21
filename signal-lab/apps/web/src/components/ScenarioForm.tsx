"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { postScenario } from "@/lib/api";

const schema = z.object({
  name: z.string().min(1, "Scenario name is required"),
});

type FormValues = z.infer<typeof schema>;

export function ScenarioForm() {
  const queryClient = useQueryClient();

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm<FormValues>({ resolver: zodResolver(schema) });

  const mutation = useMutation({
    mutationFn: (values: FormValues) => postScenario(values.name),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["runs"] }),
  });

  const onSubmit = (values: FormValues) => mutation.mutate(values);

  return (
    <section className="card">
      <h2>Run Scenario</h2>

      <form onSubmit={handleSubmit(onSubmit)} className="form">
        <div className="field">
          <label htmlFor="name">Scenario name</label>
          <input id="name" placeholder="e.g. load_test" {...register("name")} />
          {errors.name && <span className="error">{errors.name.message}</span>}
        </div>

        <div className="actions">
          <button type="submit" disabled={mutation.isPending} className="btn btn-primary">
            {mutation.isPending ? "Running…" : "Run scenario"}
          </button>

          <button
            type="button"
            className="btn btn-danger"
            disabled={mutation.isPending}
            onClick={() => {
              setValue("name", "system_error");
              handleSubmit(onSubmit)();
            }}
          >
            Run system_error
          </button>
        </div>
      </form>

      {mutation.isSuccess && (
        <div className={`result result--${mutation.data.status}`}>
          <strong>{mutation.data.status.toUpperCase()}</strong>
          {mutation.data.metric != null && <span> · metric: {mutation.data.metric}</span>}
          {mutation.data.error && <span> · {mutation.data.error}</span>}
        </div>
      )}

      {mutation.isError && (
        <div className="result result--failed">
          Request failed: {(mutation.error as Error).message}
        </div>
      )}
    </section>
  );
}
