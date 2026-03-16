# ============================================================
# VPC Module - Variables
# A VPC (Virtual Private Cloud) is your own isolated network
# inside AWS. Think of it as renting a private building in AWS's
# data center where you control the floor plan.
# ============================================================

variable "app_name" {
  description = "Application name used for naming all resources"
  type        = string
}

variable "environment" {
  description = "Deployment environment (dev/staging/prod)"
  type        = string
}

variable "vpc_cidr" {
  description = <<-EOT
    CIDR block for the VPC.
    10.0.0.0/16 gives us 65,536 IP addresses — plenty for a dev project.
    CIDR notation: IP/prefix where prefix = how many bits are fixed.
    /16 means first 16 bits fixed → 2^(32-16) = 65,536 IPs.
  EOT
  type        = string
  default     = "10.0.0.0/16"
}

variable "public_subnet_cidrs" {
  description = <<-EOT
    CIDR blocks for public subnets (one per Availability Zone).
    Public subnets have a route to the Internet Gateway — resources here
    can be reached from the internet (like our EC2 web server).
    We use 2 AZs for resilience (ALB requires 2, and it's good practice).
  EOT
  type        = list(string)
  default     = ["10.0.1.0/24", "10.0.2.0/24"]
}

variable "private_subnet_cidrs" {
  description = <<-EOT
    CIDR blocks for private subnets (one per Availability Zone).
    Private subnets have NO route to the internet — databases, internal
    services live here. For this project we define them but don't use them
    yet (good practice for production: always put DBs in private subnets).
    DynamoDB is managed by AWS so it doesn't live in our VPC at all.
  EOT
  type        = list(string)
  default     = ["10.0.101.0/24", "10.0.102.0/24"]
}

variable "availability_zones" {
  description = "AZs to deploy subnets into (should match subnet count)"
  type        = list(string)
  default     = ["ap-southeast-2a", "ap-southeast-2b"]
}
