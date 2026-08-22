#!/usr/bin/env bash
# Pin the pre-prod ingress/cert hosts to api-preprod.<ip>.sslip.io (same
# static IP as production; host-based routing on the shared GCE LB).
# Must run before ArgoCD's first sync of infra/k8s/pre-production, mirroring
# the production flow. Idempotent.
set -euo pipefail

REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
TF_DIR="${PROD_TF_DIR:-${REPO_ROOT}/infra/gcp/terraform-prod}"
MANIFESTS=(
  "${REPO_ROOT}/infra/k8s/pre-production/patches/ingress-patch.yaml"
  "${REPO_ROOT}/infra/k8s/pre-production/patches/managed-cert-patch.yaml"
)

if [[ -n "${1:-}" ]]; then
  IP="$1"
else
  IP="$(cd "${TF_DIR}" && tofu output -raw ingress_static_ip 2>/dev/null || true)"
fi

if [[ -z "${IP}" ]]; then
  echo "error: no IP given and OpenTofu has no ingress_static_ip output" >&2
  exit 1
fi

HOST="api-preprod.${IP}.sslip.io"
changed=0
for f in "${MANIFESTS[@]}"; do
  if grep -Eq 'api-preprod\.(PLACEHOLDER|[0-9]+\.[0-9]+\.[0-9]+\.[0-9]+)\.sslip\.io' "$f"; then
    sed -i '' -E "s/api-preprod\.(PLACEHOLDER|[0-9]+\.[0-9]+\.[0-9]+\.[0-9]+)\.sslip\.io/${HOST}/g" "$f"
    echo "  updated $(basename "$f") -> host ${HOST}"
    changed=1
  fi
done

if [[ "$changed" -eq 0 ]]; then
  echo "  preprod ingress host already correct (${HOST})"
  exit 0
fi

git -C "${REPO_ROOT}" add infra/k8s/pre-production/patches/ingress-patch.yaml infra/k8s/pre-production/patches/managed-cert-patch.yaml
git -C "${REPO_ROOT}" commit -m "chore(k8s): pin preprod ingress/managed-cert host to ${HOST}" >/dev/null
if ! git -C "${REPO_ROOT}" push origin HEAD 2>/dev/null; then
  echo "  push rejected (remote moved) - rebasing then retrying once"
  git -C "${REPO_ROOT}" pull --rebase origin main
  git -C "${REPO_ROOT}" push origin HEAD
fi
echo "  committed + pushed: preprod ingress/managed-cert host = ${HOST}"