#!/usr/bin/env bash
# Dedicated helper script to promote a user account to EDUCATOR role.
set -euo pipefail

REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
EMAIL="${1:-demo.educator@studed.lk}"
ROLE="${2:-EDUCATOR}"
DB_URL="${STUDED_DATABASE_URL:-${DATABASE_CONNECTION_STRING:-${DATABASE_URL:-}}}"

if [ -z "${DB_URL}" ]; then
  echo "[provision-educator] warning: No database connection string provided; skipping role promotion."
  exit 0
fi

(cd "${REPO_ROOT}/scripts/tools/promote-user" && go run . -db-url "${DB_URL}" -email "${EMAIL}" -role "${ROLE}")
