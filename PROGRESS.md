# StudEd Deployment — Progress Board (FINAL)

## Status: LIVE

| Area | State |
| :--- | :--- |
| GKE cluster `studed-prod` (asia-south1-a, 2-3 nodes) | Running |
| Prod backend — 15/15 pods (9 services + redis/es/tempo/gateway) | Healthy |
| Pre-prod backend — 11/11 pods (`studed-preprod` namespace) | Healthy |
| TLS | Let's Encrypt cert bound to the shared LB (until Nov 20, 2026 — renew via the acme-challenge deployment) |
| Frontend (prod) `studed-project-frontend.pages.dev` | Live, proxy wired, login tested |
| Frontend (preview) `studed-project-preview.pages.dev` | Live, currently points at the PROD API |
| Demo data | Seeded (educator + student, 17 courses, lessons, waves) |
| Security | Secret scan PASSED, no secrets in git, Workload Identity, WAF, restricted PSS, gitignored .env |
| GitOps | ArgoCD syncing both environments from `main`, selfHeal on |

## Links
- Frontend: https://studed-project-frontend.pages.dev
- Preview frontend: https://studed-project-preview.pages.dev
- Backend API: https://api.34.102.169.180.sslip.io/graphql
- Demo accounts: `demo.educator@studed.lk` / `demo.student@studed.lk` / `password1234`

## Known follow-ups (non-blocking)
- [ ] `api-preprod.34.102.169.180.sslip.io` host routing + its certificate (pre-prod pods are live; the preview project falls back to the prod API meanwhile)
- [ ] Let's Encrypt renewal automation (certbot deployment kept in-cluster; ~90 days)
- [ ] GitHub Actions Pages deploy needs `CLOUDFLARE_API_TOKEN` + `CLOUDFLARE_ACCOUNT_ID` repo secrets (until then: wrangler deploys work)
- [ ] Optional real keys: `GEMINI_API_KEY`, `PAYHERE_*`

## Why it took long (compressed)
GKE provisioning ~25 min (GCP wait) + project restore (~10 min) + IPv6 workaround (~10 min) +
repo/latent bugs found live: missing secret, IAM role tombstone, Neon ownership migrations,
image pin drift, kustomize/ArgoCD conflict (~60 min total, each needed a fix + CI rebuild) +
Google managed cert never validated (no port-80 path, 2.5 h) replaced by Let's Encrypt +
Let's Encrypt rate-limit wait (15 min) + pre-prod LB merge + catalog latency work.
The stack itself runs; the waits were GCP + certificate + CICD mechanics, not application code.