# ============================================================
# EC2 Module - Variables
#
# WHY EC2 instead of ECS/EKS/Lambda?
#
# | Service        | Cost/mo     | Complexity | Learning Value |
# |----------------|-------------|------------|----------------|
# | EC2 t3.micro   | ~$8         | Low        | High (control) |
# | ECS Fargate    | ~$15-30     | Medium     | Medium         |
# | EKS            | $73+        | High       | Very High      |
# | Lambda + API   | ~$0-2       | Medium     | Medium         |
# | App Runner     | ~$5-20      | Low        | Low            |
#
# EC2 is chosen because:
# 1. FREE for 12 months (t2.micro free tier)
# 2. Most educational — you manage the OS, Docker, nginx yourself
# 3. Gives you deep understanding of server management
# 4. Real-world skill: 70%+ of companies still use EC2
# 5. Cheap after free tier (~$8/month for t3.micro)
# ============================================================

variable "app_name" {
  type = string
}

variable "environment" {
  type = string
}

variable "vpc_id" {
  description = "VPC where EC2 is placed"
  type        = string
}

variable "subnet_id" {
  description = "Public subnet for the EC2 instance"
  type        = string
}

variable "security_group_id" {
  description = "Security group for EC2"
  type        = string
}

variable "instance_type" {
  description = <<-EOT
    t2.micro: FREE TIER (12 months) — 1 vCPU, 1GB RAM
    t3.micro: $7.52/mo — 2 vCPU, 1GB RAM (burstable, better perf)
    t3.small: $15/mo — 2 vCPU, 2GB RAM (good for Next.js + Docker)
    Recommendation: use t2.micro during learning, upgrade later.
  EOT
  type        = string
  default     = "t3.micro"
}

variable "iam_instance_profile" {
  description = "IAM instance profile ARN for EC2 (needed for SSM, ECR, DynamoDB)"
  type        = string
}

variable "ecr_registry_url" {
  description = "ECR registry URL for pulling Docker images"
  type        = string
}

variable "ecr_repo_name" {
  description = "ECR repository name"
  type        = string
}

variable "dynamodb_table_name" {
  description = "DynamoDB table name passed to the app via env var"
  type        = string
}

variable "cognito_client_id" {
  description = "Cognito User Pool Client ID"
  type        = string
}

variable "cognito_user_pool_id" {
  description = "Cognito User Pool ID"
  type        = string
}

variable "aws_region" {
  description = "AWS region"
  type        = string
  default     = "us-east-1"
}

variable "ec2_public_ip" {
  description = "Elastic IP of the EC2 instance (used for AUTH_URL)"
  type        = string
  default     = ""
}
