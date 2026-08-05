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
TF_DIR="${REPO_ROOT}/infra/gcp/terraform"
PROJECT_ID="${PROJECT_ID:-studed-prod}"
DELETE_PROJECT=0
[[ "${1:-}" == "--delete-project" ]] && DELETE_PROJECT=1

log() { echo; echo "===> $*"; }

log "1/3 OpenTofu destroy - removing all GCP resources"
# Force-remove Cloud Run job in GCP so OpenTofu provider deletion_protection doesn't block teardown
gcloud run jobs delete studed-idle-scout --region us-central1 --project "${PROJECT_ID}" --quiet 2>/dev/null || true
(cd "${TF_DIR}" && tofu init >/dev/null && tofu destroy -auto-approve | tail -20)

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
