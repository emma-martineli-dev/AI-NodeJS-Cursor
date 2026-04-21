import { ScenarioForm } from "@/components/ScenarioForm";
import { RunHistory } from "@/components/RunHistory";
import { ObservabilityLinks } from "@/components/ObservabilityLinks";

export default function Home() {
  return (
    <main className="layout">
      <h1>⚡ Signal Lab</h1>
      <ScenarioForm />
      <RunHistory />
      <ObservabilityLinks />
    </main>
  );
}
