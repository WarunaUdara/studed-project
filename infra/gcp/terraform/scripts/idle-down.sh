#!/usr/bin/env bash
# Idle-scout: called hourly by Cloud Scheduler -> Cloud Run job.
# If the HTTPS load balancer saw no requests in the last IDLE_WINDOW_HOURS,
# scale the GKE node pool to 0 nodes. Node charges are ~99% of running cost.
#
# Config comes from env (set on the Cloud Run job in idle.tf).
set -euo pipefail

PROJECT="${STUDED_PROJECT:?}"
CLUSTER="${STUDED_CLUSTER:?}"
ZONE="${STUDED_ZONE:?}"
NODE_POOL="${STUDED_NODE_POOL:?}"
IDLE_HOURS="${STUDED_IDLE_HOURS:-2}"

log() { echo "[idle-scout] $*"; }

# 1. Short-lived token from the metadata server (no keys on disk).
TOKEN="$(curl -s -H 'Metadata-Flavor: Google' \
  'http://metadata.google.internal/computeMetadata/v1/instance/service-accounts/default/token' \
  | sed -E 's/.*"access_token":"([^"]+)".*/\1/')"

# 2. Sum HTTPS load-balancer requests over the idle window.
NOW_EPOCH="$(date -u +%s)"
START_EPOCH="$((NOW_EPOCH - IDLE_HOURS * 3600))"
START="$(date -u -d "@${START_EPOCH}" +%Y-%m-%dT%H:%M:%SZ)"
END="$(date -u -d "@${NOW_EPOCH}" +%Y-%m-%dT%H:%M:%SZ)"
# Metric: loadbalancing.googleapis.com/https/request_count (excludes LB health checks)
FILTER='metric.type%3D%22loadbalancing.googleapis.com%2Fhttps%2Frequest_count%22'
URL="https://monitoring.googleapis.com/v3/projects/${PROJECT}/timeSeries"
URL+="?interval.startTime=${START}&interval.endTime=${END}&filter=${FILTER}"
RESP="$(curl -s -H "Authorization: Bearer ${TOKEN}" "${URL}")"

# Sum metric points with python3 (jq is not present in the cloud-sdk image).
COUNT="$(printf '%s' "${RESP}" | python3 -c '
import json, sys
try:
    d = json.load(sys.stdin)
    total = 0.0
    for ts in d.get("timeSeries", []):
        for p in ts.get("points", []):
            v = p.get("value", {}) or {}
            val = v.get("int64Value") or v.get("doubleValue")
            if val is not None:
                total += float(val)
    print(int(total))
except Exception:
    print(0)
')"

# 3. Scale to zero when idle.
if [ "$COUNT" -le 0 ] 2>/dev/null; then
  log "no traffic in the last ${IDLE_HOURS}h - scaling ${CLUSTER}/${NODE_POOL} to 0 nodes"
  gcloud container clusters update "${CLUSTER}" \
    --node-pool "${NODE_POOL}" --num-nodes 0 \
    --zone "${ZONE}" --project "${PROJECT}" --quiet
  log "scaled down - run 'make prod-start' to wake the backend"
else
  log "traffic detected (${COUNT} requests) - leaving cluster up"
fi
