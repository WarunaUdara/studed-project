# StudEd Platform — Pre-Flight Production Readiness Audit

**Auditor role:** Principal Cloud Architect / Lead SRE
**Date:** 2026-08-11
**Branch audited:** `dev/vidun` @ `9e3ee07` (fast-forwarded from `origin/main`, includes PR #75 "implement upload-service with GCS bucket & emulator support")
**Scope:** Architecture, DevOps, Security, SRE, and pre-flight deployment readiness for GCP + Cloudflare Pages.
**Constraint:** Audit and remediate only. **No deployment was performed.** All GCP-side actions are left to the deploying engineer.

---

## 1. Executive Summary & Production Readiness Score

### Verdict at entry: **32 / 100 — NOT DEPLOYABLE**
### Verdict after remediation: **86 / 100 — APPROVED WITH CONDITIONS**

The platform's architecture is genuinely strong: private GKE with Workload Identity, Cloud Armor WAF, default-deny NetworkPolicies, external-secrets, per-service least-privilege IAM, and a real cost-control story (idle-scout + `prod-stop`). The engineering intent is well above typical project standard.

However, **the repository as pulled would not have deployed at all.** Three independent hard blockers each fail `make prod-deploy` outright, and they fail at *different* stages, so fixing one only reveals the next:

1. **`tofu validate` fails** — `storage.tf` (from PR #75) referenced `google_service_account.gke_nodes`, which does not exist (the real name is `gke_node_sa`). Step 1/7 aborts before a single resource is created.
2. **Kyverno would reject 8 of 11 workloads at admission** — three `Enforce`-mode ClusterPolicies demand `runAsNonRoot`, `privileged: false`, and `drop: [ALL]`, but six services plus `redis` and `elasticsearch` shipped with **no `securityContext` at all**. Step 5/7 would hang until timeout with zero pods scheduled.
3. **The upload-service could never run in production** — its manifest existed only in the dev overlay (`infra/k8s/services/`), which ArgoCD does not sync; it was excluded by `.dockerignore`, so no image could be built; and it was absent from the CI publish matrix.

The upload-service merged in PR #75 was also **not production-viable on its own merits**: no authentication on `/upload`, no file-type validation, no enforced size limit, a path-traversal in the local fallback, and it returned `https://storage.googleapis.com/...` URLs that would have returned **403 on the private bucket** — meaning every uploaded image would have been unviewable.

All of the above have been remediated and verified. The remaining gap to 100 is **operational, not structural**: `:latest` image tags everywhere (no rollback), no distributed-trace collector in production, and two services whose hand-written SQL migrations are never applied.

> **Scoring note:** the 86 reflects the state of the repository. It does not certify the live GCP project, which I have no access to and did not touch. The pre-flight checklist in §7 is what closes that gap.

---

## 2. Domain-by-Domain Audit Findings

### Domain 1 — Security & Identity Posture — **PASS** (was FAIL)

| Check | Verdict | Evidence |
|---|---|---|
| Zero hardcoded SA keys / credentials in Git | **PASS** | `scripts/security/secret-scan.sh` → *"Zero hardcoded secrets detected"*. No `*.json` key files tracked. No SA keys in any Dockerfile. |
| Workload Identity binding (Pod → GSA) | **PASS** (fixed) | `workload_identity_config` enabled on the cluster; `external-secrets` correctly bound. **upload-service had no binding at all** — added a dedicated `studed-upload` GSA bound to `studed/upload-service-sa`. |
| Kyverno: non-root execution | **PASS** (fixed) | Policy existed and was `Enforce`, but **6 services + redis + elasticsearch violated it**. All 11 workloads now comply. |
| Kyverno: `readOnlyRootFilesystem` | **PASS** (fixed) | **This policy did not exist.** The audit brief assumed it. Written and set to `Enforce`, with a documented exclusion for Elasticsearch. |
| Kyverno: `drop: [ALL]` | **PASS** (fixed) | Policy existed; 8 workloads violated it. All now comply. |
| Cloud Armor WAF (SQLi/XSS/rate limit) | **PASS** | `armor.tf` implements SQLi, XSS, LFI, and protocol-attack preconfigured rules plus a per-IP throttle at 120 req/min. Well constructed. |
| Least-privilege IAM | **PASS** | Node SA and idle-scout SA are correctly minimal; idle-scout uses a custom role with exactly one permission. |

**Critical finding (fixed): the enforcement gap was total.** Kyverno was configured to `Enforce` policies that the workloads did not satisfy. This is the worst failure mode for admission control — it reads as "secured" in review while guaranteeing a 100% deployment failure. Verified post-fix: all 11 production workloads pass every enforced rule.

**Bucket hardening (fixed):** the merged bucket had `cors { origin = ["*"] }`, no `public_access_prevention`, no versioning, and no lifecycle rules. It also granted `roles/storage.objectAdmin` to the **GKE node SA** — which every pod on the node could borrow. Now: enforced public access prevention, UBLA, versioning, three lifecycle rules, CORS restricted to the frontend origins, and write access scoped to a single dedicated identity.

---

### Domain 2 — SRE & Resiliency Engineering — **PASS** (was FAIL)

| Check | Verdict | Evidence |
|---|---|---|
| Liveness probes | **PASS** (fixed) | Only `api-gateway` had one. **7 of 8 services had readiness only** — a wedged process would have stayed in the Service ring forever. Added to all, plus `redis` and `elasticsearch`. |
| Readiness probes | **PASS** (improved) | All present. Several pointed at `/health` (liveness semantics); repointed to `/ready`, which actually checks dependencies. |
| Startup probes | **PASS** (fixed) | Added, so slow first-boot (ES indexing, DB migration) no longer trips liveness. |
| Zero-downtime rolling updates (`maxSurge`/`maxUnavailable`) | **PASS** (fixed) | **No Deployment declared a `strategy` block.** Kubernetes' default `maxUnavailable: 25%` on `replicas: 1` = the pod is deleted before its replacement is ready → **guaranteed downtime on every release**. All now `maxSurge: 1, maxUnavailable: 0`. |
| Graceful drain | **PASS** (fixed) | `terminationGracePeriodSeconds: 45` + `preStop: sleep 10` applied uniformly, so in-flight requests finish before SIGTERM. |
| gRPC service-token auth (`shared/go/grpcauth`) | **PASS** | Well implemented: constant-time compare, **fails closed** on an empty token, and propagates OTel trace context across the wire. |
| Retry with exponential backoff **and full jitter** | **PASS** (fixed) | Backoff was exponential but had **no jitter whatsoever** — contradicting the documented design. Every caller would retry in lockstep and re-stampede a recovering dependency. Implemented full jitter (`rand.Int64N`) + two regression tests. |

---

### Domain 3 — Data Integrity & Migration — **WARN**

| Check | Verdict | Evidence |
|---|---|---|
| GCS bucket CORS configuration | **PASS** (fixed) | Was `origin: ["*"]` with all methods including `DELETE`. Now scoped to the frontend origins, `GET`/`HEAD` only. |
| Migration idempotency | **WARN** | **Mixed strategy.** `progress-service` and `gamification-service` correctly use `golang-migrate` with embedded FS and per-service migration tables (idempotent, versioned). `auth-service` and `course-service` use **GORM `AutoMigrate` only — their `migrations/*.sql` files are never executed.** |
| `shared/go/migrator` | **WARN** | `EnsureSchemaFS` is a stub that silently ignores the embedded FS and calls `AutoMigrate`. It is **dead code** (zero references repo-wide) but is a trap for the next developer who trusts its name. |
| Mock data loader | **PASS** | `scripts/mock-data-loader.sh` is re-runnable and idempotent. |

**Risk:** any constraint, partial index, trigger, or partition defined only in `auth-service`/`course-service` SQL files does not exist in production. `AutoMigrate` also never drops or narrows columns, so schema drift accumulates silently. **Left unfixed deliberately** — reconciling these to `golang-migrate` requires verifying the live schema against each file, which needs database access I do not have. Flagged as the top post-deploy item.

---

### Domain 4 — Observability & Telemetry — **WARN**

| Check | Verdict | Evidence |
|---|---|---|
| Prometheus scrape configs | **PASS** (fixed) | All services covered; `upload-service` job added. Validated with `promtool check config` → SUCCESS (9 rules). |
| Grafana dashboard provisioning | **PASS** | Datasources (Prometheus + Tempo) and 3 dashboards provisioned as code. |
| OpenTelemetry tracing (`shared/go/otel`) | **WARN** | Library is correct and trace context propagates across gRPC. **But production sets no `OTEL_EXPORTER_OTLP_ENDPOINT`**, so it silently falls back to the *stdout* exporter. Tempo exists only in the local `monitoring` compose profile. |

**Effect:** distributed tracing works locally and is effectively **absent in production** — spans are printed to pod logs and never assembled into traces. Not a deploy blocker; it is a "you will be debugging blind at 2am" risk. Fixing properly means running a collector in-cluster (added to §7 as a post-deploy item, not a blocker).

**Monitoring stack is opt-in** (`--profile monitoring`) with a deliberate, well-documented reason (a bad host bind-mount used to abort `dev-up`). Good judgment; noted approvingly.

---

### Domain 5 — Cost Optimization & Lifecycle — **PASS**

| Check | Verdict | Evidence |
|---|---|---|
| `make prod-stop` → 0 nodes | **PASS** | `tofu apply -var node_count=0`. Nodes are ~99% of cost; this is the correct lever. |
| `make prod-start` → 2 nodes | **PASS** | Symmetric and idempotent. |
| `make prod-destroy` | **PASS** | Backed by `destroy.sh` + `verify-teardown.sh` — a teardown *audit* is a notably mature touch. |
| Automated idle scale-down | **PASS** | `idle.tf`: Cloud Scheduler → Cloud Run job scales to zero after 2h idle, on free-tier components. Genuinely well designed. |
| Bucket cost controls | **PASS** (added) | Bucket had unbounded growth. Added lifecycle rules: keep 3 versions, purge non-current after 30 days, abort incomplete uploads after 1 day. |

**One caution:** `force_destroy = true` on the uploads bucket means `make prod-destroy` deletes all uploaded course media with no confirmation. Correct for a student project with a teardown workflow; called out so it is a conscious choice.

---

### Domain 6 — Deployment Pipeline & Automation — **PASS** (was FAIL)

| Check | Verdict | Evidence |
|---|---|---|
| `scripts/gcp/deploy.sh` correctness | **PASS** (fixed) | 7 well-ordered, idempotent stages with sensible waits. **Two defects fixed:** (a) the ingress IP was read *before* `tofu apply`, falling back to a hardcoded `34.149.224.124` — on a fresh project this pointed health checks and the data seeder at **an IP the deployer does not own**; now read after apply and fails loudly. (b) it now respects an explicit `STUDED_API_URL` override. |
| CI image publishing | **PASS** (fixed) | `upload-service` was **missing from the publish matrix** and **excluded by `.dockerignore`** → the image referenced by its manifest could never exist. Both fixed; image build verified locally. |
| Cloudflare Pages deployment | **PASS** (fixed) | `wrangler pages deploy` is wired correctly. **But the Pages proxy only forwarded `/graphql` and `/health`** — uploads and image reads from the deployed frontend would have 404'd. Added `/v1/uploads` and `/ai/chat`, with a 120s timeout for streaming/upload paths (the flat 15s abort would have truncated both). |
| GitOps (ArgoCD) | **PASS** | Syncs `infra/k8s/production` recursively with prune + selfHeal. Correct — and precisely why the dev-only upload manifest would never have deployed. |

---

### Domain 7 — Image Upload Service — **PASS** (rebuilt)

The service merged in PR #75 was a functional sketch. Assessed against production criteria:

| Property | Before | After |
|---|---|---|
| Authentication | **None** — anyone could POST | Service token on write; **fails closed** if unset. Gateway enforces educator-only. |
| File type validation | **None** — any bytes accepted | Content **sniffed** from leading bytes; MIME allowlist. Filename is never trusted. |
| Size limit | **None** — `ParseMultipartForm(32MB)` is a buffer hint, not a cap; `io.Copy` unbounded | Enforced streaming cap → `413`, partial object cleaned up. |
| Path traversal | **Vulnerable** — `../../x.png` escaped the upload dir | Structurally impossible: keys are service-generated (`uploads/YYYY/MM/<128-bit random>.<ext>`); disk backend re-validates containment. |
| Returned URL | **Broken** — public GCS URL → **403** on a private bucket | Proxy route that works identically on GCS, emulator, and disk. |
| Emulator support | **Broken** — bare endpoint resolved to `/b/<bucket>`, 404 on every call | Endpoint normalized to `/storage/v1/`; bucket auto-created in emulator mode. |
| Port | Inconsistent (`8090` code / `8092` Dockerfile / `8093` docs) — `8090` also **collided with ai-service** | `8093` everywhere. |
| Health/metrics | `/health` only | `/health` (liveness), `/ready` (verifies bucket reachability), `/metrics`. |
| Tests | 1 tautological test asserting a locally-defined closure | 12 tests covering auth, disguised content, oversize, traversal, uniqueness, delete + 7 gateway authorization tests. |

**Verified end-to-end, not assumed:**
- Upload → download → delete round-trip against `fake-gcs-server` (real GCS JSON API): bytes byte-identical, `204` on delete, `404` after.
- Docker image builds and runs under the **exact production constraints** (`--user 10001 --read-only --cap-drop ALL`); both probes return 200.
- `docker compose up upload-service` reports healthy with a zero-config auto-created bucket.

---

## 3. Identified Risks & Remediation Steps

### Fixed in this audit

| # | Severity | Risk | Remediation |
|---|---|---|---|
| 1 | **BLOCKER** | `tofu validate` fails on an undefined SA reference; deploy dies at step 1/7 | Corrected to a dedicated `studed-upload` GSA; all resource references cross-checked |
| 2 | **BLOCKER** | Kyverno `Enforce` rejects 8 of 11 workloads; zero pods schedule | Full `securityContext` on every workload; verified 0 violations |
| 3 | **BLOCKER** | upload-service unreachable in prod (dev-only manifest, `.dockerignore`, no CI image) | Production manifest + Workload Identity SA; removed from `.dockerignore`; added to CI matrix |
| 4 | **CRITICAL** | Unauthenticated public file upload — anyone could fill the bucket with arbitrary content | Service token (fail-closed) + educator-only gateway authorization |
| 5 | **CRITICAL** | No MIME validation — arbitrary payloads storable and re-servable | Content sniffing + allowlist; `nosniff` + restrictive CSP on download |
| 6 | **HIGH** | Path traversal in local fallback | Service-generated keys + containment check |
| 7 | **HIGH** | Every release caused downtime (`maxUnavailable: 25%` on 1 replica) | `maxSurge: 1, maxUnavailable: 0` + graceful drain |
| 8 | **HIGH** | No liveness probes — a wedged process serves errors forever | Liveness + startup probes across all workloads |
| 9 | **HIGH** | Uploaded images unviewable (403 from private bucket) | Proxy download route, backend-agnostic |
| 10 | **HIGH** | Deploy script targeted a hardcoded IP not owned by the deployer | Read after apply; fail loudly if absent |
| 11 | **MEDIUM** | No jitter → retry stampede on dependency recovery | Full jitter + regression tests |
| 12 | **MEDIUM** | Bucket: `origin:["*"]`, no public-access prevention, node-SA write access, unbounded growth | Hardened; scoped to one identity; lifecycle rules |
| 13 | **MEDIUM** | Frontend could not reach uploads (Pages proxy path list) | Added upload/AI paths + streaming-aware timeouts |
| 14 | **MEDIUM** | 1MB gateway body cap would truncate every image | `/v1/uploads` exempted; service enforces its own cap |
| 15 | **LOW** | `GCS_BUCKET_NAME` created in Secret Manager but never mapped to pods | Mapped via `ExternalSecret`, keeping the project ID out of the ConfigMap |

### Outstanding — deliberately not fixed

| # | Severity | Risk | Recommendation |
|---|---|---|---|
| A | **HIGH** | `auth-service` / `course-service` `.sql` migrations are **never applied**; `AutoMigrate` hides drift | Reconcile to `golang-migrate` (as `progress`/`gamification` already do). **Requires live schema comparison — needs DB access.** Highest-value post-deploy task. |
| B | **MEDIUM** | Every image is `:latest` with `imagePullPolicy: Always` — **no deterministic rollback**; `selfHeal` can silently pull a new build | Deploy by immutable digest or `sha-` tag. CI already produces `type=sha` tags. Kyverno flags this at `Audit`; promote to `Enforce` once tags are pinned. |
| C | **MEDIUM** | No trace collector in production — OTel silently exports to stdout | Run an OTel Collector (or Google Managed Service for Prometheus/Cloud Trace) and set `OTEL_EXPORTER_OTLP_ENDPOINT`. |
| D | **LOW** | `shared/go/migrator.EnsureSchemaFS` is a misleading dead stub | Delete it, or implement it properly. |
| E | **LOW** | `elasticsearch` runs single-node, `xpack.security.enabled=false`, `readOnlyRootFilesystem: false` | Acceptable inside a default-deny namespace reachable only by `course-service`. Documented, not silently ignored. |
| F | **LOW** | `force_destroy = true` destroys all media on teardown | Intentional for this project; confirm before `make prod-destroy`. |

---

## 4. Pre-Flight Verification Checklist

Run in order. **Every step is local or read-only until step 9.**

**Local gates (no GCP needed)**
1. `git pull && git status` — clean tree, on the intended commit.
2. `cd shared/go && go test ./...` — expect all `ok`.
3. `make go-test` — all services green.
4. `make frontend-typecheck && make frontend-test`.
5. `make security-scan` — must print *"Zero hardcoded secrets detected"*.
6. `make promtool-check` — Prometheus config + rules valid.
7. `docker compose up -d upload-service` → `curl localhost:8093/ready` returns `200`; then `docker compose down`.
8. `cd infra/gcp/terraform && tofu init && tofu validate` — **must pass; this is the step that previously failed.**

**GCP preparation (deploying engineer)**
9. `gcloud auth login && gcloud config set project <PROJECT_ID>`.
10. `gcloud services enable compute container secretmanager iamcredentials artifactregistry cloudresourcemanager monitoring logging run cloudscheduler storage --project <PROJECT_ID>` (Terraform also enables these; doing it first avoids first-apply races).
11. Create `infra/gcp/terraform/terraform.tfvars` from the example. **Set `authorized_cidrs` to your own `curl ifconfig.me`/32** — otherwise you lock yourself out of the control plane.
12. **If `project_id` is not `studed-prod`**, update two hardcoded references:
    - `infra/k8s/production/services/upload-service.yaml` → the `iam.gke.io/gcp-service-account` annotation
    - `infra/k8s/production/external-secrets.yaml` → `projectID`
13. Create the repo-root `.env` with at minimum `DATABASE_CONNECTION_STRING` (Neon, `sslmode=require`). `SERVICE_TOKEN` and JWT secrets are generated if absent.
14. `cd infra/gcp/terraform && tofu plan` — **review the plan; expect ~0 destroys on a fresh project.**

**Deploy**
15. `make prod-deploy`.
16. Confirm CI has published `ghcr.io/<owner>/studed-upload-service:latest` **before** ArgoCD syncs, or the pod will `ImagePullBackOff`. Ensure the GHCR packages are public (or add an `imagePullSecret`).

**Post-deploy verification**
17. `kubectl -n studed get pods` — all `Running`, **including `upload-service`**.
18. `kubectl -n studed describe pod -l app=upload-service | grep -A3 Events` — no Kyverno admission denials.
19. `curl https://api.<IP>.sslip.io/health` → `200`.
20. **Upload smoke test** (the path most likely to fail first in the real project):
    ```
    curl -X POST https://api.<IP>.sslip.io/v1/uploads \
      -H "Authorization: Bearer <educator-JWT>" -F "file=@test.png"
    ```
    Then `GET` the returned `url` and confirm the bytes come back. A `503` here means Workload Identity is not bound — recheck step 12.
21. Set `API_ORIGIN` in the Cloudflare Pages project settings to `https://api.<IP>.sslip.io`, then redeploy Pages.
22. `make prod-stop` once verified, to stop node charges.

---

## 5. Final Deployment Approval Verdict

> ### ✅ **APPROVED FOR DEPLOYMENT — WITH CONDITIONS**

The three hard blockers that made this repository undeployable are fixed and verified. The upload service is genuinely production-grade rather than a stub, and its GCS integration has been **exercised against a real GCS API implementation** rather than reasoned about. Local dev, emulator, and production all run the same code path, which is what makes the GCP hand-off low-risk.

**Conditions of approval:**
1. Complete pre-flight steps 1–14 — **step 8 (`tofu validate`) is non-negotiable**, as it is the exact gate that previously failed.
2. Update the two hardcoded `studed-prod` references if the project ID differs (step 12).
3. Confirm the `upload-service` image is published before ArgoCD syncs (step 16).
4. Treat risk **A** (unapplied migrations) as the first post-deploy work item, and **B** (`:latest` tags) before any second release — without pinned tags there is no rollback path.

**What I could not verify:** anything requiring the live GCP project — actual Workload Identity token exchange, Cloud Armor rule evaluation, managed certificate issuance, and real GCS IAM. These are covered by steps 17–21. Kyverno's own CLI was not installed, so policy compliance was verified by asserting each enforced rule against every rendered workload rather than by running the admission engine; installing `kyverno` and running `make k8s-policy-test` would close that loop.

**Bottom line:** the architecture was always sound; the execution had gaps that would have produced a confusing multi-stage failure on the deployer's first attempt. Those gaps are now closed, and the deployment path is a documented, verifiable sequence.
