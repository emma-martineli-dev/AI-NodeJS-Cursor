#!/usr/bin/env node
// Signal Lab — health check (Node.js, cross-platform)
// Usage: node scripts/healthcheck.mjs
// Exits 0 if all checks pass, 1 if any fail.

const RESET  = "\x1b[0m";
const GREEN  = "\x1b[32m";
const RED    = "\x1b[31m";
const BOLD   = "\x1b[1m";
const PASS   = `${GREEN}PASS${RESET}`;
const FAIL   = `${RED}FAIL${RESET}`;

let overall = 0;

// ── helpers ──────────────────────────────────────────────────────────────────

async function checkHttp(name, url, expectedStatus = 200) {
  try {
    const res = await fetch(url, { signal: AbortSignal.timeout(5000) });
    if (res.status === expectedStatus) {
      log(name, PASS, url);
    } else {
      log(name, FAIL, url, `got HTTP ${res.status}`);
      overall = 1;
    }
  } catch (err) {
    log(name, FAIL, url, err.cause?.code ?? err.message);
    overall = 1;
  }
}

async function checkPostgres() {
  const name = "postgres";
  const url  = process.env.DATABASE_URL;

  if (!url) {
    log(name, FAIL, "(no DATABASE_URL)", "env var missing");
    overall = 1;
    return;
  }

  // Parse host:port from the URL for display
  try {
    const { hostname, port, pathname } = new URL(url);
    const display = `${hostname}:${port || 5432}${pathname}`;

    // Use pg if available, otherwise fall back to a TCP probe
    try {
      const { default: pg } = await import("pg");
      const client = new pg.Client({ connectionString: url, connectionTimeoutMillis: 5000 });
      await client.connect();
      await client.query("SELECT 1");
      await client.end();
      log(name, PASS, display);
    } catch {
      // pg not installed — TCP probe
      await tcpProbe(hostname, Number(port) || 5432);
      log(name, PASS, display, "TCP only");
    }
  } catch (err) {
    log(name, FAIL, url, err.message);
    overall = 1;
  }
}

function tcpProbe(host, port) {
  return new Promise(async (resolve, reject) => {
    const { createConnection } = await import("net");
    const sock = createConnection({ host, port, timeout: 5000 });
    sock.once("connect", () => { sock.destroy(); resolve(); });
    sock.once("error",   (e) => { sock.destroy(); reject(e); });
    sock.once("timeout", ()  => { sock.destroy(); reject(new Error("timeout")); });
  });
}

function log(name, verdict, url, note = "") {
  const n = name.padEnd(14);
  const suffix = note ? `  — ${note}` : "";
  console.log(`  ${n} ${verdict}  (${url})${suffix}`);
}

// ── checks ───────────────────────────────────────────────────────────────────

console.log(`
${BOLD}┌─────────────────────────────────────────┐
│        Signal Lab — Health Check         │
└─────────────────────────────────────────┘${RESET}
`);

await checkHttp ("web",        process.env.WEB_URL        ?? "http://localhost:3000");
await checkHttp ("api",        process.env.API_URL        ?? "http://localhost:3001/api/health");
await checkPostgres();
await checkHttp ("prometheus", process.env.PROMETHEUS_URL ?? "http://localhost:9090/-/healthy");
await checkHttp ("grafana",    process.env.GRAFANA_URL    ?? "http://localhost:3200/api/health");
await checkHttp ("loki",       process.env.LOKI_URL       ?? "http://localhost:3100/ready");

console.log("");
if (overall === 0) {
  console.log(`  Result: ${PASS} — all services healthy\n`);
} else {
  console.log(`  Result: ${FAIL} — one or more services unreachable\n`);
}

process.exit(overall);
