# Deployment Journey & Decision Log

Everything decided and fixed while taking StudEd from local dev to a live
production deployment. Read this before re-deploying or changing the infra.

## Goal

Run the StudEd platform (React SPA + 8 Go microservices) as a real deployment:
backend on GCP with a clean architecture, frontend on Cloudflare, Postgres on
Neon - all within the $300 GCP free-trial budget, secure by default, and fully
tear-down-able in one command.

## Decisions made

### Cloud / hosting
- **GKE Standard (zonal, `us-central1-a`)** over Autopilot/Cloud Run: keeps a
  real Kubernetes story for the resume (nodes, Workload Identity, GitOps,
  ingress) while the control plane is **free** on Standard.
- **2x `e2-standard-2` nodes**: `e2-medium` is a shared-core VM - GKE reserves
  ~53% CPU, leaving ~940m CPU allocatable, not enough for 10 workloads.
- **Private nodes + Cloud NAT**: nodes have no public IPs; all egress via NAT.
- **Public control-plane endpoint locked to `authorized_cidrs`** (only the
  admin IP). Simple and cost-free vs. a VPN/private endpoint.
- **Neon Postgres (costless)** instead of Cloud SQL: $0, scale-to-zero, and the
  services' golang-migrate migrations run on startup.
- **Cloudflare Pages** for the frontend with a **Pages Function** proxying
  `/graphql` to the backend (cookie-safe, same-origin from the browser).
- **sslip.io free wildcard** for the backend domain: `api.34.149.224.124.sslip.io`
  with a Google-managed certificate.
- **GHCR + GitHub Actions** (public repo = free) for image builds; no Artifact
  Registry needed.
- **Cloud Armor** for the WAF: OWASP CRS + per-IP rate limit.

### Security
- **Workload Identity everywhere, zero SA keys**: node SA for node bootstrap,
  `studed-external-secrets` GSA for external-secrets (per-secret
  `secretAccessor`), idle-scout GSA with a custom role limited to
  `container.clusters.update`.
- **Secrets in Secret Manager**, versions pushed via `gcloud` from local `.env`
  (never committed). external-secrets syncs them into pods as env vars.
- **Shielded VMs** (secure boot + integrity monitoring) on all nodes.
- HttpOnly auth cookies (`access_token` 15m / `refresh_token` 7d), SameSite=Lax,
  passed through the Pages proxy untouched.

### GitOps & CI/CD
- **ArgoCD** syncs `infra/k8s/production` from git (auto-sync, prune,
  self-heal). No manual `kubectl apply` in prod.
- **CI** builds all 8 images to GHCR on push/tag/service changes.
- **Git workflow**: development happens on a `dev` branch and merges to `main`
  via `gh` CLI. Pushing to `main` triggers a Cloudflare Pages rebuild, so we
  batch changes and merge intentionally (see Git Workflow below).

### Cost control
- **Idle-scout**: Cloud Scheduler (hourly) -> Cloud Run job -> if the LB saw no
  traffic for 2h, scale the node pool to **0**. Wake with `make prod-start`.
- **Manual standby / teardown**: `make prod-stop|start|destroy` and a
  `make prod-teardown-audit` that lists any remaining billable GCP resource.

## Gotchas fixed along the way

| Symptom | Root cause | Fix |
| :--- | :--- | :--- |
| external-secrets `identitybindingtoken` 404 | ClusterSecretStore used regional `clusterLocation` (`us-central1`) | Use the exact zonal `us-central1-a` (CRD also requires `serviceAccountRef`) |
| `DATABASE_URL` broke Go URL parsing | trailing `\n` in the `.env` value, doubled by a here-string | `printf '%s' "$value" \| gcloud ... --data-file=-` |
| gamification-service `Dirty database version 1` | failed migration left a dirty row, tables missing | `DELETE FROM gamification_schema_migrations;` (SQL is idempotent) |
| Elasticsearch `OOMKilled` | 512Mi limit too low for ES 8 | 1Gi limit |
| ES readiness probe failing | image has no `wget` | use `curl` |
| ES node.lock conflict during rollout | stale pod held the lock | scale down old ReplicaSet before restart |
| GraphQL `403` behind the LB | Cloud Armor SQLi rule false-positive on `/graphql` | priority-999 allow rule; use `request.path.contains()`, not `.matches()` |
| ArgoCD app `Unknown`/failing generation | repo-server ran `git submodule update`; nested gitlink in `submodules/math-to-manim` broke it | `reposerver.enable.git.submodule: false` in `argocd-cmd-params-cm` |
| Pods stuck `Pending` | `max_pods_per_node=32` cap with many workloads | 2 nodes instead of 1 |
| `wrangler login` refused | `CLOUDFLARE_API_TOKEN` (Pages-scoped) set in the shell | use `wrangler pages deploy` with the token (Pages Functions path) |
| Pages `_redirects` "infinite loop" warning | wrangler dev lint on `/* /index.html 200` | benign; production Pages applies the SPA rule correctly |
| idle-scout job exit 127 | `jq` not present in the cloud-sdk image | parse metric JSON with python3 |
| Demo login failed | mock data never inserted into Neon | run `scripts/mock-data-loader.sh` with `STUDED_API_URL` pointing at the live gateway; grants the student a STANDARD subscription |

## Git workflow (dev branch -> gh merge)

Every push to `main` re-renders/re-deploys Cloudflare Pages (the Pages project
builds from the repo). To avoid exhausting free build minutes, batch changes:

```bash
git checkout dev            # default working branch
# ... make changes, run tests ...
git add <files>
git commit -m "type(scope): description"
git push origin dev

# When a batch is ready, merge to main via gh:
gh pr create --base main --head dev --title "..." --body "..."
gh pr merge --squash --delete-branch
```

Only push to `main` when a release is actually intended. ArgoCD then syncs the
new `infra/k8s/production` automatically.

## Live endpoints & credentials

- Backend GraphQL: `https://api.34.149.224.124.sslip.io/graphql`
- Backend health: `https://api.34.149.224.124.sslip.io/health`
- Frontend: `https://studed-project-frontend.pages.dev`
- Educator: `demo.educator@studed.lk` / `password1234`
- Student: `demo.student@studed.lk` / `password1234`
- ArgoCD: `kubectl -n argocd port-forward svc/argocd-server 8080:443`
  password: `kubectl -n argocd get secret argocd-initial-admin-secret -o jsonpath="{.data.password}" | base64 -d`

## Maintenance rules

1. Change prod manifests only via `infra/k8s/production` -> ArgoCD.
2. Change infra only via `infra/gcp/terraform` -> OpenTofu (`make prod-*`).
3. Re-run `make prod-deploy` whenever you need to re-provision or refresh.
4. After any scaling change by the idle-scout, `make prod-start` reconciles
   Terraform state automatically.
5. Never commit `terraform.tfvars`, `.env`, or Secret Manager values.
