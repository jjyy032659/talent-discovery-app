# ============================================================
# ECR Module - Main
# Creates the Docker image repository where GitHub Actions
# pushes images and EC2 pulls them from.
# ============================================================

resource "aws_ecr_repository" "app" {
  name = "${var.app_name}-${var.environment}"

  # MUTABLE allows overwriting the 'latest' tag on each deploy.
  # In production, consider IMMUTABLE with semantic versioning.
  image_tag_mutability = var.image_tag_mutability

  # Encrypt images at rest using AWS-managed KMS key (free).
  # For compliance requirements, you'd use a customer-managed key.
  encryption_configuration {
    encryption_type = "AES256"
  }

  image_scanning_configuration {
    scan_on_push = var.scan_on_push
  }

  tags = {
    Name        = "${var.app_name}-${var.environment}-ecr"
    Environment = var.environment
    ManagedBy   = "terraform"
  }
}

# ----- LIFECYCLE POLICY -----
# Automatically delete old images to control storage costs.
# Without this, every push accumulates and costs $0.10/GB/month.
# We keep the last N images tagged 'latest' or with semantic versions.
resource "aws_ecr_lifecycle_policy" "app" {
  repository = aws_ecr_repository.app.name

  policy = jsonencode({
    rules = [
      {
        rulePriority = 1
        description  = "Keep last ${var.retention_count} images"
        selection = {
          tagStatus   = "any"
          countType   = "imageCountMoreThan"
          countNumber = var.retention_count
        }
        action = {
          type = "expire"
        }
      }
    ]
  })
}
