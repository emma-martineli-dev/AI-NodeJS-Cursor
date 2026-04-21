#!/usr/bin/env bash
# Signal Lab — health check
# Usage: bash scripts/healthcheck.sh
# Exits 0 if all checks pass, 1 if any fail.

set -euo pipefail

PASS="\033[32mPASS\033[0m"
FAIL="\033[31mFAIL\033[0m"
overall=0

# ── helpers ────────────────────────────────────────────────────────────────────

check_http() {
  local name="$1"
  local url="$2"
  local expected_status="${3:-200}"

  local status
  status=$(curl -s -o /dev/null -w "%{http_code}" --max-time 5 "$url" 2>/dev/null || echo "000")

  if [ "$status" = "$expected_status" ]; then
    printf "  %-14s %b  (%s)\n" "$name" "$PASS" "$url"
  else
    printf "  %-14s %b  (%s) — got HTTP %s\n" "$name" "$FAIL" "$url" "$status"
    overall=1
  fi
}

check_postgres() {
  local name="postgres"
  local host="${POSTGRES_HOST:-localhost}"
  local port="${POSTGRES_PORT:-5432}"
  local user="${POSTGRES_USER:-signal}"
  local db="${POSTGRES_DB:-signal_lab}"

  if PGPASSWORD="${POSTGRES_PASSWORD:-signal}" \
     psql -h "$host" -p "$port" -U "$user" -d "$db" \
     -c "SELECT 1" -q --no-align -t 2>/dev/null | grep -q "1"; then
    printf "  %-14s %b  (%s:%s/%s)\n" "$name" "$PASS" "$host" "$port" "$db"
  else
    printf "  %-14s %b  (%s:%s/%s) — could not connect\n" "$name" "$FAIL" "$host" "$port" "$db"
    overall=1
  fi
}

# ── checks ─────────────────────────────────────────────────────────────────────

echo ""
echo "┌─────────────────────────────────────────┐"
echo "│        Signal Lab — Health Check         │"
echo "└─────────────────────────────────────────┘"
echo ""

check_http  "web"        "${WEB_URL:-http://localhost:3000}"
check_http  "api"        "${API_URL:-http://localhost:3001/api/health}"
check_postgres
check_http  "prometheus" "${PROMETHEUS_URL:-http://localhost:9090/-/healthy}"
check_http  "grafana"    "${GRAFANA_URL:-http://localhost:3200/api/health}"
check_http  "loki"       "${LOKI_URL:-http://localhost:3100/ready}"

echo ""
if [ $overall -eq 0 ]; then
  printf "  Result: %b — all services healthy\n\n" "$PASS"
else
  printf "  Result: %b — one or more services unreachable\n\n" "$FAIL"
fi

exit $overall
