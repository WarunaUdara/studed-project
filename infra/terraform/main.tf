# StudEd Root Infrastructure Composition

module "s3_storage" {
  source      = "./modules/s3_storage"
  bucket_name = var.s3_bucket_name
  environment = var.environment
}

module "redis_cache" {
  source      = "./modules/redis_cache"
  environment = var.environment
  port        = var.redis_port
}

module "postgres_db" {
  source      = "./modules/postgres_db"
  environment = var.environment
  db_name     = var.db_name
  db_username = var.db_username
  db_password = var.db_password
}

module "app_cluster" {
  source      = "./modules/app_cluster"
  environment = var.environment
}
