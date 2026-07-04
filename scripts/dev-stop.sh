#!/usr/bin/env bash
set -euo pipefail

REPO_ROOT="$(cd "$(dirname "$0")/.." && pwd)"
PID_FILE="${REPO_ROOT}/.dev-pids"

if [ ! -f "${PID_FILE}" ]; then
  echo "[dev-stop] no pid file found; services may not be running"
  exit 0
fi

while IFS=: read -r pid svc; do
  if kill -0 "${pid}" 2>/dev/null; then
    echo "[dev-stop] stopping ${svc} (${pid})"
    kill "${pid}" 2>/dev/null || true
  else
    echo "[dev-stop] ${svc} (${pid}) already stopped"
  fi
done <"${PID_FILE}"

rm -f "${PID_FILE}"
echo "[dev-stop] done"
