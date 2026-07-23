output "redis_endpoint" {
  value       = try(aws_elasticache_replication_group.redis.primary_endpoint_address, "localhost:6379")
  description = "Redis primary endpoint address"
}

output "redis_port" {
  value       = var.port
  description = "Redis cache port"
}
