const LINKS = [
  {
    label: "Grafana",
    href: "http://localhost:3200",
    description: "Metrics & logs dashboard",
    icon: "📊",
  },
  {
    label: "Loki",
    href: "http://localhost:3200/explore?orgId=1&left=%7B%22datasource%22%3A%22loki%22%7D",
    description: "Log explorer",
    icon: "🪵",
  },
  {
    label: "Metrics",
    href: "http://localhost:9090",
    description: "Prometheus",
    icon: "📈",
  },
];

export function ObservabilityLinks() {
  return (
    <section className="card">
      <h2>Observability</h2>
      <div className="links">
        {LINKS.map((link) => (
          <a
            key={link.label}
            href={link.href}
            target="_blank"
            rel="noopener noreferrer"
            className="link-btn"
          >
            <span className="link-icon">{link.icon}</span>
            <span>
              <strong>{link.label}</strong>
              <small>{link.description}</small>
            </span>
          </a>
        ))}
      </div>
    </section>
  );
}
