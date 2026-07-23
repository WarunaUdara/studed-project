output "cluster_name" {
  value       = aws_ecs_cluster.cluster.name
  description = "Cluster name"
}

output "cluster_arn" {
  value       = aws_ecs_cluster.cluster.arn
  description = "Cluster ARN"
}
