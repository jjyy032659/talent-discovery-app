variable "aws_region" {
  description = "AWS region to deploy all resources"
  type        = string
  default     = "us-east-1"
}

variable "app_name" {
  description = "Application name prefix for all resources"
  type        = string
  default     = "talent-app"
}

variable "environment" {
  description = "Deployment environment"
  type        = string
  default     = "dev"
}

variable "instance_type" {
  description = "EC2 instance type (t2.micro is free tier eligible)"
  type        = string
  default     = "t3.micro"
}

variable "ec2_public_ip" {
  description = <<-EOT
    Public IP of the EC2 instance (Elastic IP).
    Set this AFTER first terraform apply when EIP is allocated.
    Used to build Cognito callback URLs.
    On first apply, leave as empty string.
  EOT
  type    = string
  default = ""
}

variable "domain_name" {
  description = "Primary domain name for the app (e.g. talentdiscovery.xyz)"
  type        = string
  default     = ""
}

variable "google_client_id" {
  description = "Google OAuth client ID for Cognito federation"
  type        = string
  default     = ""
}

variable "google_client_secret" {
  description = "Google OAuth client secret for Cognito federation"
  type        = string
  default     = ""
  sensitive   = true
}
