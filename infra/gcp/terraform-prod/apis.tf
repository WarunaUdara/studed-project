locals {
  project_id = var.project_id
  # The stack is fully self-contained: it recreates the exact GSA account IDs
  # and Secret Manager names that the k8s manifests and argocd-install.sh
  # reference (studed-external-secrets, studed-upload, studed-* secrets). The
  # old deployment was cleaned up, so these project-wide names are free again.
  gke_gsa    = "studed2-gke-node"
  es_gsa     = "studed-external-secrets"
  upload_gsa = "studed-upload"
  idle_gsa   = "studed2-idle-scout"
}

resource "google_project_service" "apis" {
  for_each = toset([
    "compute.googleapis.com",
    "container.googleapis.com",
    "secretmanager.googleapis.com",
    "storage.googleapis.com", # GCS bucket backing upload-service
    "iamcredentials.googleapis.com",
    "artifactregistry.googleapis.com",
    "cloudresourcemanager.googleapis.com",
    "monitoring.googleapis.com",
    "logging.googleapis.com",
    "run.googleapis.com",
    "cloudscheduler.googleapis.com",
  ])
  project            = local.project_id
  service            = each.value
  disable_on_destroy = false
}
