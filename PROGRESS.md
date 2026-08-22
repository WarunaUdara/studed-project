# StudEd Deployment — Live Progress Board

Auto-updated during the deployment. Checkboxes reflect real state.

## Phase 1 — Local validation (before touching prod)
- [x] Started floci-gcp emulator + full prod-sim stack locally
- [x] Documented floci-gcp capability limits (no IAM, node pools, compute, scheduler) — docs/FLOCI-GCP-LOCAL-TESTING.md
- [x] Measured local loading times: first login 10.3s / first query 5.1s
- [x] Fixed gRPC cold-start (keepalive + eager connect): login 10.3s → 229ms
- [x] Fixed frontend: stripped 908 kB Puck editor from entry preload (1.83 MB → 821 kB)
- [x] All tests passed: Go tests, 187 frontend tests, typecheck

## Phase 2 — GCP project + database
- [x] Project `studed-prod` was DELETE_REQUESTED → restored, billing re-linked
- [x] Worked around Mac IPv6 blackhole (gcloud hangs) via local v4 proxy
- [x] Created isolated pre-prod Neon database `studed_preprod` + grants
- [x] Secret Manager populated (owner URL + channel-binding creds, no secrets in git)

## Phase 3 — Infrastructure (OpenTofu + GKE)
- [x] VPC, subnets, NAT, static IP 34.102.169.180, Cloud Armor WAF, Cloud Scheduler, idle-scout
- [x] GKE cluster `studed-prod` (2 nodes, autoscaled 3 during pre-prod) — ~25 min, GCP-side wait
- [x] IAM role tombstone workaround (`studed2IdleScout` → `studed2IdleScout2`)

## Phase 4 — Backend workloads
- [x] ArgoCD + external-secrets installed and syncing from git (selfHeal on)
- [x] 15/15 prod pods Running (all services)
- [x] 11/11 pre-prod pods Running (`studed-preprod` namespace)
- [x] Fixed missing `studed-opencode-api-key` secret (repo bug: manifest required it, nothing created it)
- [x] Fixed Neon ownership: migrations now run as DB owner (`DATABASE_OWNER_URL`), runtime stays least-privilege
- [x] Pinned all service images to tested `sha-9f9ecc4` in git (ArgoCD has one source of truth)

## Phase 5 — TLS (current blocker)
- [ ] Google managed cert stalled (no port-80 validation path; ArgoCD reverted live fixes until committed to git)
- [x] Committed port-80 + ACME challenge route to git; single shared LB now serves both prod + pre-prod hosts
- [x] In-cluster certbot (nginx+python webroot) serving challenges; let's-encrypt rate-limit window passed
- [ ] Cert issued → imported to GCP as `studed-le-cert`
- [ ] Ingress bound to `studed-le-cert`, HTTPS green on api.<ip>.sslip.io + api-preprod.<ip>.sslip.io

## Phase 6 — Frontend connectivity (wrangler)
- [x] `studed-project-frontend` Pages project: API_ORIGIN set to new backend IP
- [x] `studed-project-preview` Pages project created + deployed + API_ORIGIN set (pre-prod)
- [ ] Flip API_ORIGIN back to https once cert is Active (currently pointing at http bridge, Cloudflare blocks it → flip is mandatory)
- [ ] Verify login + GraphQL through https://studed-project-frontend.pages.dev

## Phase 7 — Seed + verification
- [ ] Seed demo data (educator + student accounts, courses, waves, XP)
- [ ] Verify prod + pre-prod loading times on the live cluster
- [ ] `make security-scan` PASSED (no secrets in git)
- [ ] Final smoke: frontend → backend end-to-end

## Why this deployment took long (short version)
| Cause | Time | Type |
| :--- | :--- | :--- |
| GKE cluster + node pool provisioning | ~25 min | GCP wait (unavoidable) |
| Project found in DELETE_REQUESTED state | ~10 min | Env drift (restore + billing) |
| IPv6 blackhole on this Mac hung gcloud | ~10 min | Env drift (proxy workaround) |
| IAM role soft-deletion tombstone | ~15 min | GCP quirk (role rename) |
| 4 latent repo bugs (missing secret, image pins, DB ownership, kustomize CRD) | ~40 min | Found live; each needed a fix + CI rebuild cycle |
| Managed cert never validated (port 80 disabled) | ~2.5 h | GCP bug + ArgoCD reverting live fixes until committed to git |
| Let's Encrypt rate limit from certbot crash-loop | ~15 min | Self-inflicted; fixed with persistent account |