#!/usr/bin/env bash
# Full teardown - stops EVERY costing resource with one command.
#
#   make prod-destroy          # or ./scripts/gcp/destroy.sh [--delete-project]
#
# 1. tofu destroy removes the GKE cluster (nodes), static IP, LB/ingress,
#    Cloud NAT, WAF, Secret Manager, idle-scout job/scheduler (all GCP charges).
# 2. Deletes the Cloudflare Pages project (free, but clean slate).
# 3. With --delete-project: also deletes the whole GCP project (nuclear, fastest).
set -euo pipefail

REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
TF_DIR="${PROD_TF_DIR:-${REPO_ROOT}/infra/gcp/terraform-prod}"
PROJECT_ID="${PROJECT_ID:-studed-prod}"
RUN_JOB="${RUN_JOB:-studed2-idle-scout}"
RUN_REGION="${RUN_REGION:-asia-south1}"
DELETE_PROJECT=0
[[ "${1:-}" == "--delete-project" ]] && DELETE_PROJECT=1

log() { echo; echo "===> $*"; }

log "1/3 OpenTofu destroy - removing all GCP resources"
# Force-remove Cloud Run job in GCP so OpenTofu provider deletion_protection doesn't block teardown
gcloud run jobs delete "${RUN_JOB}" --region "${RUN_REGION}" --project "${PROJECT_ID}" --quiet 2>/dev/null || true

# Force-delete lingering GKE clusters to release VPC subnet attachments
echo "Checking for lingering GKE clusters in ${PROJECT_ID}..."
clusters="$(gcloud container clusters list --project="${PROJECT_ID}" --format="value(name,location)" 2>/dev/null || true)"
if [[ -n "${clusters}" ]]; then
  echo "${clusters}" | while read -r name loc; do
    if [[ -n "${name}" && -n "${loc}" ]]; then
      echo "  deleting GKE cluster ${name} in ${loc}..."
      gcloud container clusters delete "${name}" --location="${loc}" --project="${PROJECT_ID}" --quiet 2>/dev/null || true
    fi
  done
fi

echo "Cleaning lingering GKE network endpoint groups (NEGs) in ${PROJECT_ID}..."
gcloud compute network-endpoint-groups list --project="${PROJECT_ID}" --format="value(name,zone)" 2>/dev/null | while read -r neg zone; do
  if [[ -n "${neg}" && -n "${zone}" ]]; then
    echo "  deleting NEG ${neg} in ${zone}..."
    gcloud compute network-endpoint-groups delete "${neg}" --zone="${zone}" --project="${PROJECT_ID}" --quiet 2>/dev/null || true
  fi
done

(cd "${TF_DIR}" && tofu init >/dev/null && tofu destroy -exclude="google_project_iam_custom_role.idle_scout_role" -auto-approve | tail -20)

# Clean any residual SSL certificates
echo "Cleaning residual SSL certificates in ${PROJECT_ID}..."
HTTPS_PROXY="${HTTPS_PROXY:-http://127.0.0.1:3128}" gcloud compute ssl-certificates delete studed-le-cert --project="${PROJECT_ID}" --quiet 2>/dev/null || true

log "2/3 Cloudflare Pages - deleting frontend project"
if [[ -n "${CLOUDFLARE_API_TOKEN:-}" ]]; then
  (cd "${REPO_ROOT}" && bunx wrangler pages project delete studed-project-frontend --force 2>&1 | tail -3 || true)
else
  echo "  CLOUDFLARE_API_TOKEN not set - skipping (delete manually in Cloudflare dashboard if desired)"
fi

if [ "${DELETE_PROJECT}" = "1" ]; then
  log "3/3 Deleting GCP project ${PROJECT_ID} (nuclear - removes absolutely everything)"
  gcloud projects delete "${PROJECT_ID}" --quiet
fi

log "Teardown complete. Verify nothing is left billing:"
echo "  bash ${REPO_ROOT}/scripts/gcp/verify-teardown.sh"
