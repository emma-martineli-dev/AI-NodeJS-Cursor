import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

const LINKS = [
  {
    icon: '📊',
    label: 'Grafana Dashboard',
    href: 'http://localhost:3200',
    hint: 'Signal Lab dashboard — metrics + logs',
  },
  {
    icon: '🪵',
    label: 'Loki Logs',
    href: 'http://localhost:3200/explore?orgId=1&left=%7B%22datasource%22%3A%22loki%22%7D',
    hint: 'Query: {app="signal-lab"} | json',
  },
  {
    icon: '📈',
    label: 'Prometheus',
    href: 'http://localhost:9090',
    hint: 'Query: scenario_runs_total',
  },
  {
    icon: '🐛',
    label: 'Sentry',
    href: 'https://sentry.io',
    hint: 'Check for system_error exceptions',
  },
  {
    icon: '⚙️',
    label: 'Raw Metrics',
    href: 'http://localhost:3001/metrics',
    hint: 'Prometheus text format',
  },
];

export function ObservabilityLinks() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Observability</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {LINKS.map((link) => (
            <a
              key={link.label}
              href={link.href}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-start gap-3 rounded-md border p-3 hover:bg-muted transition-colors"
            >
              <span className="text-xl">{link.icon}</span>
              <div>
                <p className="text-sm font-medium">{link.label}</p>
                <p className="text-xs text-muted-foreground font-mono">{link.hint}</p>
              </div>
            </a>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
