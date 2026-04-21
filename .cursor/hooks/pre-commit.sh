#!/usr/bin/env bash
# Signal Lab — pre-commit hook
# Blocks commit if any service file is missing observability pillars.
#
# Install:
#   cp .cursor/hooks/pre-commit.sh .git/hooks/pre-commit
#   chmod +x .git/hooks/pre-commit

set -euo pipefail

BOLD="\033[1m"
GREEN="\033[32m"
RED="\033[31m"
YELLOW="\033[33m"
RESET="\033[0m"

echo ""
echo -e "${BOLD}Signal Lab — pre-commit observability check${RESET}"
echo "────────────────────────────────────────────"

FAIL=0
SKIP_SERVICES=("prisma.service.ts" "metrics.service.ts" "app.service.ts")

# Find all service files in the API
SERVICE_FILES=$(find signal-lab/apps/api/src -name "*.service.ts" ! -name "*.spec.ts" 2>/dev/null || true)

if [ -z "$SERVICE_FILES" ]; then
  echo -e "  ${YELLOW}⚠️  No service files found — skipping${RESET}"
  exit 0
fi

for file in $SERVICE_FILES; do
  name=$(basename "$file")

  # Skip infrastructure services
  skip=0
  for s in "${SKIP_SERVICES[@]}"; do
    [[ "$name" == "$s" ]] && skip=1 && break
  done
  [[ $skip -eq 1 ]] && continue

  missing=()

  # Pillar 1 — structured logs with event field
  if ! grep -q "event:" "$file" 2>/dev/null; then
    missing+=("logs")
  fi

  # Pillar 2 — Prometheus metric call
  if ! grep -qE "\.(inc|observe|startTimer)\(" "$file" 2>/dev/null; then
    missing+=("metrics")
  fi

  # Pillar 3 — Sentry error capture
  if ! grep -q "Sentry.captureException" "$file" 2>/dev/null; then
    missing+=("sentry")
  fi

  if [ ${#missing[@]} -eq 0 ]; then
    echo -e "  ${GREEN}✅${RESET} $name"
  else
    joined=$(IFS=", "; echo "${missing[*]}")
    echo -e "  ${RED}❌${RESET} $name — missing: ${joined}"
    FAIL=1
  fi
done

echo "────────────────────────────────────────────"

if [ $FAIL -ne 0 ]; then
  echo -e "  ${RED}Commit blocked.${RESET} Fix observability issues above."
  echo -e "  Run: ${BOLD}check:observability${RESET} for details and fixes."
  echo ""
  exit 1
fi

echo -e "  ${GREEN}All checks passed.${RESET} Proceeding with commit."
echo ""
exit 0
