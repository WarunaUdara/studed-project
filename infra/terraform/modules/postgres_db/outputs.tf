output "db_endpoint" {
  value       = aws_db_instance.postgres.endpoint
  description = "PostgreSQL endpoint address"
}

output "db_name" {
  value       = aws_db_instance.postgres.db_name
  description = "Database name"
}
