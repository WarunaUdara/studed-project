# StudEd Production Deployment

Deployment, cost control, and teardown for the live StudEd platform
(GKE backend + Cloudflare Pages frontend + Neon Postgres).

Deep dives: [ARCHITECTURE.md](docs/ARCHITECTURE.md) (component diagram),
[GCP-ARCHITECTURE-SPEC.md](docs/GCP-ARCHITECTURE-SPEC.md) (GCP icon mapping & tech spec),
[CICD-PIPELINE.md](docs/CICD-PIPELINE.md) (DevOps CI/CD & GitOps architecture),
[COSTS.md](docs/COSTS.md) (billing risk analysis), [DECISIONS.md](docs/DECISIONS.md)
(journey + gotchas + git workflow).

## Live endpoints

| Component | URL |
| :--- | :--- |
| Backend GraphQL API | `https://api.<static-ip>.sslip.io/graphql` |
| Backend health | `https://api.<static-ip>.sslip.io/health` |
| Frontend | `https://studed-project-frontend.pages.dev` |
| ArgoCD (port-forward) | `http://localhost:8080` |

## One-command lifecycle

Everything is driven from the repo root Makefile. Each command is idempotent.

| Command | What it does | Resulting cost |
| :--- | :--- | :--- |
| `make prod-deploy` | Full deploy: OpenTofu apply -> pin ingress host -> secrets -> ArgoCD -> wait healthy -> ingress/cert -> Pages -> demo seed | running (~$0.13/h) |
| `make prod-status` | Snapshot: nodes, pods, ArgoCD, frontend, idle-scout, static IP | - |
| `make prod-stop` | Standby: node pool -> 0 (Terraform keeps state consistent) | ~$23/mo (LB + WAF only) |
| `make prod-start` | Wake: node pool -> 2 | running |
| `make prod-seed` | Re-run the demo data loader against the live backend | - |
| `make prod-destroy` | `tofu destroy` + delete Cloudflare Pages project | $0 |
| `make prod-destroy DESTROY_FLAGS=--delete-project` | Above + `gcloud projects delete studed-prod` (nuclear) | $0 |
| `make prod-teardown-audit` | Lists any remaining billable GCP resources | - |
| `./scripts/gcp/cost-scout.sh` | Hierarchical per-project billing/resource inventory with alerts (`-w` watch, `-s` strict, `-p proj1,proj2`) | - |

### Auto scale-down (cost cutter)

Cloud Scheduler runs the `studed2-idle-scout` Cloud Run job **hourly**. If the
load balancer saw no traffic for **2 hours**, it scales the node pool to **0**
(stops the ~$75/mo node charge). Wake it up with `make prod-start`. See
[COSTS.md](docs/COSTS.md) for the residual LB/WAF charges during standby.

## Prerequisites (one-time)

```bash
# Tools
brew install tofu google-cloud-sdk kubernetes-cli helm   # jq, bun already present

# GCP auth + project bootstrap (first run only)
gcloud auth login
gcloud projects create studed-prod
gcloud billing projects link studed-prod --billing-account=<BILLING_ID>
gcloud config set project studed-prod

# Local files
#   - the isolated stack lives in infra/gcp/terraform-prod/ (own state, studed2-* names,
#     region asia-south1, zone asia-south1-a, cluster studed-prod). Its
#     terraform.tfvars is TRACKED (no secrets); edit it to set authorized_cidrs
#     to your current public IP (curl ifconfig.me).
#   - the old infra/gcp/terraform/ root is the abandoned us-central1 stack.

# Secrets source (gitignored) - must contain DATABASE_CONNECTION_STRING
#   1. create the .env file and add DATABASE_CONNECTION_STRING from Neon
#   2. optionally GEMINI_API_KEY / PAYHERE_* when real keys exist
echo 'DATABASE_CONNECTION_STRING="postgresql://..."' > .env
```

## Deploy

```bash
make prod-deploy
```

The script prints the backend URL, frontend URL and demo credentials when done.

If `CLOUDFLARE_API_TOKEN` (Pages-scoped token) is not exported, the frontend
step is skipped with the exact `wrangler pages deploy` command to run manually.
The recommended path is CI/CD (below) instead of local wrangler uploads.

### Connect the frontend via the Cloudflare console (CI/CD)

1. In the Cloudflare dashboard: **Workers & Pages -> Create -> Pages -> Connect
   to Git** -> choose the `WarunaUdara/studed-project` repo -> framework preset
   "None" (build happens in CI). The Pages project must be named
   **`studed-project-frontend`**.
2. In the Pages project **Settings -> Environment variables** (Production) set:
   - `API_ORIGIN = https://api.<static-ip>.sslip.io` (read by
     `frontend/functions/_middleware.ts`, which proxies `/graphql`, `/health`,
     `/v1/uploads`, `/ai/chat` to the backend).
3. In GitHub repo **Settings -> Secrets and variables -> Actions** add:
   - `CLOUDFLARE_API_TOKEN` (token created in My Profile -> API Tokens with
     `Cloudflare Pages: Edit` permission).
   - `CLOUDFLARE_ACCOUNT_ID` (shown on the right side of the Cloudflare
     dashboard / Workers overview).
4. Push to `main` (or run `workflow_dispatch`): the GitHub Action
   (`.github/workflows/frontend-deploy.yml`) runs `bun run build` then
   `cloudflare/pages-action` -> project `studed-project-frontend`.
5. Verify: `https://studed-project-frontend.pages.dev/graphql` returns the
   backend GraphQL playground/response.

Deploying the frontend again by hand (token present, local only):

```bash
bun run build
bunx wrangler pages deploy frontend/dist --project-name studed-project-frontend
```

## Access

```bash
# Kubernetes
gcloud container clusters get-credentials studed-prod \
  --zone asia-south1-a --project studed-prod

# ArgoCD UI + admin password
kubectl -n argocd port-forward svc/argocd-server 8080:443
kubectl -n argocd get secret argocd-initial-admin-secret \
  -o jsonpath="{.data.password}" | base64 -d

# Logs
kubectl -n studed logs -f deploy/api-gateway
```

## Demo data

```bash
make prod-seed    # idempotent: registers/logs in demo accounts, creates
                  # courses/lessons/waves, grants the student a STANDARD
                  # subscription, enrolls, completes one wave for XP
```

Accounts: `demo.educator@studed.lk` / `password1234` and
`demo.student@studed.lk` / `password1234`.

## Teardown (stop ALL billing)

```bash
make prod-destroy                      # GCP + Cloudflare Pages
make prod-destroy DESTROY_FLAGS=--delete-project   # also deletes the GCP project
make prod-teardown-audit               # confirm nothing is left billing
```

Neon (costless) and the Cloudflare free plan cost nothing to leave running; the
audit focuses on GCP. Full cost analysis: [COSTS.md](docs/COSTS.md).

## Architecture & security

Full component diagram and security posture: [ARCHITECTURE.md](docs/ARCHITECTURE.md).
Highlights: GKE Standard private nodes, Workload Identity (zero SA keys),
Secret Manager + external-secrets, Cloud Armor WAF, managed TLS cert, ArgoCD
GitOps, GHCR CI, and the hourly idle-scout.

## Notes / watch-outs

- **Git workflow**: commit to the `dev` branch and merge via `gh pr` - every
  push to `main` re-builds Cloudflare Pages and can exhaust free build minutes.
  See [DECISIONS.md](docs/DECISIONS.md).
- Backend cookies are `Secure: false` but work over HTTPS; the proxy keeps the
  browser same-origin, so SameSite=Lax auth works.
- `terraform-prod/terraform.tfvars` is tracked (region/zone/cluster + master
  CIDRs only, no secrets); `terraform-prod/terraform.tfstate` is gitignored
  (local state). The abandoned `infra/gcp/terraform/` root keeps its own
  gitignored tfvars/state.
- The ingress host is `api.PLACEHOLDER.sslip.io` in git; `make prod-deploy`
  calls `scripts/gcp/set-ingress-host.sh` to replace it with the real static IP
  and push BEFORE ArgoCD's first sync (ArgoCD selfHeal would otherwise keep
  rebuilding for the bogus host).
- ArgoCD syncs from `main`; a merge triggers a roll-out automatically.
- After the idle-scout scales down, `make prod-start` reconciles Terraform
  state (see COSTS.md bill-raiser #2).
