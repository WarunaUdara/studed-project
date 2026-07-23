resource "aws_elasticache_replication_group" "redis" {
  replication_group_id = "studed-redis-${var.environment}"
  description          = "StudEd Redis Cache & PubSub cluster"
  node_type            = "cache.t3.micro"
  num_cache_clusters   = 1
  parameter_group_name = "default.redis7"
  port                 = var.port

  tags = {
    Name        = "studed-redis"
    Environment = var.environment
    Service     = "cache-pubsub"
  }
}
