#!/usr/bin/env bash
set -euo pipefail

REPO_ROOT="$(cd "$(dirname "$0")/.." && pwd)"
GATEWAY_URL="http://localhost:8080"

echo "========================================================"
echo "🧪 StudEd End-to-End Clean Demo Verification Script"
echo "========================================================"

# 1. Clean slate tear down
echo "[verify] Tearing down existing containers and volumes..."
docker compose -f "${REPO_ROOT}/docker-compose.yml" down -v --remove-orphans || true

# 2. Boot up fresh microservice stack
echo "[verify] Starting fresh Docker Compose stack..."
docker compose -f "${REPO_ROOT}/docker-compose.yml" up -d --build

# 3. Wait for API Gateway health
echo "[verify] Waiting for API Gateway readiness at ${GATEWAY_URL}/health..."
HEALTH_OK=false
for i in {1..60}; do
  if curl -sf "${GATEWAY_URL}/health" >/dev/null 2>&1; then
    HEALTH_OK=true
    echo "[verify] ✅ API Gateway is healthy!"
    break
  fi
  sleep 2
done

if [ "${HEALTH_OK}" = "false" ]; then
  echo "❌ Error: API Gateway failed to become healthy within 120 seconds."
  docker compose -f "${REPO_ROOT}/docker-compose.yml" logs --tail=50
  exit 1
fi

# 4. Seed database mock content
echo "[verify] Seeding database with demo courses..."
"${REPO_ROOT}/scripts/mock-data-loader.sh"

# 5. Execute full integration test suite
echo "[verify] Running integration test suite..."
"${REPO_ROOT}/scripts/integration-test.sh"

echo "========================================================"
echo "🎉 Clean Demo Journey Verification Passed Successfully!"
echo "========================================================"
