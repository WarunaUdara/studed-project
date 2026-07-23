#!/usr/bin/env bash
set -euo pipefail

REPO_ROOT="$(cd "$(dirname "$0")/.." && pwd)"
GATEWAY_URL="http://localhost:8080"
FRONTEND_PORT=5173

echo "========================================================"
echo "🚀 StudEd Smart Public Demo Ingress Automation"
echo "========================================================"

# 1. Verify Docker daemon
if ! docker info >/dev/null 2>&1; then
  echo "❌ Error: Docker daemon is not running. Start Docker Desktop and try again."
  exit 1
fi

# 2. Detect Active Deployment Mode (Kubernetes k3d vs Docker Compose)
IS_K8S_ACTIVE=false
if command -v kubectl >/dev/null 2>&1 && kubectl get namespace studed >/dev/null 2>&1; then
  if kubectl get pods -n studed 2>&1 | grep -q "api-gateway"; then
    IS_K8S_ACTIVE=true
  fi
fi

if [ "${IS_K8S_ACTIVE}" = "true" ]; then
  echo "[demo] ✅ Detected active Kubernetes (k3d/K3s) deployment mode!"
else
  # Pre-flight check: auto-free port 8080 if occupied by k3d
  if lsof -i :8080 >/dev/null 2>&1; then
    if command -v k3d >/dev/null 2>&1 && k3d cluster list 2>&1 | grep -q "studed-local"; then
      echo "[demo] Port 8080 is held by local k3d cluster. Stopping k3d cluster to free port..."
      k3d cluster stop studed-local || true
      sleep 2
    fi
  fi
  
  # Start Compose microservice stack
  (cd "${REPO_ROOT}" && make dev-up)
fi

# 3. Wait for API Gateway Healthcheck
echo "[demo] Waiting for API Gateway readiness at ${GATEWAY_URL}/health..."
HEALTH_OK=false
for i in {1..30}; do
  if curl -sf "${GATEWAY_URL}/health" >/dev/null 2>&1; then
    HEALTH_OK=true
    echo "[demo] ✅ API Gateway is healthy!"
    break
  fi
  sleep 1
done

if [ "${HEALTH_OK}" = "false" ]; then
  echo "⚠️ API Gateway health check pending on ${GATEWAY_URL}. Proceeding with demo startup..."
fi

# 4. Seed database mock content
echo "[demo] Seeding database with demo courses..."
(cd "${REPO_ROOT}" && ./scripts/mock-data-loader.sh || true)

# 5. Ensure Frontend Dev Server is running
echo "[demo] Checking frontend web app status on port ${FRONTEND_PORT}..."
if ! curl -sf "http://localhost:${FRONTEND_PORT}" >/dev/null 2>&1; then
  echo "[demo] Starting frontend dev server in background..."
  (cd "${REPO_ROOT}/frontend" && bun run dev --port ${FRONTEND_PORT} >/tmp/studed-frontend.log 2>&1 &)
  sleep 3
fi

# 6. Provision Ngrok Public Tunnel
echo "========================================================"
echo "🌐 Starting Ngrok Public Ingress Tunnel on port ${FRONTEND_PORT}..."
echo "========================================================"

if command -v ngrok >/dev/null 2>&1; then
  echo "[demo] Launching ngrok tunnel. Press Ctrl+C to stop demo."
  exec ngrok http ${FRONTEND_PORT}
else
  echo "⚠️ Warning: ngrok CLI not found. Access local demo at http://localhost:${FRONTEND_PORT}"
fi
