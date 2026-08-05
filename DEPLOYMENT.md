# StudEd Production Deployment

Deployment guide for the StudEd platform: GKE backend (GCP) + Cloudflare Workers frontend + Neon Postgres.

## Live endpoints

| Component | URL |
| :--- | :--- |
| Backend GraphQL API | `https://api.34.149.224.124.sslip.io/graphql` |
| Backend health | `https://api.34.149.224.124.sslip.io/health` |
| Frontend | `https://studed-project-frontend.pages.dev` |
| ArgoCD (port-forward) | `http://localhost:8080` |

## Architecture summary

- **GKE Standard** zonal cluster `studed-backend` (us-central1-a), 2x `e2-standard-2` private nodes, Workload Identity (no service-account keys).
- **10 workloads** in namespace `studed`: 8 Go microservices (api-gateway, auth, course, progress, gamification, ai, notification, payment) + Redis + Elasticsearch, images from `ghcr.io/warunaudara/studed-*`.
- **Secrets**: Secret Manager (`studed-database-url`, `studed-jwt-access-secret`, `studed-jwt-refresh-secret`) synced in-cluster by external-secrets via Workload Identity.
- **Ingress**: L7 GCE ingress on static IP `34.149.224.124`, Google-managed TLS cert, Cloud Armor WAF (OWASP CRS + rate limit; `/graphql` allow-listed).
- **GitOps**: ArgoCD syncs `infra/k8s/production` from `main` (auto-sync, prune, self-heal).
- **CI**: `.github/workflows/ci.yml` builds all 8 images to GHCR on tag / workflow_dispatch / service path changes.
- **DB**: Neon Postgres (costless tier), migrated by each service on startup.

## Access commands

```bash
# Kubernetes
gcloud container clusters get-credentials studed-backend \
  --zone us-central1-a --project studed-prod

# ArgoCD UI
kubectl -n argocd port-forward svc/argocd-server 8080:443
# Admin password
kubectl -n argocd get secret argocd-initial-admin-secret \
  -o jsonpath="{.data.password}" | base64 -d
# (login: admin / <password>)

# Tail logs for a service
kubectl -n studed logs -f deploy/api-gateway
```

## Frontend deploy

The frontend is a React SPA on Cloudflare Pages. A Pages Function
(`functions/graphql.ts`) proxies `/graphql` to the backend, and a `_redirects`
rule (`/* /index.html 200`) provides SPA fallback for client-side routing.

```bash
# one-time auth (requires a Pages-scoped API token in CLOUDFLARE_API_TOKEN)
bunx wrangler login   # or export CLOUDFLARE_API_TOKEN=<pages-only token>

bun run build                 # tsr generate + tsc + vite build
bunx wrangler pages deploy frontend/dist --project-name studed-project-frontend
```

The proxy forwards cookies both ways (HttpOnly `access_token` / `refresh_token`
set by the gateway pass through unchanged), so the SPA authenticates exactly as
in dev.

## Costs (GCP free trial, USD / mo, approx)

| Resource | Config | Cost |
| :--- | :--- | :--- |
| GKE nodes | 2x `e2-standard-2` (~40h total demo) | ~$0.10/h both, ~$4 for a weekend |
| Static IP | 1x global | $0 (free tier if IP unused); ingress uses it, ~$0.01/h if not deleted |
| Cloud Armor | 1 policy | $5/mo if kept longer term |
| Secret Manager | 3 secrets, low access | free tier |
| Cloud NAT | small | ~$0.5/mo if kept |
| Neon Postgres | costless tier | $0 |
| Cloudflare Workers | free plan | $0 |

> To stay free: run the demo a few hours, then teardown (below). The free trial
> ($300 credit) also absorbs the GKE hours.

## Teardown (stop ALL billing)

```bash
# 1. Delete GCP infra (cluster, IP, NAT, WAF, secrets) - most cost is here
cd infra/gcp/terraform && tofu destroy -auto-approve

# 2. Delete the project entirely (cleanest - kills every GCP resource)
gcloud projects delete studed-prod --quiet

# 3. (Optional) delete the Cloudflare Pages project
bunx wrangler pages project delete studed-project-frontend
```

Steps 1-2 stop every GCP charge immediately. The Cloudflare free plan and Neon
costless tier cost nothing to leave running, but delete them if you want a
fully clean slate.

## Notes / watch-outs

- Backend cookies are `Secure: false` (set over HTTPS anyway). Works because the
  browser only talks to the frontend origin; the proxy is same-origin.
- `terraform.tfvars` is gitignored; re-create from `terraform.tfvars.example`.
- State is local (`terraform.tfstate`, gitignored). For a long-lived env migrate
  to a GCS bucket backend.
