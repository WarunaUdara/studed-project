variable "environment" {
  type        = string
  description = "Target deployment environment"
}

variable "db_name" {
  type        = string
  description = "Database name"
  default     = "studed"
}

variable "db_username" {
  type        = string
  description = "Master username"
  sensitive   = true
}

variable "db_password" {
  type        = string
  description = "Master password"
  sensitive   = true
}
