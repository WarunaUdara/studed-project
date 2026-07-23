output "environment" {
  value       = var.environment
  description = "Target deployment environment"
}

output "is_floci_emulated" {
  value       = var.use_floci
  description = "Indicates if infrastructure is running against Floci emulator"
}

output "s3_bucket_name" {
  value       = module.s3_storage.bucket_name
  description = "Configured S3 bucket name for uploads"
}

output "s3_bucket_arn" {
  value       = module.s3_storage.bucket_arn
  description = "ARN of the S3 asset bucket"
}

output "redis_endpoint" {
  value       = module.redis_cache.redis_endpoint
  description = "Endpoint address for Redis caching and PubSub broker"
}

output "postgres_db_endpoint" {
  value       = module.postgres_db.db_endpoint
  description = "Endpoint address for PostgreSQL database"
}
