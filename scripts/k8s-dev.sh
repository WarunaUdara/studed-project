#!/usr/bin/env bash
set -euo pipefail

REPO_ROOT="$(cd "$(dirname "$0")/.." && pwd)"
CLUSTER_NAME="studed-local"
NAMESPACE="studed"

command_exists() {
  command -v "$1" >/dev/null 2>&1
}

start_k8s() {
  echo "========================================================"
  echo "☸️ StudEd Kubernetes (k3d/K3s) Local Cluster Setup"
  echo "========================================================"

  if ! command_exists k3d; then
    echo "❌ k3d is not installed. Install with: brew install k3d"
    exit 1
  fi

  if ! command_exists kubectl; then
    echo "❌ kubectl is not installed. Install with: brew install kubectl"
    exit 1
  fi

  # 1. Check if k3d cluster exists
  if k3d cluster list 2>&1 | grep -q "${CLUSTER_NAME}"; then
    echo "[k8s] Cluster '${CLUSTER_NAME}' already exists."
  else
    echo "[k8s] Creating k3d cluster '${CLUSTER_NAME}' (Ports 8080 & 80)..."
    k3d cluster create "${CLUSTER_NAME}" \
      --port "8080:8080@loadbalancer" \
      --port "80:80@loadbalancer"
  fi

  # 2. Build local Docker microservice images if needed
  echo "[k8s] Building local microservice Docker images..."
  (cd "${REPO_ROOT}" && docker compose build)

  # 3. Import local microservice images into k3d node
  echo "[k8s] Importing images into k3d cluster node..."
  k3d image import \
    studed-doc-api-gateway:latest \
    studed-doc-auth-service:latest \
    studed-doc-course-service:latest \
    studed-doc-gamification-service:latest \
    studed-doc-progress-service:latest \
    studed-doc-ai-service:latest \
    studed-doc-notification-service:latest \
    studed-doc-payment-service:latest \
    -c "${CLUSTER_NAME}" || true

  # 4. Prepare secret file from template
  if [ ! -f "${REPO_ROOT}/infra/k8s/secret.yaml" ]; then
    echo "[k8s] Creating secret.yaml from template..."
    cp "${REPO_ROOT}/infra/k8s/secret.yaml.template" "${REPO_ROOT}/infra/k8s/secret.yaml"
  fi

  # 5. Apply Kubernetes manifests
  echo "[k8s] Applying Kubernetes manifests..."
  kubectl apply -f "${REPO_ROOT}/infra/k8s/namespace.yaml"
  kubectl apply -f "${REPO_ROOT}/infra/k8s/configmap.yaml"
  kubectl apply -f "${REPO_ROOT}/infra/k8s/secret.yaml"
  kubectl apply -f "${REPO_ROOT}/infra/k8s/postgres-deployment.yaml"
  kubectl apply -f "${REPO_ROOT}/infra/k8s/redis-deployment.yaml"
  kubectl apply -f "${REPO_ROOT}/infra/k8s/elasticsearch-deployment.yaml"
  kubectl apply -f "${REPO_ROOT}/infra/k8s/services/"
  kubectl apply -f "${REPO_ROOT}/infra/k8s/ingress.yaml"

  echo "========================================================"
  echo "✅ StudEd Kubernetes Stack Deployed!"
  echo "Check status with: kubectl get pods -n ${NAMESPACE}"
  echo "========================================================"
}

stop_k8s() {
  echo "[k8s] Deleting k3d cluster '${CLUSTER_NAME}'..."
  k3d cluster delete "${CLUSTER_NAME}" || true
}

case "${1:-up}" in
  up)
    start_k8s
    ;;
  down)
    stop_k8s
    ;;
  status)
    kubectl get pods -n "${NAMESPACE}"
    ;;
  *)
    echo "Usage: $0 {up|down|status}"
    exit 1
    ;;
esac
