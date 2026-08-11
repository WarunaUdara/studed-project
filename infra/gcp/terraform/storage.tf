# Google Cloud Storage Bucket for StudEd Upload Service
resource "google_storage_bucket" "studed_uploads" {
  name                        = "studed-uploads-${local.project_id}"
  location                    = var.region
  force_destroy               = true
  uniform_bucket_level_access = true

  cors {
    origin          = ["*"]
    method          = ["GET", "POST", "PUT", "HEAD", "DELETE"]
    response_header = ["*"]
    max_age_seconds = 3600
  }
}

# Grant Workload Identity SA access to reading and writing objects in the bucket
resource "google_storage_bucket_iam_binding" "uploads_object_admin" {
  bucket = google_storage_bucket.studed_uploads.name
  role   = "roles/storage.objectAdmin"

  members = [
    "serviceAccount:${google_service_account.external_secrets_sa.email}",
    "serviceAccount:${google_service_account.gke_nodes.email}",
  ]
}
