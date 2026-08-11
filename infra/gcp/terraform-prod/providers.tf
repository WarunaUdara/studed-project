provider "google" {
  project = var.project_id
  region  = var.region

  storage_custom_endpoint        = var.use_floci_gcp ? var.floci_gcp_endpoint : null
  secret_manager_custom_endpoint = var.use_floci_gcp ? var.floci_gcp_endpoint : null
  pubsub_custom_endpoint         = var.use_floci_gcp ? var.floci_gcp_endpoint : null
  container_custom_endpoint      = var.use_floci_gcp ? var.floci_gcp_endpoint : null
}

provider "google-beta" {
  project = var.project_id
  region  = var.region

  storage_custom_endpoint        = var.use_floci_gcp ? var.floci_gcp_endpoint : null
  secret_manager_custom_endpoint = var.use_floci_gcp ? var.floci_gcp_endpoint : null
  pubsub_custom_endpoint         = var.use_floci_gcp ? var.floci_gcp_endpoint : null
  container_custom_endpoint      = var.use_floci_gcp ? var.floci_gcp_endpoint : null
}
