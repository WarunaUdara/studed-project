# StudEd Production Costs & Billing Risk Analysis

Goal: run the demo a few hours, then stop every billable resource. This doc
lists what actually bills, the sneaky charges that can quietly raise the bill,
and how the automation keeps spending near zero.

## What bills on GCP (all in project `studed-prod`)

| Resource | Config | Monthly if left on 24/7 | Notes |
| :--- | :--- | :--- | :--- |
| GKE nodes | 2x `e2-standard-2` | ~$75 | **The big one.** Billed per second while running. |
| HTTPS Load Balancer | L7 ingress | ~$18 | Flat charge **even with zero traffic** while the forwarding rule exists. |
| Cloud Armor | 1 WAF policy | ~$5 | Per policy per month. |
| Cloud NAT | 1 gateway | ~$0.5 | Egress + gateway fee. |
| GKE control plane | Standard zonal | $0 | Free on Standard (unlike Autopilot/regional). |
| Static IP | 1x global | $0 | Free while attached to an in-use forwarding rule. |

Non-GCP: **Neon Postgres** costless tier = $0; **Cloudflare** free plan = $0;
**GHCR + GitHub Actions** public repo = $0. Total worst case if left running
forever: **~$100/mo**, all absorbed by the $300 free-trial credit for ~3 months.

## Critical bill-raisers (the ones people miss)

1. **Load balancer flat fee while idle.** Scaling the node pool to 0 (standby)
   does NOT stop the ~$18/mo LB + ~$5/mo Cloud Armor charges. Only `tofu
   destroy` removes the forwarding rule + policy. `prod-stop` is for a short
   break; `prod-destroy` is the only true $0 state.
2. **Node pool drift after idle-scout.** The hourly idle-scout scales nodes to
   0 via `gcloud`, so Terraform state then disagrees with reality. If you later
   run `make prod-start` (tofu apply), it correctly scales back to 2 - but a
   bare `tofu plan` in CI would report a diff. This is harmless (apply
   reconciles), just expect it.
3. **Elasticsearch / Redis memory.** These run on the GKE nodes, so their RAM
   is included in the node bill - but ES had an OOM at 512Mi; it now needs 1Gi.
   If you ever add workloads, watch node memory pressure (pods going
   `Unschedulable` = you are paying for idle slack on a 3rd node).
4. **The idle-scout's own schedule.** It is free tier, but if you lower the
   cron to every 5 minutes, Cloud Run job executions begin to cost
   ($0.000016/s per vCPU, 1M requests free - still tiny). Keep it hourly.
5. **Neon autoscaling.** On the costless plan Neon sleeps when idle, but if the
   project is "always on" compute mode it can exceed the free hours. Leave the
   default autoscaling/scale-to-zero.
6. **Control-plane access from a VPC you forgot.** We use a public endpoint
   restricted to `authorized_cidrs`. If you later enable private endpoint,
   keep the NAT/VPC peered - extra networking components bill.
7. **Manual kubectl `apply` bypassing GitOps.** Anything applied by hand is
   invisible to ArgoCD and survives `tofu destroy`? No - `tofu destroy` kills
   the cluster, so orphaned manifests go with it. The real risk is drift on the
   *next* `tofu apply` (state vs. hand-applied resources). Always change prod
   through `infra/k8s/production` + ArgoCD.

## The one-command cost controls

| Command | Effect | Remaining monthly cost |
| :--- | :--- | :--- |
| `make prod-stop` | Standby: node pool -> 0 (via tofu, state stays consistent) | ~$23 (LB + WAF) |
| `make prod-start` | Wake: node pool -> 2 | back to full (~$100) |
| idle-scout (auto) | After 2h no traffic: node pool -> 0 (via gcloud) | ~$23 until `prod-start` |
| `make prod-destroy` | `tofu destroy` + Pages project delete | $0 |
| `make prod-destroy --delete-project` | also `gcloud projects delete studed-prod` | $0 (nuclear) |
| `make prod-teardown-audit` | lists any remaining billable GCP resources | - |

## Free-trial math

- $300 credit / ~$100/mo worst case = ~3 months if you ignore it.
- For a demo that is live a few hours per session: nodes ~$0.10/h, LB flat
  ~$0.024/h, WAF ~$0.007/h -> roughly **$0.13/hour while actually running**.
- Idle (standby) costs ~$0.03/h (LB + WAF only).
- After `prod-destroy`: exactly $0. Re-deploy later with `make prod-deploy`
  (reuses Neon + Pages, recreates GCP from Terraform).

## Recommended habit

1. Do the demo.
2. `make prod-destroy` (or leave it on standby for the next demo day and let
   idle-scout handle overnight).
3. `make prod-teardown-audit` to confirm nothing bills.
4. Neon + Cloudflare + GHCR stay at $0 forever; GCP is fully reclaimed.
