resource "aws_ecs_cluster" "cluster" {
  name = "studed-cluster-${var.environment}"

  tags = {
    Name        = "studed-ecs-cluster"
    Environment = var.environment
  }
}
