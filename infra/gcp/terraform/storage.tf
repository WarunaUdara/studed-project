# Google Cloud Storage bucket backing the upload-service (course images and
# lesson attachments).
#
# The bucket is PRIVATE: uniform bucket-level access plus public access
# prevention. Nothing is served straight from storage.googleapis.com; reads go
# through upload-service's /v1/uploads/files/{key} proxy, which is the only
# path that behaves identically against the local floci-gcp emulator and real
# GCS. That keeps the deploy story "set project_id, apply" with no ACL or
# signed-URL key material to manage.

resource "google_storage_bucket" "studed_uploads" {
  name          = "studed-uploads-${local.project_id}"
  location      = var.region
  force_destroy = true

  # Disable per-object ACLs: IAM is the single source of truth.
  uniform_bucket_level_access = true
  public_access_prevention    = "enforced"

  versioning {
    enabled = true
  }

  # Reclaim storage from replaced/deleted images so an unbounded upload volume
  # cannot quietly grow the bill.
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

  # Abandoned resumable uploads are billed until they expire.
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

# Dedicated least-privilege identity for upload-service. It is the ONLY
# principal with write access to the bucket - deliberately not the node SA
# (which every pod on the node could borrow) and not the external-secrets SA.
resource "google_service_account" "upload_sa" {
  account_id   = local.upload_gsa
  display_name = "StudEd upload-service (Workload Identity)"
}

# Scoped to this bucket only, not project-wide storage admin.
resource "google_storage_bucket_iam_member" "upload_object_admin" {
  bucket = google_storage_bucket.studed_uploads.name
  role   = "roles/storage.objectAdmin"
  member = "serviceAccount:${google_service_account.upload_sa.email}"
}

# Let the upload-service Kubernetes ServiceAccount impersonate the GSA, so the
# pod authenticates to GCS with no downloaded key file.
resource "google_service_account_iam_binding" "upload_wi_binding" {
  service_account_id = google_service_account.upload_sa.name
  role               = "roles/iam.workloadIdentityUser"
  members = [
    "serviceAccount:${local.project_id}.svc.id.goog[studed/upload-service-sa]",
  ]
}
