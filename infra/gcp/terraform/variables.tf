variable "project_id" {
  description = "GCP project ID where StudEd backend resources are provisioned"
  type        = string
  default     = "studed-prod"
}

variable "region" {
  description = "GCP region for zonal resources"
  type        = string
  default     = "us-central1"
}

variable "zone" {
  description = "GCP zone for the GKE cluster"
  type        = string
  default     = "us-central1-a"
}

variable "cluster_name" {
  description = "Name of the GKE cluster hosting the StudEd backend"
  type        = string
  default     = "studed-backend"
}

variable "node_machine_type" {
  description = "GKE node machine type (dedicated vCPU avoids shared-core CPU reservation)"
  type        = string
  default     = "e2-standard-2"
}

variable "node_count" {
  description = "Initial node count for the primary node pool"
  type        = number
  default     = 1
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
