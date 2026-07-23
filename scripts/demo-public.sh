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

# 5. Build and Serve Optimized Frontend Bundle
echo "[demo] Building production frontend bundle for high-speed tunnel performance..."
(cd "${REPO_ROOT}/frontend" && bun run build)

echo "[demo] Starting frontend preview server on port ${FRONTEND_PORT}..."
# Stop any existing dev server on port 5173 if running
lsof -ti :${FRONTEND_PORT} | xargs kill -9 >/dev/null 2>&1 || true
(cd "${REPO_ROOT}/frontend" && bun run preview --host --port ${FRONTEND_PORT} >/tmp/studed-frontend.log 2>&1 &)
sleep 2

NGROK_DOMAIN="${NGROK_DOMAIN:-mumps-lapel-rinsing.ngrok-free.dev}"

# 6. Provision Ngrok Public Tunnel
echo "========================================================"
echo "🌐 Starting Ngrok Public Ingress Tunnel on port ${FRONTEND_PORT}..."
echo "========================================================"

if command -v ngrok >/dev/null 2>&1; then
  echo "[demo] Launching ngrok tunnel on domain: https://${NGROK_DOMAIN}"
  exec ngrok http --url="${NGROK_DOMAIN}" ${FRONTEND_PORT}
else
  echo "⚠️ Warning: ngrok CLI not found. Access local demo at http://localhost:${FRONTEND_PORT}"
fi
