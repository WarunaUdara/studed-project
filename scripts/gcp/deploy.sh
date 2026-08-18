#!/usr/bin/env bash
# Full StudEd production deployment with a single command.
#
#   make prod-deploy          # or ./scripts/gcp/deploy.sh
#
# Idempotent - safe to re-run. Brings up (or refreshes) GCP infra via OpenTofu,
# populates secrets, installs/repairs ArgoCD, waits for a healthy backend,
# deploys the frontend to Cloudflare Pages, then seeds demo data.
set -euo pipefail

REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
TF_DIR="${PROD_TF_DIR:-${REPO_ROOT}/infra/gcp/terraform-prod}"
PROJECT_ID="${PROJECT_ID:-studed-prod}"
REGION="${REGION:-asia-south1}"
ZONE="${ZONE:-asia-south1-a}"
CLUSTER="${CLUSTER_NAME:-studed-prod}"
NODE_COUNT="${NODE_COUNT:-2}"
# Derived from the OpenTofu ingress_static_ip output after apply; override only
# to point the seeder at an existing deployment.
STUDED_API_URL="${STUDED_API_URL:-}"

log() { echo; echo "===> $*"; }

require() {
  for cmd in "$@"; do
    if ! command -v "$cmd" >/dev/null 2>&1; then
      echo "error: missing required tool: $cmd" >&2
      exit 1
    fi
  done
}

check_auth() {
  if ! gcloud auth list --filter=status:ACTIVE --format="value(account)" 2>/dev/null | grep -q .; then
    echo "error: run 'gcloud auth login' first" >&2
    exit 1
  fi
  gcloud config set project "${PROJECT_ID}" >/dev/null
}

terraform_apply() {
  require tofu
  log "1/7 OpenTofu - provisioning GCP infrastructure"
  cd "${TF_DIR}"
  tofu init >/dev/null
  tofu apply -auto-approve -var "node_count=${NODE_COUNT}" | tail -15
  cd "${REPO_ROOT}"
}

populate_secrets() {
  log "2/7 Secrets - populating Secret Manager from .env"
  if [[ ! -f "${REPO_ROOT}/.env" ]]; then
    echo "error: ${REPO_ROOT}/.env not found (needs DATABASE_CONNECTION_STRING)" >&2
    exit 1
  fi
  bash "${REPO_ROOT}/scripts/gcp/populate-secrets.sh"
}

set_ingress_host() {
  # ArgoCD syncs infra/k8s/production straight from git, so the managed
  # ingress/cert must carry the real static IP before the first sync happens.
  bash "${REPO_ROOT}/scripts/gcp/set-ingress-host.sh" "$1"
}

cluster_credentials() {
  log "3/7 GKE - fetching cluster credentials"
  gcloud container clusters get-credentials "${CLUSTER}" \
    --zone "${ZONE}" --project "${PROJECT_ID}"
}

deploy_gitops() {
  log "4/7 GitOps - installing/configuring ArgoCD"
  bash "${REPO_ROOT}/scripts/gcp/argocd-install.sh"
}

wait_healthy() {
  log "5/7 Waiting for backend workloads to become healthy"
  local tries=0
  until kubectl -n studed get pods 2>/dev/null | awk 'NR>1 && $3 != "Running" {bad++} END {exit !(bad==0)}' && \
        [ "$(kubectl -n studed get pods --no-headers 2>/dev/null | wc -l | tr -d ' ')" -ge 10 ]; do
    tries=$((tries + 1))
    if [ "$tries" -ge 90 ]; then
      echo "error: backend pods did not become healthy" >&2
      kubectl -n studed get pods >&2
      exit 1
    fi
    echo "  ...waiting (${tries}/90)"
    sleep 10
  done
  kubectl -n studed get pods
}

wait_ingress() {
  log "6/7 Ingress - waiting for HTTPS + managed certificate"
  local tries=0
  until curl -sf "https://api.${1}.sslip.io/health" >/dev/null 2>&1; do
    tries=$((tries + 1))
    if [ "$tries" -ge 60 ]; then
      echo "warning: backend health endpoint not reachable yet - check the certificate status" >&2
      kubectl get managedcertificate -n studed >&2 2>/dev/null || true
      break
    fi
    echo "  ...waiting for HTTPS (${tries}/60)"
    sleep 10
  done
  curl -s -o /dev/null -w "  backend health: HTTP %{http_code}\n" "https://api.${1}.sslip.io/health"
}

deploy_frontend() {
  log "7/7 Frontend - building and deploying to Cloudflare Pages"
  require bun jq
  if [[ -z "${CLOUDFLARE_API_TOKEN:-}" ]]; then
    echo "  skipping frontend: set CLOUDFLARE_API_TOKEN (Pages-scoped token) to deploy"
    echo "  -> run: cd ${REPO_ROOT} && bunx wrangler pages deploy frontend/dist --project-name studed-project-frontend"
    return 0
  fi
  (cd "${REPO_ROOT}/frontend" && bun run build >/dev/null)
  (cd "${REPO_ROOT}" && bunx wrangler pages deploy frontend/dist \
    --project-name studed-project-frontend --branch main 2>&1 | grep -E "Deployment complete|uploaded|URL|https://" || true)
}

seed_demo() {
  log "Seed - inserting/refreshing demo data"
  local db_url=""
  if [[ -f "${REPO_ROOT}/.env" ]]; then
    # Prefer the managed (Neon) connection string over the localhost dev tunnel
    # so educator role promotion in the seeder hits the production database.
    db_url="$(grep -E '^DATABASE_CONNECTION_STRING=' "${REPO_ROOT}/.env" | head -1 | cut -d= -f2- || true)"
    [[ -z "${db_url}" ]] && db_url="$(grep -E '^DATABASE_URL=' "${REPO_ROOT}/.env" | head -1 | cut -d= -f2- || true)"
  fi
  STUDED_API_URL="${STUDED_API_URL}" STUDED_DATABASE_URL="${db_url}" bash "${REPO_ROOT}/scripts/mock-data-loader.sh" >/dev/null
}

main() {
  require gcloud kubectl jq curl

  check_auth
  terraform_apply

  # Read the ingress IP only AFTER apply, so a first-time deploy (empty state)
  # gets the real address instead of a stale hard-coded one that would point the
  # health checks and the seeder at somebody else's cluster.
  local ip
  ip="$(cd "${TF_DIR}" && tofu output -raw ingress_static_ip 2>/dev/null || true)"
  if [[ -z "${ip}" ]]; then
    echo "error: could not read ingress_static_ip from OpenTofu outputs" >&2
    echo "       run 'cd ${TF_DIR} && tofu output' to inspect the state" >&2
    exit 1
  fi
  STUDED_API_URL="${STUDED_API_URL:-https://api.${ip}.sslip.io}"
  echo "  ingress IP: ${ip}"
  set_ingress_host "${ip}"
  populate_secrets
  cluster_credentials
  deploy_gitops
  wait_healthy
  wait_ingress "${ip}"
  deploy_frontend
  seed_demo

  echo
  echo "Deployment complete."
  echo "  Backend:  https://api.${ip}.sslip.io/graphql"
  echo "  Frontend: https://studed-project-frontend.pages.dev"
  echo "  Educator: demo.educator@studed.lk / password1234"
  echo "  Student:  demo.student@studed.lk / password1234"
  echo "  Stop costs: make prod-stop   |  Wake up: make prod-start   |  Full teardown: make prod-destroy"
}

main "$@"
