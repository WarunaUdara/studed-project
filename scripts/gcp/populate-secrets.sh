#!/usr/bin/env bash
# Populate Secret Manager versions for the StudEd backend.
#
# Reads values from the repo root .env (gitignored) and generates strong
# JWT secrets locally. Run AFTER `tofu apply` and BEFORE deploying workloads.
#
# Usage:
#   ./scripts/gcp/populate-secrets.sh             # idempotent; skips existing
#   ./scripts/gcp/populate-secrets.sh --rotate    # add a new version for every
#                                                 # secret (credential rotation)
set -euo pipefail

PROJECT_ID="${PROJECT_ID:-studed-prod}"
REGION="${REGION:-us-central1}"
REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
ENV_FILE="$REPO_ROOT/.env"
ROTATE="${ROTATE:-false}"
if [[ "${1:-}" == "--rotate" ]]; then
  ROTATE=true
fi

if [[ ! -f "$ENV_FILE" ]]; then
  echo "error: $ENV_FILE not found" >&2
  exit 1
fi

set +u
# shellcheck disable=SC1090
source "$ENV_FILE"
set -u

has_version() {
  local name="$1"
  gcloud secrets versions list "$name" --project="$PROJECT_ID" \
    --filter="state.enabled:true" --format="value(name)" 2>/dev/null | grep -q .
}

put_secret() {
  local name="$1"
  local value="${2:-unconfigured}"
  if [[ -z "$value" ]]; then
    value="unconfigured"
  fi
  if [[ "$ROTATE" != "true" ]] && has_version "$name"; then
    echo "skip $name (already populated - use --rotate to add a new version)"
    return
  fi
  printf '%s' "$value" | gcloud secrets versions add "$name" --data-file=- --project="$PROJECT_ID" >/dev/null
  echo "stored $name"
}

# Neon Postgres connection string from .env (rotated, never the exposed owner cred)
put_secret "studed-database-url" "${DATABASE_CONNECTION_STRING:-}"

# JWT secrets. In rotation mode, mint fresh values and store them.
if [[ "$ROTATE" == "true" ]] || ! has_version "studed-jwt-access-secret"; then
  JWT_ACCESS="$(openssl rand -base64 48 | tr -d '\n')"
  JWT_REFRESH="$(openssl rand -base64 48 | tr -d '\n')"
else
  # Non-rotation runs keep whatever .env holds so first deploy can use it.
  JWT_ACCESS="${JWT_ACCESS_SECRET:-}"
  JWT_REFRESH="${JWT_REFRESH_SECRET:-}"
fi
put_secret "studed-jwt-access-secret" "$JWT_ACCESS"
put_secret "studed-jwt-refresh-secret" "$JWT_REFRESH"

# Placeholders - populate manually when real keys exist
put_secret "studed-gemini-api-key" "${GEMINI_API_KEY:-}"
put_secret "studed-opencode-api-key" "${OPENCODE_API_KEY:-}"
put_secret "studed-payhere-merchant-id" "${PAYHERE_MERCHANT_ID:-}"
put_secret "studed-payhere-merchant-secret" "${PAYHERE_MERCHANT_SECRET:-}"
put_secret "studed-payhere-notify-url" "${PAYHERE_NOTIFY_URL:-}"

# Shared service-to-service token (gateway -> internal services). Kept stable
# across rotations unless SERVICE_TOKEN is explicitly regenerated in .env.
SERVICE_TOKEN="${SERVICE_TOKEN:-$(openssl rand -base64 32 | tr -d '\n')}"
put_secret "studed-service-token" "$SERVICE_TOKEN"
put_secret "studed-gcs-bucket-name" "${GCS_BUCKET_NAME:-studed-uploads-${PROJECT_ID}}"

echo "done. Secrets stored in Secret Manager ($PROJECT_ID)."
