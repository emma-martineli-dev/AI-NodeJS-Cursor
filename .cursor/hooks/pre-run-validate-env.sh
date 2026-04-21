#!/usr/bin/env bash
# Signal Lab — pre-run env validation
# Blocks docker compose / dev server start if required env vars are missing.
#
# Usage:
#   bash .cursor/hooks/pre-run-validate-env.sh [env-file]
#   bash .cursor/hooks/pre-run-validate-env.sh .env.production
#
# Wire into package.json:
#   "predev": "bash .cursor/hooks/pre-run-validate-env.sh"

set -euo pipefail

BOLD="\033[1m"
GREEN="\033[32m"
RED="\033[31m"
YELLOW="\033[33m"
RESET="\033[0m"

ENV_FILE="${1:-.env}"

echo ""
echo -e "${BOLD}Signal Lab — environment validation${RESET}"
echo "────────────────────────────────────────────"
echo -e "  Checking: ${ENV_FILE}"
echo ""

# Required — blocks if missing
REQUIRED=(
  "DATABASE_URL"
  "SHADOW_DATABASE_URL"
)

# Optional — warns but does not block
OPTIONAL=(
  "SENTRY_DSN"
  "GRAFANA_PASSWORD"
  "NEXT_PUBLIC_API_URL"
  "PORT"
)

FAIL=0

# Check env file exists
if [ ! -f "$ENV_FILE" ]; then
  echo -e "  ${RED}❌ $ENV_FILE not found${RESET}"
  echo -e "     Fix: cp signal-lab/.env.example .env"
  echo ""
  exit 1
fi

# Load env file without exporting to shell permanently
set -a
# shellcheck disable=SC1090
source "$ENV_FILE"
set +a

# Check required vars
for var in "${REQUIRED[@]}"; do
  val="${!var:-}"
  if [ -z "$val" ]; then
    echo -e "  ${RED}❌ REQUIRED${RESET}  $var — not set"
    FAIL=1
  else
    # Mask value — show only first 8 chars
    masked="${val:0:8}..."
    echo -e "  ${GREEN}✅ REQUIRED${RESET}  $var = ${masked}"
  fi
done

echo ""

# Check optional vars
for var in "${OPTIONAL[@]}"; do
  val="${!var:-}"
  if [ -z "$val" ]; then
    echo -e "  ${YELLOW}⚠️  OPTIONAL${RESET}  $var — not set (non-blocking)"
  else
    masked="${val:0:8}..."
    echo -e "  ${GREEN}✅ OPTIONAL${RESET}  $var = ${masked}"
  fi
done

echo ""
echo "────────────────────────────────────────────"

if [ $FAIL -ne 0 ]; then
  echo -e "  ${RED}Blocked.${RESET} Set required variables in ${ENV_FILE} and retry."
  echo ""
  exit 1
fi

echo -e "  ${GREEN}Environment OK.${RESET} Proceeding."
echo ""
exit 0
