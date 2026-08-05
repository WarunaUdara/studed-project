#!/usr/bin/env bash
# Post-teardown audit: list anything that could still be billing on GCP.
# Run AFTER `make prod-destroy`. Exits non-zero if billing resources remain.
set -euo pipefail

PROJECT_ID="${PROJECT_ID:-studed-prod}"
FAIL=0

check() {
  local label="$1"
  local out="$2"
  if [ -n "$out" ]; then
    echo "STILL BILLING: ${label}"
    echo "${out}" | sed 's/^/    /'
    FAIL=1
  else
    echo "OK: ${label}"
  fi
}

echo "=== StudEd teardown audit (${PROJECT_ID}) ==="

if ! gcloud projects describe "${PROJECT_ID}" >/dev/null 2>&1; then
  echo "PROJECT DELETED - nothing can bill. Done."
  exit 0
fi

check "GKE clusters" "$(gcloud container clusters list --project="${PROJECT_ID}" --format='value(name)' 2>/dev/null)"
check "Compute instances (incl. GKE nodes)" "$(gcloud compute instances list --project="${PROJECT_ID}" --format='value(name)' 2>/dev/null)"
check "Global forwarding rules (LB)" "$(gcloud compute forwarding-rules list --global --project="${PROJECT_ID}" --format='value(name)' 2>/dev/null)"
check "Static addresses" "$(gcloud compute addresses list --project="${PROJECT_ID}" --format='value(name)' 2>/dev/null)"
check "Cloud NAT routers" "$(gcloud compute routers list --project="${PROJECT_ID}" --format='value(name)' 2>/dev/null)"
check "Cloud Armor policies" "$(gcloud compute security-policies list --project="${PROJECT_ID}" --format='value(name)' 2>/dev/null)"
check "Cloud Run jobs (idle-scout)" "$(gcloud run jobs list --project="${PROJECT_ID}" --format='value(metadata.name)' 2>/dev/null)"
check "Cloud Scheduler jobs" "$(gcloud scheduler jobs list --project="${PROJECT_ID}" --location=- --format='value(name)' 2>/dev/null)"
check "Cloud SQL/AlloyDB (none expected)" "$(gcloud sql instances list --project="${PROJECT_ID}" --format='value(name)' 2>/dev/null)"
check "Pub/Sub topics" "$(gcloud pubsub topics list --project="${PROJECT_ID}" --format='value(name)' 2>/dev/null)"
check "Redis/Memorystore" "$(gcloud redis instances list --region=us-central1 --project="${PROJECT_ID}" --format='value(name)' 2>/dev/null)"

# Neon Postgres lives outside GCP (costless tier) - just a reminder.
echo
echo "Neon Postgres is on the costless tier (no GCP charge)."
if [ "${FAIL}" = "1" ]; then
  echo "Some billing resources remain - see above."
  exit 1
fi
echo "No GCP billing resources remain."
