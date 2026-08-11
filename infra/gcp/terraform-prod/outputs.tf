locals {
  ingress_ip    = google_compute_global_address.studed2_ingress_ip.address
  api_hostname  = "${var.sslip_api_hostname}.${local.ingress_ip}.sslip.io"
  api_url       = "https://${local.api_hostname}"
  workflow_pool = "${local.project_id}.svc.id.goog"
}

output "gke_cluster_name" {
  description = "GKE cluster name (use gcloud container clusters get-credentials)"
  value       = google_container_cluster.studed.name
}

output "gke_cluster_zone" {
  value = google_container_cluster.studed.location
}

output "gke_workload_identity_pool" {
  description = "Workload Identity pool"
  value       = local.workflow_pool
}

output "ingress_static_ip" {
  description = "Public static IP for the API ingress"
  value       = local.ingress_ip
}

output "api_hostname" {
  description = "Public HTTPS hostname for the backend API"
  value       = local.api_hostname
}

output "api_url" {
  description = "Full API URL (VITE_API_URL / Cloudflare Worker API_ORIGIN)"
  value       = local.api_url
}

output "gke_node_sa" {
  description = "GSA attached to GKE nodes (least privilege)"
  value       = google_service_account.gke_node_sa.email
}

output "uploads_bucket" {
  description = "GCS bucket backing upload-service (GCS_BUCKET_NAME)"
  value       = google_storage_bucket.studed_uploads.name
}
