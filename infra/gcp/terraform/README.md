# StudEd GCP Backend Infrastructure (OpenTofu)

Infrastructure-as-Code for the StudEd backend on Google Cloud, built to the
[Well-Architected Framework](https://cloud.google.com/architecture/framework)
security + operational excellence pillars.

## What it provisions

| Resource | Purpose | Least-privilege notes |
| :--- | :--- | :--- |
| `google_project_service` | Required APIs | only the 8 APIs actually used |
| `google_compute_network/subnetwork` | Custom VPC (VPC-native) | no default network; secondary ranges for GKE alias IPs |
| `google_compute_router_nat` | Cloud NAT | private GKE nodes egress only |
| `google_compute_global_address` | Static IP for L7 ingress | |
| `google_service_account` `studed-gke-node` | GKE node identity | storage.objectViewer + artifactregistry.reader + logging/monitoring writer/viewer only |
| `google_service_account` `studed-external-secrets` | external-secrets identity | roles/secretmanager.secretAccessor scoped per-secret |
| `google_container_cluster` | GKE Standard zonal cluster | private nodes, public endpoint locked to `authorized_cidrs`, Workload Identity, Shielded VMs |
| `google_container_node_pool` | 2x `e2-standard-2` nodes | auto-repair/upgrade, secure boot, vTPM, integrity monitoring |
| `google_secret_manager_secret` | Runtime secrets | versions populated via `gcloud` (never in git) |
| `google_compute_security_policy` `studed-waf` | Cloud Armor WAF | OWASP SQLi/XSS/LFI/protocol-attack rules + per-IP rate limit |

## Workflow

```bash
# 1. Bootstrap the project once (outside IaC - needs billing account consent)
gcloud projects create studed-prod --name="StudEd Production"
gcloud billing projects link studed-prod --billing-account=<BILLING_ID>
gcloud config set project studed-prod
gcloud auth application-default set-quota-project studed-prod

# 2. Enable APIs + apply
gcloud services enable container.googleapis.com compute.googleapis.com \
  secretmanager.googleapis.com iamcredentials.googleapis.com \
  cloudresourcemanager.googleapis.com serviceusage.googleapis.com

cd infra/gcp/terraform
cp terraform.tfvars.example terraform.tfvars   # fill in your public IP
tofu init
tofu plan
tofu apply

# 3. Populate secrets (NOT in git)
gcloud secrets versions add studed-database-url --data-file=<(echo "$DATABASE_CONNECTION_STRING")
# ... see scripts/populate-secrets.sh for all secrets

# 4. Connect + deploy
gcloud container clusters get-credentials studed-backend --zone us-central1-a --project studed-prod
```

## Teardown (stop all billing)

```bash
cd infra/gcp/terraform
tofu destroy -auto-approve
# optionally delete the project entirely
gcloud projects delete studed-prod --quiet
```

State is stored locally (`terraform.tfstate`, gitignored). For a longer-lived
environment migrate to a GCS bucket backend + Workload Identity Federation for
CI.
