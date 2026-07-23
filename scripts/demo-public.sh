#!/usr/bin/env bash
set -euo pipefail

REPO_ROOT="$(cd "$(dirname "$0")/.." && pwd)"
GATEWAY_URL="http://localhost:8080"
FRONTEND_PORT=5173

echo "========================================================"
echo "🚀 StudEd Public Demo Deployment Automation"
echo "========================================================"

# 1. Verify Docker daemon
if ! docker info >/dev/null 2>&1; then
  echo "❌ Error: Docker daemon is not running. Start Docker and try again."
  exit 1
fi

# 2. Check/Start Floci Local Cloud Emulator if needed
if floci status 2>&1 | grep -q "not running"; then
  echo "[demo] Starting Floci local cloud emulator (port 4566)..."
  floci start || true
fi

# 3. Ensure microservice stack is built and running
echo "[demo] Checking backend microservices stack..."
(cd "${REPO_ROOT}" && make dev-up)

# 4. Wait for API Gateway healthcheck
echo "[demo] Waiting for API Gateway readiness at ${GATEWAY_URL}/health..."
for i in {1..30}; do
  if curl -sf "${GATEWAY_URL}/health" >/dev/null 2>&1; then
    echo "[demo] ✅ API Gateway is healthy!"
    break
  fi
  if [ "$i" -eq 30 ]; then
    echo "❌ API Gateway healthcheck timed out."
    exit 1
  fi
  sleep 1
done

# 5. Seed database mock content
echo "[demo] Seeding database with demo courses, students, and educators..."
(cd "${REPO_ROOT}" && ./scripts/mock-data-loader.sh)

# 6. Ensure Frontend Dev Server is running
echo "[demo] Checking frontend web app status on port ${FRONTEND_PORT}..."
if ! curl -sf "http://localhost:${FRONTEND_PORT}" >/dev/null 2>&1; then
  echo "[demo] Starting frontend dev server in background..."
  (cd "${REPO_ROOT}/frontend" && bun run dev --port ${FRONTEND_PORT} >/tmp/studed-frontend.log 2>&1 &)
  sleep 3
fi

# 7. Provision Ngrok Public Tunnel
echo "========================================================"
echo "🌐 Starting Ngrok Public Ingress Tunnel on port ${FRONTEND_PORT}..."
echo "========================================================"

if command -v ngrok >/dev/null 2>&1; then
  echo "[demo] Launching ngrok tunnel. Press Ctrl+C to stop demo."
  exec ngrok http ${FRONTEND_PORT}
else
  echo "⚠️ Warning: ngrok CLI not found. Access local demo at http://localhost:${FRONTEND_PORT}"
fi
