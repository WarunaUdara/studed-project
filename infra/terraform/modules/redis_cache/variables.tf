variable "environment" {
  type        = string
  description = "Target deployment environment"
}

variable "port" {
  type        = number
  description = "Redis port"
  default     = 6379
}
