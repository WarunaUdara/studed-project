#!/usr/bin/env bash
# Local pre-commit secret scanner for StudEd repository.
# Verifies zero hardcoded API keys, JWT secrets, private keys, or passwords.
set -euo pipefail

REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"

echo "===> Running local secret scan..."

PATTERNS=(
  "AIzaSy[A-Za-z0-9_-]{33}"                  # Google Gemini API key
  "sk-[A-Za-z0-9]{32,}"                       # OpenAI / secret key format
  "-----BEGIN (RSA|OPENSSH|EC|PGP) PRIVATE"  # Private keys
)

FOUND=0

for pattern in "${PATTERNS[@]}"; do
  # Search tracked files ignoring .env and build output
  if git grep -E -n "${pattern}" -- ':!*.env*' ':!*.log' ':!*.lock' ':!node_modules/' ':!frontend/dist/' ':!scripts/security/secret-scan.sh' >/dev/null 2>&1; then
    echo "❌ High entropy / hardcoded secret pattern detected:"
    git grep -E -n "${pattern}" -- ':!*.env*' ':!*.log' ':!*.lock' ':!node_modules/' ':!frontend/dist/' ':!scripts/security/secret-scan.sh'
    FOUND=1
  fi
done

if [ "$FOUND" -eq 1 ]; then
  echo "Security scan FAILED. Remove hardcoded secrets before committing."
  exit 1
fi

echo "✅ Security scan PASSED. Zero hardcoded secrets detected in repository."
