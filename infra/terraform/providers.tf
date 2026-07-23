terraform {
  required_version = ">= 1.6.0"
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
  }
}

provider "aws" {
  region     = var.aws_region
  access_key = var.use_floci ? "mock_access_key" : null
  secret_key = var.use_floci ? "mock_secret_key" : null

  # Floci local cloud emulation overrides
  skip_credentials_validation = var.use_floci
  skip_metadata_api_check     = var.use_floci
  skip_requesting_account_id  = var.use_floci
  s3_use_path_style           = var.use_floci

  dynamic "endpoints" {
    for_each = var.use_floci ? [1] : []
    content {
      s3          = var.floci_endpoint
      dynamodb    = var.floci_endpoint
      rds         = var.floci_endpoint
      elasticache = var.floci_endpoint
      ecs         = var.floci_endpoint
      sts         = var.floci_endpoint
    }
  }

  default_tags {
    tags = {
      Project     = "StudEd"
      Environment = var.environment
      ManagedBy   = "OpenTofu"
    }
  }
}
