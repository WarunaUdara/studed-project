# Google Cloud Storage bucket backing the upload-service (course images and
# lesson attachments). Private, uniform bucket-level access, versioning, and
# lifecycle reclaim. The upload-service GSA (created here) is the only writer.

resource "google_storage_bucket" "studed_uploads" {
  # Name matches the default value populate-secrets.sh writes to
  # studed-gcs-bucket-name, so no .env change is needed.
  name          = "studed-uploads-${local.project_id}"
  location      = var.region
  force_destroy = true

  uniform_bucket_level_access = true
  public_access_prevention    = "enforced"

  versioning {
    enabled = true
  }

  lifecycle_rule {
    condition {
      num_newer_versions = 3
    }
    action {
      type = "Delete"
    }
  }

  lifecycle_rule {
    condition {
      days_since_noncurrent_time = 30
    }
    action {
      type = "Delete"
    }
  }

  lifecycle_rule {
    condition {
      age = 1
    }
    action {
      type = "AbortIncompleteMultipartUpload"
    }
  }

  cors {
    origin          = var.uploads_cors_origins
    method          = ["GET", "HEAD"]
    response_header = ["Content-Type", "Content-Length", "Cache-Control"]
    max_age_seconds = 3600
  }

  depends_on = [google_project_service.apis]
}

# Dedicated least-privilege identity for upload-service. Account ID matches
# what infra/k8s/production/services/upload-service.yaml annotates.
resource "google_service_account" "upload_sa" {
  account_id   = local.upload_gsa
  display_name = "StudEd upload-service (Workload Identity)"
}

resource "google_storage_bucket_iam_member" "upload_object_admin" {
  bucket = google_storage_bucket.studed_uploads.name
  role   = "roles/storage.objectAdmin"
  member = "serviceAccount:${google_service_account.upload_sa.email}"
}

resource "google_service_account_iam_binding" "upload_wi_binding" {
  service_account_id = google_service_account.upload_sa.name
  role               = "roles/iam.workloadIdentityUser"
  members = [
    "serviceAccount:${local.project_id}.svc.id.goog[studed/upload-service-sa]",
  ]
}
