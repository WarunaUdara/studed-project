# Cost-cutting automation: idle-scout.
#
# Cloud Scheduler fires the Cloud Run job hourly. The job queries the load
# balancer's request metric; if there was no traffic in the last 2h it scales
# the GKE node pool to 0 nodes (nodes are ~99% of the running cost). Waking up
# is a single command: `make prod-start` (tofu apply -var node_count=2).
#
# Costs of this automation itself: $0 (Cloud Scheduler free tier, Cloud Run
# jobs bill per execution ~$0, Monitoring free, no extra nodes).

# --- API enablement (run + scheduler) is appended in apis.tf ---

# Idle-scout identity: can only scale THIS cluster down and read metrics.
resource "google_service_account" "idle_scout_sa" {
  account_id   = "studed-idle-scout"
  display_name = "StudEd idle-scout (auto scale-down)"
}

resource "google_project_iam_custom_role" "idle_scout_role" {
  role_id     = "studedIdleScout"
  title       = "StudEd Idle Scout"
  description = "Scale the StudEd GKE primary node pool only"
  permissions = ["container.clusters.update"]
}

resource "google_project_iam_member" "idle_scout_cluster" {
  project = local.project_id
  role    = google_project_iam_custom_role.idle_scout_role.name
  member  = "serviceAccount:${google_service_account.idle_scout_sa.email}"
}

resource "google_project_iam_member" "idle_scout_monitoring" {
  project = local.project_id
  role    = "roles/monitoring.viewer"
  member  = "serviceAccount:${google_service_account.idle_scout_sa.email}"
}

# --- Cloud Run job that performs the check ---
resource "google_cloud_run_v2_job" "studed_idle_scout" {
  name                = "studed-idle-scout"
  location            = var.region
  deletion_protection = false

  template {
    template {
      service_account = google_service_account.idle_scout_sa.email
      timeout         = "300s"
      containers {
        # Official Cloud SDK image; the script is static (env supplies config).
        image   = "gcr.io/google.com/cloudsdktool/cloud-sdk:latest"
        command = ["bash", "-c", file("${path.module}/scripts/idle-down.sh")]
        env {
          name  = "STUDED_PROJECT"
          value = local.project_id
        }
        env {
          name  = "STUDED_CLUSTER"
          value = var.cluster_name
        }
        env {
          name  = "STUDED_ZONE"
          value = var.zone
        }
        env {
          name  = "STUDED_NODE_POOL"
          value = "primary"
        }
        env {
          name  = "STUDED_IDLE_HOURS"
          value = "2"
        }
        resources {
          limits = {
            cpu    = "1"
            memory = "512Mi"
          }
        }
      }
    }
  }

  depends_on = [google_project_service.apis]
}

# --- Hourly trigger ---
resource "google_cloud_scheduler_job" "studed_idle_check" {
  name      = "studed-idle-check"
  schedule  = "0 * * * *"
  time_zone = "Asia/Colombo"
  region    = var.region

  http_target {
    http_method = "POST"
    uri         = "https://${var.region}-run.googleapis.com/apis/run.googleapis.com/v1/namespaces/${local.project_id}/jobs/${google_cloud_run_v2_job.studed_idle_scout.name}:run"
    oidc_token {
      service_account_email = google_service_account.idle_scout_sa.email
      audience              = "https://${var.region}-run.googleapis.com/"
    }
  }

  depends_on = [google_project_service.apis]
}

# The scheduler's token lets the same SA invoke the job.
resource "google_cloud_run_v2_job_iam_member" "idle_scout_invoker" {
  location = var.region
  project  = local.project_id
  name     = google_cloud_run_v2_job.studed_idle_scout.name
  role     = "roles/run.invoker"
  member   = "serviceAccount:${google_service_account.idle_scout_sa.email}"
}
