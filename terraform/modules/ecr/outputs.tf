output "repository_url" {
  description = <<-EOT
    Full ECR repository URL.
    Format: <account-id>.dkr.ecr.<region>.amazonaws.com/<name>
    Used by GitHub Actions to push images and EC2 to pull them.
  EOT
  value = aws_ecr_repository.app.repository_url
}

output "repository_name" {
  description = "Short repository name (without registry URL)"
  value       = aws_ecr_repository.app.name
}

output "registry_id" {
  description = "AWS account ID that owns the registry"
  value       = aws_ecr_repository.app.registry_id
}
