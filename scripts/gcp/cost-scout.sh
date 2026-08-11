#!/usr/bin/env bash
# GCP cost scout: hierarchical, live inventory of every resource that can bill,
# grouped per project, with estimated monthly cost and alert flags.
#
#   ./scripts/gcp/cost-scout.sh                 # one-shot scan of studed-prod
#   ./scripts/gcp/cost-scout.sh -p a,b          # scan multiple projects
#   ./scripts/gcp/cost-scout.sh -w -n 60        # watch mode (re-scan every 60s)
#   ./scripts/gcp/cost-scout.sh -s             # exit non-zero if any alert
#
# Costs are APPROXIMATE on-demand USD/month (no egress/data/network transfer).
# All math is integer cents; the display helper formats to dollars.
set -uo pipefail

PROJECTS="${PROJECT_ID:-studed-prod}"
WATCH=0
INTERVAL=60
STRICT=0
while getopts "p:wn:s" opt; do
  case "$opt" in
    p) PROJECTS="$OPTARG" ;;
    w) WATCH=1 ;;
    n) INTERVAL="$OPTARG" ;;
    s) STRICT=1 ;;
    *) echo "usage: $0 [-p proj1,proj2] [-w] [-n seconds] [-s]" >&2; exit 2 ;;
  esac
done

# ---------------------------------------------------------------------------
# Approximate on-demand pricing, in USD CENTS per month. Edit to match current
# GCP SKUs for your region. (No associative arrays - the script must also run
# under the bash 3.2 that ships with macOS.)
# ---------------------------------------------------------------------------
vm_cents() {
  case "$1" in
    e2-micro)      echo 500 ;;
    e2-small)      echo 1200 ;;
    e2-medium)     echo 2400 ;;
    e2-standard-1) echo 3100 ;;
    e2-standard-2) echo 6200 ;;
    e2-standard-4) echo 12400 ;;
    e2-standard-8) echo 24800 ;;
    n1-standard-1) echo 3000 ;;
    n1-standard-2) echo 6000 ;;
    n1-standard-4) echo 12000 ;;
    n2-standard-1) echo 4300 ;;
    n2-standard-2) echo 8700 ;;
    n2-standard-4) echo 17400 ;;
    *)             echo 6200 ;;
  esac
}
DISK_CENTS_PD_STANDARD=4    # per GB / month (0.04)
DISK_CENTS_PD_BALANCED=10   # (0.10)
DISK_CENTS_PD_SSD=17        # (0.17)
STATIC_IP_CENTS=360         # ~$0.005/hr
NAT_ROUTER_CENTS=3300       # ~$0.045/hr gateway
LB_FWD_RULE_CENTS=1830      # ~$0.025/hr global forwarding rule
BUCKET_CENTS_GB=3           # ~$0.026/GB storage
CLOUD_ARMOR_CENTS=500       # ~$5/mo

ALERTS=()

fmt_cents() { awk -v c="$1" 'BEGIN{printf "$%.2f", c/100}'; }

# ---------------------------------------------------------------------------
scan_project() {
  local PROJECT="$1"
  local total=0
  local n_clusters n_inst n_disk n_addr n_fwd n_router n_waf n_run n_bkt

  echo "┌─ COST SCOUT ─ ${PROJECT} ─ $(date -u +%Y-%m-%dT%H:%M:%SZ)"

  # --------------------------------------------------------------- COMPUTE
  echo "├─ COMPUTE"
  n_clusters="$(gcloud container clusters list --project="$PROJECT" --format='value(name)' 2>/dev/null | grep -c . || true)"
  echo "│   ├─ GKE clusters (${n_clusters:-0})"
  while IFS=$'\t' read -r name loc status nodes mtype; do
    [ -z "$name" ] && continue
    nodes="${nodes:-0}"
    mtype="${mtype:-e2-standard-2}"
    est=0
    [ "$status" = "RUNNING" ] && est=$(( nodes * $(vm_cents "$mtype") ))
    total=$(( total + est ))
    flag=""
    if [ "$status" != "RUNNING" ]; then
      flag="  ⚠ NOT RUNNING (may still bill / wedged)"
      ALERTS+=("${PROJECT}: cluster ${name} is ${status} - not RUNNING")
    elif [ "$nodes" = "0" ]; then
      flag="  (scaled to 0 - standby)"
    fi
    echo "│   │   ├─ ${name}  ${loc}  [${status}]  ${nodes} nodes (${mtype})  ~$(fmt_cents "$est")/mo${flag}"
  done < <(gcloud container clusters list --project="$PROJECT" --format=json 2>/dev/null | jq -r '.[] | [.name,.location,.status,(.currentNodeCount//0),(.nodePools[0].config.machineType//"e2-standard-2")] | @tsv')

  n_inst="$(gcloud compute instances list --project="$PROJECT" --format='value(name)' 2>/dev/null | grep -c . || true)"
  echo "│   ├─ Compute instances (${n_inst:-0})"
  while IFS=$'\t' read -r name mtype status; do
    [ -z "$name" ] && continue
    est="$(vm_cents "$mtype")"
    total=$(( total + est ))
    echo "│   │   ├─ ${name}  ${mtype}  [${status}]  ~$(fmt_cents "$est")/mo"
  done < <(gcloud compute instances list --project="$PROJECT" --format=json 2>/dev/null | jq -r '.[] | [.name,(.machineType|split("/")[-1]),.status] | @tsv')

  n_disk="$(gcloud compute disks list --project="$PROJECT" --format='value(name)' 2>/dev/null | grep -c . || true)"
  echo "│   ├─ Persistent disks (${n_disk:-0})"
  while IFS=$'\t' read -r name size type; do
    [ -z "$name" ] && continue
    case "$type" in
      *balanced*) rate="$DISK_CENTS_PD_BALANCED" ;;
      *ssd*)      rate="$DISK_CENTS_PD_SSD" ;;
      *)          rate="$DISK_CENTS_PD_STANDARD" ;;
    esac
    est=$(( size * rate ))
    total=$(( total + est ))
    echo "│   │   ├─ ${name}  ${size}GB ${type}  ~$(fmt_cents "$est")/mo"
  done < <(gcloud compute disks list --project="$PROJECT" --format=json 2>/dev/null | jq -r '.[] | [.name,.sizeGb,(.type|split("/")[-1])] | @tsv')

  # ------------------------------------------------------------- NETWORKING
  echo "├─ NETWORKING"
  n_addr="$(gcloud compute addresses list --project="$PROJECT" --format='value(name)' 2>/dev/null | grep -c . || true)"
  echo "│   ├─ Static IPs (${n_addr:-0})"
  used_ips="$(gcloud compute forwarding-rules list --global --project="$PROJECT" --format='value(IPAddress)' 2>/dev/null)"
  while IFS=$'\t' read -r r; do
    [ -z "$r" ] && continue
    used_ips="$used_ips $(gcloud compute forwarding-rules list --region="$r" --project="$PROJECT" --format='value(IPAddress)' 2>/dev/null)"
  done < <(gcloud compute regions list --project="$PROJECT" --format='value(name)' 2>/dev/null)
  while IFS=$'\t' read -r name ip atype status; do
    [ -z "$name" ] && continue
    total=$(( total + STATIC_IP_CENTS ))
    flag=""
    if ! grep -q "^${ip}$" <<<"$used_ips"; then
      flag="  ⚠ IDLE static IP (billing, not attached to any load balancer)"
      ALERTS+=("${PROJECT}: static IP ${name} (${ip}) is unused but billing")
    fi
    echo "│   │   ├─ ${name}  ${ip}  [${atype}/${status}]  ~$(fmt_cents "$STATIC_IP_CENTS")/mo${flag}"
  done < <(gcloud compute addresses list --project="$PROJECT" --format=json 2>/dev/null | jq -r '.[] | [.name,.address,.addressType,.status] | @tsv')

  n_fwd="$(gcloud compute forwarding-rules list --global --project="$PROJECT" --format='value(name)' 2>/dev/null | grep -c . || true)"
  echo "│   ├─ Forwarding rules (${n_fwd:-0})"
  if [ "${n_fwd:-0}" -gt 0 ]; then
    total=$(( total + n_fwd * LB_FWD_RULE_CENTS ))
    while IFS=$'\t' read -r name ip scheme; do
      [ -z "$name" ] && continue
      echo "│   │   ├─ ${name}  ${ip}  [${scheme}]  ~$(fmt_cents "$LB_FWD_RULE_CENTS")/mo"
    done < <(gcloud compute forwarding-rules list --global --project="$PROJECT" --format=json 2>/dev/null | jq -r '.[] | [.name,.IPAddress,.loadBalancingScheme] | @tsv')
  fi

  n_router="$(gcloud compute routers list --project="$PROJECT" --format='value(name)' 2>/dev/null | grep -c . || true)"
  echo "│   ├─ Cloud NAT routers (${n_router:-0})"
  if [ "${n_router:-0}" -gt 0 ]; then
    total=$(( total + n_router * NAT_ROUTER_CENTS ))
    while IFS=$'\t' read -r name net; do
      [ -z "$name" ] && continue
      echo "│   │   ├─ ${name}  (${net##*/})  ~$(fmt_cents "$NAT_ROUTER_CENTS")/mo"
    done < <(gcloud compute routers list --project="$PROJECT" --format=json 2>/dev/null | jq -r '.[] | [.name,.network] | @tsv')
  fi

  n_waf="$(gcloud compute security-policies list --project="$PROJECT" --format='value(name)' 2>/dev/null | grep -c . || true)"
  echo "│   ├─ Cloud Armor policies (${n_waf:-0})"
  if [ "${n_waf:-0}" -gt 0 ]; then
    total=$(( total + n_waf * CLOUD_ARMOR_CENTS ))
    gcloud compute security-policies list --project="$PROJECT" --format='value(name)' 2>/dev/null | sed 's/^/│   │   ├─ /'
    echo "│   │   └─ (≈ $(fmt_cents $(( n_waf * CLOUD_ARMOR_CENTS )))/mo)"
  fi

  # ------------------------------------------------------------- SERVERLESS
  echo "├─ SERVERLESS"
  n_run="$(gcloud run jobs list --project="$PROJECT" --format='value(metadata.name)' 2>/dev/null | grep -c . || true)"
  echo "│   ├─ Cloud Run jobs (${n_run:-0}) - ~\$0/mo (execution-based)"
  [ "${n_run:-0}" -gt 0 ] && gcloud run jobs list --project="$PROJECT" --format='value(metadata.name)' 2>/dev/null | sed 's/^/│   │   ├─ /'
  n_sched="$(gcloud scheduler jobs list --project="$PROJECT" --location=- --format='value(name)' 2>/dev/null | grep -c . || true)"
  echo "│   ├─ Cloud Scheduler jobs (${n_sched:-0}) - ~\$0/mo (free tier)"

  # ------------------------------------------------------------------ DATA
  echo "├─ DATA"
  # Name-only listing (no --format=json): the JSON form fetches per-bucket
  # estimatedSizeBytes metadata which makes a one-shot scan take minutes.
  n_bkt="$(gcloud storage buckets list --project="$PROJECT" --format='value(name)' 2>/dev/null | grep -c . || true)"
  echo "│   ├─ GCS buckets (${n_bkt:-0}) - storage billed per-GB (see console)"
  gcloud storage buckets list --project="$PROJECT" --format='value(name)' 2>/dev/null | sed 's/^/│   │   ├─ /'
  echo "│   └─ Postgres: Neon (managed, outside GCP - costless tier)"

  # ---------------------------------------------------------------- TOTAL
  echo "└─ ESTIMATED MONTHLY COST: $(fmt_cents "$total")/mo  (on-demand compute, no egress/data)"
}

for p in ${PROJECTS//,/ }; do
  scan_project "$p"
done

if [ "${#ALERTS[@]}" -gt 0 ]; then
  echo ""
  echo "ALERTS:"
  for a in "${ALERTS[@]}"; do
    echo "  ⚠ $a"
  done
  if [ "$STRICT" = "1" ]; then
    exit 1
  fi
fi

if [ "$WATCH" = "1" ]; then
  echo ""
  echo "watching every ${INTERVAL}s (Ctrl-C to stop)"
  while true; do
    sleep "$INTERVAL"
    clear 2>/dev/null || true
    for p in ${PROJECTS//,/ }; do
      scan_project "$p"
    done
  done
fi
