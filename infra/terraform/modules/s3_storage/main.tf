resource "aws_s3_bucket" "assets" {
  bucket        = var.bucket_name
  force_destroy = var.environment == "dev"

  tags = {
    Name        = var.bucket_name
    Environment = var.environment
    Service     = "upload-service"
  }
}

resource "aws_s3_bucket_public_access_block" "assets_access" {
  bucket = aws_s3_bucket.assets.id

  block_public_acls       = false
  block_public_policy     = false
  ignore_public_acls      = false
  restrict_public_buckets = false
}

resource "aws_s3_bucket_cors_configuration" "assets_cors" {
  bucket = aws_s3_bucket.assets.id

  cors_rule {
    allowed_headers = ["*"]
    allowed_methods = ["GET", "PUT", "POST", "DELETE", "HEAD"]
    allowed_origins = ["*"]
    max_age_seconds = 3000
  }
}
