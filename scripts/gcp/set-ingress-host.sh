#!/usr/bin/env bash
# Replace the api.PLACEHOLDER.sslip.io host in the ArgoCD-managed ingress and
# managed-cert manifests with the real static IP OpenTofu created, then commit
# and push. ArgoCD clones the manifests straight from git (selfHeal on), so this
# MUST run before its first sync or the GCE Ingress/cert will target a bogus
# host and the HTTPS health gate + seeder will fail.
#
# Idempotent: exits 0 with a no-op message when the host is already correct.
#
#   scripts/gcp/set-ingress-host.sh              # IP from `tofu output`
#   scripts/gcp/set-ingress-host.sh 34.68.1.2    # explicit IP
set -euo pipefail

REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
TF_DIR="${PROD_TF_DIR:-${REPO_ROOT}/infra/gcp/terraform-prod}"
MANIFESTS=(
  "${REPO_ROOT}/infra/k8s/production/ingress.yaml"
  "${REPO_ROOT}/infra/k8s/production/managed-cert.yaml"
)

if [[ -n "${1:-}" ]]; then
  IP="$1"
else
  IP="$(cd "${TF_DIR}" && tofu output -raw ingress_static_ip 2>/dev/null || true)"
fi

if [[ -z "${IP}" ]]; then
  echo "error: no IP given and OpenTofu has no ingress_static_ip output" >&2
  echo "       run 'cd ${TF_DIR} && tofu output' to inspect the state" >&2
  exit 1
fi

HOST="api.${IP}.sslip.io"
changed=0
for f in "${MANIFESTS[@]}"; do
  # Re-pin unconditionally: replace PLACEHOLDER or any previously pinned
  # api.<ip>.sslip.io host so a fresh static IP (project re-created) always
  # ends up in the manifests before ArgoCD's first sync.
  if grep -Eq 'api\.(PLACEHOLDER|[0-9]+\.[0-9]+\.[0-9]+\.[0-9]+)\.sslip\.io' "$f"; then
    sed -i '' -E "s/api\.(PLACEHOLDER|[0-9]+\.[0-9]+\.[0-9]+\.[0-9]+)\.sslip\.io/${HOST}/g" "$f"
    echo "  updated $(basename "$f") -> host ${HOST}"
    changed=1
  fi
done

if [[ "$changed" -eq 0 ]]; then
  echo "  ingress host already correct (${HOST})"
  exit 0
fi

git -C "${REPO_ROOT}" add infra/k8s/production/ingress.yaml infra/k8s/production/managed-cert.yaml
git -C "${REPO_ROOT}" commit -m "chore(k8s): pin ingress/managed-cert host to ${HOST}" >/dev/null
if ! git -C "${REPO_ROOT}" push origin HEAD 2>/dev/null; then
  echo "  push rejected (remote moved) - rebasing then retrying once"
  git -C "${REPO_ROOT}" pull --rebase origin main
  git -C "${REPO_ROOT}" push origin HEAD
fi
echo "  committed + pushed: ingress/managed-cert host = ${HOST}"
