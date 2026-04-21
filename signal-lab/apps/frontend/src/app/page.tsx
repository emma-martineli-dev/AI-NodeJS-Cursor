import { HealthStatus } from '@/components/HealthStatus';
import { RunScenarioForm } from '@/components/RunScenarioForm';
import { RunHistory } from '@/components/RunHistory';
import { ObservabilityLinks } from '@/components/ObservabilityLinks';

export default function HomePage() {
  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Signal Lab</h1>
        <p className="mt-1 text-muted-foreground">
          Observability playground — run scenarios, watch signals in Grafana, Loki, Sentry
        </p>
      </div>

      <HealthStatus />
      <RunScenarioForm />
      <RunHistory />
      <ObservabilityLinks />
    </div>
  );
}
