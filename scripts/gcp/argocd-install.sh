#!/usr/bin/env bash
# Install ArgoCD into the cluster if it isn't there yet, and ensure GitOps
# is configured to sync infra/k8s/production. Idempotent.
set -euo pipefail

REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
NAMESPACE="argocd"

if kubectl get ns "${NAMESPACE}" >/dev/null 2>&1; then
  echo "[argocd] already installed"
else
  echo "[argocd] installing via Helm..."
  helm repo add argo https://argoproj.github.io/argo-helm >/dev/null 2>&1 || true
  helm repo update >/dev/null
  helm upgrade --install argocd argo/argo-cd -n "${NAMESPACE}" --create-namespace \
    --set server.service.type=ClusterIP \
    --set 'configs.cm.reposerver\.enable\.git\.submodule=false' \
    --wait
fi

# Submodule recursion must be OFF: a nested gitlink under
# submodules/math-to-manim breaks manifest generation. Belt-and-braces patch:
kubectl -n "${NAMESPACE}" patch configmap argocd-cmd-params-cm \
  --type merge -p '{"data":{"reposerver.enable.git.submodule":"false"}}' 2>/dev/null || true

# Restart repo-server so the patch takes effect (idempotent; restarts are cheap).
if kubectl -n "${NAMESPACE}" get deployment argocd-repo-server >/dev/null 2>&1; then
  kubectl -n "${NAMESPACE}" rollout restart deployment/argocd-repo-server >/dev/null
fi

echo "[argocd] applying GitOps Application..."
kubectl apply -f "${REPO_ROOT}/infra/k8s/argocd/application-production.yaml"

echo "[argocd] done"
