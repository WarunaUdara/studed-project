locals {
  project_id = var.project_id
  gke_gsa   = "studed-gke-node"
  es_gsa    = "studed-external-secrets"
}

resource "google_project_service" "apis" {
  for_each = toset([
    "compute.googleapis.com",
    "container.googleapis.com",
    "secretmanager.googleapis.com",
    "iamcredentials.googleapis.com",
    "artifactregistry.googleapis.com",
    "cloudresourcemanager.googleapis.com",
    "monitoring.googleapis.com",
    "logging.googleapis.com",
  ])
  project            = local.project_id
  service            = each.value
  disable_on_destroy = false
}
