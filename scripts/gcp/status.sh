#!/usr/bin/env bash
# Health/cost snapshot of the StudEd production deployment.
set -euo pipefail

REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
TF_DIR="${PROD_TF_DIR:-${REPO_ROOT}/infra/gcp/terraform-prod}"
PROJECT_ID="${PROJECT_ID:-studed-prod}"
ZONE="${ZONE:-asia-south1-a}"
CLUSTER="${CLUSTER_NAME:-studed-prod}"
IP="$(cd "${TF_DIR}" && tofu output -raw ingress_static_ip 2>/dev/null || true)"

echo "=== StudEd production status ==="

echo "[cluster]"
if gcloud container clusters describe "${CLUSTER}" --zone "${ZONE}" --project "${PROJECT_ID}" >/dev/null 2>&1; then
  NODES="$(gcloud container clusters describe "${CLUSTER}" --zone "${ZONE}" --project "${PROJECT_ID}" \
    --format 'value(currentNodeCount)')"
  echo "  cluster: ${CLUSTER} (${ZONE}) - ${NODES} nodes"
  if [ "${NODES}" = "0" ]; then
    echo "  -> STANDBY (scaled to zero). Wake with: make prod-start"
  fi
else
  echo "  cluster NOT FOUND (destroyed?)"
fi

echo "[backend]"
curl -s -o /dev/null -w "  https://api.${IP}.sslip.io/health -> HTTP %{http_code}\n" \
  "https://api.${IP}.sslip.io/health" 2>/dev/null || echo "  unreachable"

echo "[pods]"
if kubectl -n studed get pods >/dev/null 2>&1; then
  kubectl -n studed get pods -o wide 2>/dev/null | awk '{print "  " $0}'
  echo "  restarts: $(kubectl -n studed get pods --no-headers 2>/dev/null | awk '{s+=$4} END {print s+0}')"
else
  echo "  kubectl not connected to cluster"
fi

echo "[argocd]"
if kubectl -n argocd get app studed-production >/dev/null 2>&1; then
  kubectl -n argocd get app studed-production -o jsonpath='  {.metadata.name}: sync={.status.sync.status} health={.status.health.status}{"\n"}'
else
  echo "  not found"
fi

echo "[frontend]"
curl -s -o /dev/null -w "  https://studed-project-frontend.pages.dev -> HTTP %{http_code}\n" \
  https://studed-project-frontend.pages.dev/ 2>/dev/null || echo "  unreachable"

echo "[idle-scout]"
gcloud scheduler jobs describe studed2-idle-check --location asia-south1 --project "${PROJECT_ID}" \
  --format 'value(name)' >/dev/null 2>&1 \
  && echo "  scheduler studed2-idle-check: hourly auto scale-down (active)" \
  || echo "  not provisioned"

echo "[static-ip]"
IP_IN_USE="$(gcloud compute addresses list --filter="name~ingress" --format 'value(address,users[0])' 2>/dev/null)"
[ -n "${IP_IN_USE}" ] && echo "  ${IP_IN_USE}" || echo "  none"
