#!/usr/bin/env bash
set -euo pipefail

REPO_ROOT="$(cd "$(dirname "$0")/.." && pwd)"
LOG_DIR="${REPO_ROOT}/.dev-logs"
PID_FILE="${REPO_ROOT}/.dev-pids"

ensure_env() {
  local svc="$1"
  local dir="${REPO_ROOT}/services/${svc}"
  if [ ! -f "${dir}/.env" ] && [ -f "${dir}/.env.example" ]; then
    echo "[dev] creating ${svc}/.env from .env.example"
    cp "${dir}/.env.example" "${dir}/.env"
  fi
}

start_service() {
  local svc="$1"
  local dir="${REPO_ROOT}/services/${svc}"
  local log="${LOG_DIR}/${svc}.log"
  echo "[dev] starting ${svc}..."
  (
    cd "${dir}"
    if [ -f .env ]; then
      set -a
      # shellcheck source=/dev/null
      . .env
      set +a
    fi
    go run . >>"${log}" 2>&1
  ) &
  echo "$!:${svc}" >>"${PID_FILE}"
}

stop_all() {
  if [ -f "${PID_FILE}" ]; then
    while IFS=: read -r pid svc; do
      if kill -0 "${pid}" 2>/dev/null; then
        echo "[dev] stopping ${svc} (${pid})"
        kill "${pid}" 2>/dev/null || true
      fi
    done <"${PID_FILE}"
    rm -f "${PID_FILE}"
  fi
}

cleanup() {
  echo "[dev] shutting down..."
  stop_all
  exit 0
}

trap cleanup INT TERM EXIT

mkdir -p "${LOG_DIR}"
rm -f "${PID_FILE}"

if ! docker info >/dev/null 2>&1; then
  echo "[dev] error: docker daemon is not running. Start Docker Desktop first."
  exit 1
fi

echo "[dev] starting infrastructure..."
docker compose -f "${REPO_ROOT}/docker-compose.yml" up -d postgres redis elasticsearch

echo "[dev] waiting for postgres..."
for _ in {1..30}; do
  if docker exec studed-postgres pg_isready -U studed -d studed >/dev/null 2>&1; then
    break
  fi
  sleep 1
done

	ensure_env auth-service
	ensure_env course-service
	ensure_env progress-service
	ensure_env gamification-service
	ensure_env api-gateway

	start_service auth-service
	sleep 1
	start_service course-service
	sleep 1
	start_service gamification-service
	sleep 1
	start_service progress-service
	sleep 1
	start_service api-gateway

echo ""
echo "[dev] core services starting. logs: ${LOG_DIR}"
echo "[dev] graphql playground: http://localhost:8080/"
echo "[dev] frontend dev server: cd frontend && bun run dev"
echo "[dev] press Ctrl+C to stop"

while true; do
  sleep 1
done
