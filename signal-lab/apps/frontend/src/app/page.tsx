import { HealthStatus } from '@/components/HealthStatus';
import { RunScenarioForm } from '@/components/RunScenarioForm';
import { RunHistory } from '@/components/RunHistory';

export default function HomePage() {
  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
        <p className="mt-1 text-muted-foreground">Run and monitor scenarios</p>
      </div>

      <HealthStatus />
      <RunScenarioForm />
      <RunHistory />
    </div>
  );
}
