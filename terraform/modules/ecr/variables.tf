# ============================================================
# ECR Module - Variables
#
# WHY ECR (Elastic Container Registry)?
# ECR is AWS's private Docker image registry. Alternatives:
#
# | Service      | Cost            | AWS Integration | Rate Limits |
# |--------------|-----------------|-----------------|-------------|
# | ECR          | Free 500MB/mo   | Native IAM auth | None        |
# | Docker Hub   | Free 1 private  | Manual config   | 100/6h free |
# | GitHub GHCR  | Free w/ Actions | Via PAT token   | None        |
#
# We choose ECR because:
# 1. No auth tokens to rotate — uses IAM roles (EC2 instance role)
# 2. No rate limits for AWS-internal pulls (EC2 → ECR is free)
# 3. Integrated with AWS security (encryption, scanning)
# 4. Learning: understand AWS container infrastructure
# ============================================================

variable "app_name" {
  description = "Application name"
  type        = string
}

variable "environment" {
  description = "Deployment environment"
  type        = string
}

variable "image_tag_mutability" {
  description = <<-EOT
    MUTABLE: can overwrite tags (e.g., 'latest') — simpler for small teams
    IMMUTABLE: tags are permanent — better for auditing/compliance
    We use MUTABLE for dev since we frequently update 'latest'.
  EOT
  type        = string
  default     = "MUTABLE"
}

variable "scan_on_push" {
  description = <<-EOT
    Enable ECR image scanning on push.
    ECR uses Clair (open-source) to scan for OS-level CVEs.
    FREE — always enable this! It catches vulnerabilities early.
  EOT
  type        = bool
  default     = true
}

variable "retention_count" {
  description = <<-EOT
    Number of images to keep in ECR. Older images are automatically
    deleted by a lifecycle policy. Keeps storage costs low.
    We keep 5 images so we can roll back up to 5 deploys.
  EOT
  type        = number
  default     = 5
}
