variable "environment" {
  type        = string
  description = "Target deployment environment (dev, staging, prod)"
  default     = "dev"

  validation {
    condition     = contains(["dev", "staging", "prod"], var.environment)
    error_message = "Environment must be one of: dev, staging, prod."
  }
}

variable "use_floci" {
  type        = bool
  description = "Flag to direct cloud calls to local Floci emulator (port 4566)"
  default     = true
}

variable "floci_endpoint" {
  type        = string
  description = "Endpoint URL for local Floci emulator"
  default     = "http://localhost:4566"
}

variable "aws_region" {
  type        = string
  description = "AWS Region for deployment"
  default     = "us-east-1"
}

variable "s3_bucket_name" {
  type        = string
  description = "Name of the S3 bucket for assets and upload service"
  default     = "studed-assets-bucket"
}

variable "db_name" {
  type        = string
  description = "PostgreSQL database name"
  default     = "studed"
}

variable "db_username" {
  type        = string
  description = "PostgreSQL master username"
  default     = "studed_user"
  sensitive   = true
}

variable "db_password" {
  type        = string
  description = "PostgreSQL master password"
  default     = "studed_password"
  sensitive   = true
}

variable "redis_port" {
  type        = number
  description = "Redis cache port"
  default     = 6379
}
