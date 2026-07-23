resource "aws_db_instance" "postgres" {
  identifier           = "studed-postgres-${var.environment}"
  allocated_storage    = 20
  max_allocated_storage = 100
  engine               = "postgres"
  engine_version       = "15"
  instance_class       = "db.t3.micro"
  db_name              = var.db_name
  username             = var.db_username
  password             = var.db_password
  skip_final_snapshot  = true

  tags = {
    Name        = "studed-postgres"
    Environment = var.environment
    Service     = "microservices-db"
  }
}
