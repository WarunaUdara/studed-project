# Least-privilege service accounts. No SA keys are ever downloaded;
# GKE nodes use the attached SA and workloads use Workload Identity.

# Node pool SA: only what a GKE node needs.
resource "google_service_account" "gke_node_sa" {
  account_id   = local.gke_gsa
  display_name = "StudEd GKE node service account"
}

resource "google_project_iam_member" "gke_node_roles" {
  for_each = toset([
    "roles/storage.objectViewer",        # pull GKE system images from gcr.io
    "roles/artifactregistry.reader",     # pull images from Artifact Registry if used
    "roles/logging.logWriter",           # node + container logs
    "roles/monitoring.metricWriter",     # pod/cadvisor metrics
    "roles/monitoring.viewer",           # read back metrics
  ])
  project = local.project_id
  role    = each.value
  member  = "serviceAccount:${google_service_account.gke_node_sa.email}"
}

# Workload Identity SA: used by external-secrets to read Secret Manager.
resource "google_service_account" "external_secrets_sa" {
  account_id   = local.es_gsa
  display_name = "StudEd external-secrets (Workload Identity)"
}

resource "google_project_iam_member" "es_role" {
  project = local.project_id
  role    = "roles/secretmanager.secretAccessor"
  member  = "serviceAccount:${google_service_account.external_secrets_sa.email}"
}

# Allow the Kubernetes ServiceAccounts to impersonate their GSAs.
# external-secrets runs in its own namespace; the prefix is the namespace.
resource "google_service_account_iam_binding" "es_wi_binding" {
  service_account_id = google_service_account.external_secrets_sa.name
  role               = "roles/iam.workloadIdentityUser"
  members = [
    "serviceAccount:${local.project_id}.svc.id.goog[external-secrets/external-secrets]",
  ]
}
