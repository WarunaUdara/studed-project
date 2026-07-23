output "bucket_name" {
  value       = aws_s3_bucket.assets.bucket
  description = "Bucket name"
}

output "bucket_arn" {
  value       = aws_s3_bucket.assets.arn
  description = "Bucket ARN"
}

output "bucket_domain_name" {
  value       = aws_s3_bucket.assets.bucket_domain_name
  description = "Bucket domain name"
}
