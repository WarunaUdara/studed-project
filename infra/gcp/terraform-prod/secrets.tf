# Secret Manager holds all runtime secrets. Versions are populated OUTSIDE
# of Terraform (from local .env via scripts/gcp/populate-secrets.sh) so secrets
# never land in git. external-secrets in the cluster reads them via Workload
# Identity. Names match what populate-secrets.sh and the ExternalSecret expect.

resource "google_secret_manager_secret" "studed_secrets" {
  for_each = toset([
    "database-url", # Neon Postgres connection string (sslmode=require)
    "database-owner-url", # schema-owner connection string for boot migrations
    "jwt-access-secret",
    "jwt-refresh-secret",
    "service-token",
    "gcs-bucket-name",
    "gemini-api-key",      # empty placeholder until a real key is provided
    "opencode-api-key",    # empty placeholder until a real key is provided
    "payhere-merchant-id", # empty placeholder
    "payhere-merchant-secret",
    "payhere-notify-url",
  ])

  secret_id = "studed-${each.value}"

  replication {
    user_managed {
      replicas {
        location = var.region
      }
    }
  }

  depends_on = [google_project_service.apis]
}

# external-secrets SA already has roles/secretmanager.secretAccessor at project
# level (see iam.tf); keep bindings scoped to each secret for defense in depth.
resource "google_secret_manager_secret_iam_binding" "es_per_secret" {
  # opencode-api-key excluded: its binding's project renders as the numeric
  # project id in the API, which terraform replans forever. The project-level
  # secretAccessor on this SA (iam.tf) already grants access to every secret.
  for_each = { for k, v in google_secret_manager_secret.studed_secrets : k => v if k != "opencode-api-key" }
  project   = local.project_id
  secret_id = each.value.id
  role      = "roles/secretmanager.secretAccessor"
  members = [
    "serviceAccount:${google_service_account.external_secrets_sa.email}",
  ]
}
