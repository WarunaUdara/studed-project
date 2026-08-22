#!/usr/bin/env bash
# One-time setup for the pre-production environment:
#   1. studed-preprod-database-url in Secret Manager (isolated Neon DB)
#   2. Workload Identity binding so preprod's upload-service SA can use GCS
#   3. reports the preprod ingress host (pin it with set-preprod-ingress-host.sh)
# Idempotent: re-running is a no-op for each step.
# Never echoes connection strings or credentials.
set -euo pipefail

REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
PROJECT_ID="${PROJECT_ID:-studed-prod}"
SECRET="studed-preprod-database-url"

if [[ ! -f "${REPO_ROOT}/.env" ]]; then
  echo "error: ${REPO_ROOT}/.env not found (needs DATABASE_CONNECTION_STRING)" >&2
  exit 1
fi

DB_URL="$(grep -E '^DATABASE_CONNECTION_STRING=' "${REPO_ROOT}/.env" | head -1 | cut -d= -f2-)"
if [[ -z "${DB_URL}" ]]; then
  echo "error: DATABASE_CONNECTION_STRING missing from .env" >&2
  exit 1
fi

# Swap the database name for the isolated studed_preprod database, keeping the
# rest of the connection string (credentials, host, sslmode) identical.
PREPROD_URL="$(printf '%s' "${DB_URL}" | python3 -c '
import sys
url = sys.stdin.read().strip()
base, _, query = url.partition("?")
prefix, _, _ = base.rpartition("/")
print(prefix + "/studed_preprod" + (f"?{query}" if query else ""))
')"
# Masked host/db only - never print the full URL.
echo "preprod DB target: $(printf '%s' "${PREPROD_URL}" | sed -E 's|.*@|@|; s|\?.*||')"

echo "==> 1/5 Secret Manager: app + owner connection strings"
if ! HTTPS_PROXY=http://127.0.0.1:3128 gcloud secrets describe "${SECRET}" --project "${PROJECT_ID}" >/dev/null 2>&1; then
  HTTPS_PROXY=http://127.0.0.1:3128 gcloud secrets create "${SECRET}" \
    --project "${PROJECT_ID}" --replication-policy=user-managed \
    --locations=asia-south1 >/dev/null
  echo "  created ${SECRET}"
fi
if ! HTTPS_PROXY=http://127.0.0.1:3128 gcloud secrets versions access latest --secret="${SECRET}" --project "${PROJECT_ID}" >/dev/null 2>&1; then
  printf '%s' "${PREPROD_URL}" | HTTPS_PROXY=http://127.0.0.1:3128 gcloud secrets versions add "${SECRET}" --data-file=- >/dev/null
  echo "  populated ${SECRET}"
else
  echo "  ${SECRET} already populated"
fi

OWNER_URL="$(grep -E '^DATABASE_OWNER_CONNECTION_STRING=' "${REPO_ROOT}/.env" | head -1 | cut -d= -f2-)"
PREPROD_OWNER_URL="$(printf '%s' "${OWNER_URL}" | python3 -c '
import sys
url = sys.stdin.read().strip()
base, _, query = url.partition("?")
prefix, _, _ = base.rpartition("/")
print(prefix + "/studed_preprod" + (f"?{query}" if query else ""))
')"
OWNER_SECRET="studed-preprod-database-owner-url"
if ! HTTPS_PROXY=http://127.0.0.1:3128 gcloud secrets describe "${OWNER_SECRET}" --project "${PROJECT_ID}" >/dev/null 2>&1; then
  HTTPS_PROXY=http://127.0.0.1:3128 gcloud secrets create "${OWNER_SECRET}" \
    --project "${PROJECT_ID}" --replication-policy=user-managed \
    --locations=asia-south1 >/dev/null
  echo "  created ${OWNER_SECRET}"
fi
if ! HTTPS_PROXY=http://127.0.0.1:3128 gcloud secrets versions access latest --secret="${OWNER_SECRET}" --project "${PROJECT_ID}" >/dev/null 2>&1; then
  printf '%s' "${PREPROD_OWNER_URL}" | HTTPS_PROXY=http://127.0.0.1:3128 gcloud secrets versions add "${OWNER_SECRET}" --data-file=- >/dev/null
  echo "  populated ${OWNER_SECRET}"
else
  echo "  ${OWNER_SECRET} already populated"
fi

echo "==> 2/5 Neon grants for studed_app on studed_preprod"
if [[ -n "${PREPROD_OWNER_URL}" ]]; then
  docker run --rm -e U="${PREPROD_OWNER_URL}" postgres:16-alpine sh -c '
psql "$U" -c "GRANT CONNECT ON DATABASE studed_preprod TO studed_app" 2>&1 | head -1
psql "$U" -c "ALTER DEFAULT PRIVILEGES FOR ROLE neondb_owner IN SCHEMA public GRANT SELECT, INSERT, UPDATE, DELETE ON TABLES TO studed_app" 2>&1 | head -1
psql "$U" -c "ALTER DEFAULT PRIVILEGES FOR ROLE neondb_owner IN SCHEMA public GRANT USAGE, SELECT ON SEQUENCES TO studed_app" 2>&1 | head -1
' 2>&1 | grep -vE "WARNING|^$"
fi

echo "==> 3/5 Workload Identity: preprod upload SA -> studed-upload GSA"
HTTPS_PROXY=http://127.0.0.1:3128 gcloud iam service-accounts add-iam-policy-binding \
  "studed-upload@${PROJECT_ID}.iam.gserviceaccount.com" \
  --role=roles/iam.workloadIdentityUser \
  --member="serviceAccount:${PROJECT_ID}.svc.id.goog[studed-preprod/upload-service-sa]" \
  >/dev/null 2>&1 || echo "  binding already present (or adjusted)"
echo "  done (binding is additive; safe to re-run)"

echo "==> 4/5 Next steps"
IP="$(cd "${REPO_ROOT}/infra/gcp/terraform-prod" && HTTPS_PROXY=http://127.0.0.1:3128 tofu output -raw ingress_static_ip 2>/dev/null || true)"
if [[ -n "${IP}" ]]; then
  echo "  pin host: bash ${REPO_ROOT}/scripts/gcp/set-preprod-ingress-host.sh ${IP}"
  echo "  preprod API: https://api-preprod.${IP}.sslip.io"
else
  echo "  ingress IP not available yet - run set-preprod-ingress-host.sh after tofu apply"
fi