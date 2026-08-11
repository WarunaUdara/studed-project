variable "project_id" {
  description = "GCP project ID where StudEd backend resources are provisioned"
  type        = string
  default     = "studed-prod"
}

variable "region" {
  description = "GCP region for zonal resources (isolated from the old us-central1 stack)"
  type        = string
  default     = "asia-south1"
}

variable "zone" {
  description = "GCP zone for the GKE cluster"
  type        = string
  default     = "asia-south1-a"
}

variable "cluster_name" {
  description = "Name of the GKE cluster hosting the StudEd backend"
  type        = string
  default     = "studed-prod"
}

variable "node_machine_type" {
  description = "GKE node machine type (dedicated vCPU avoids shared-core CPU reservation)"
  type        = string
  default     = "e2-standard-2"
}

variable "node_count" {
  description = "Initial node count for the primary node pool"
  type        = number
  default     = 2
}

variable "node_min_count" {
  description = "Minimum node count for primary node pool autoscaling"
  type        = number
  default     = 1
}

variable "node_max_count" {
  description = "Maximum node count for primary node pool autoscaling"
  type        = number
  default     = 3
}

variable "node_disk_size_gb" {
  description = "Boot disk size in GB per node"
  type        = number
  default     = 30
}

variable "authorized_cidrs" {
  description = "CIDR ranges allowed to reach the GKE control plane API"
  type        = list(string)
}

variable "sslip_api_hostname" {
  description = "Subdomain prefix for the free sslip.io hostname (api.<ip>.sslip.io)"
  type        = string
  default     = "api"
}

variable "waf_rate_limit_per_ip" {
  description = "Max GraphQL requests per source IP per minute before Cloud Armor throttles"
  type        = number
  default     = 120
}

variable "uploads_cors_origins" {
  description = "Browser origins allowed to read objects from the uploads bucket directly"
  type        = list(string)
  default = [
    "https://studed-project-frontend.pages.dev",
    "http://localhost:5173",
  ]
}

variable "use_floci_gcp" {
  description = "Set to true to point OpenTofu GCP provider at local floci-gcp emulator (:4588)"
  type        = bool
  default     = false
}

variable "floci_gcp_endpoint" {
  description = "Endpoint URL for the local floci-gcp emulator"
  type        = string
  default     = "http://localhost:4588"
}
