# ============================================================
# Dev Environment - Root Module
#
# This is the ENTRY POINT for Terraform.
# It calls all feature modules and wires their inputs/outputs together.
#
# DEPLOY ORDER (Terraform figures this out automatically via dependencies):
# 1. ECR (no dependencies)
# 2. VPC (no dependencies)
# 3. DynamoDB (no dependencies)
# 4. Cognito (no dependencies)
# 5. IAM (needs ECR ARN, DynamoDB ARN)
# 6. EC2 (needs VPC, IAM, ECR URL, Cognito IDs, DynamoDB name)
#
# BACKEND NOTE:
# The S3 backend stores terraform.tfstate remotely.
# This is critical for teams — everyone shares the same state.
# Run scripts/bootstrap.sh FIRST to create the S3 bucket and lock table!
# ============================================================

terraform {
  required_version = ">= 1.9.0"

  # Remote state in S3 — never lose your infrastructure state!
  # terraform.tfstate tracks all resources Terraform manages.
  # Locally: works fine alone, but if lost → can't manage resources
  # S3: survives laptop crashes, shared across team, versioned
  backend "s3" {
    bucket         = "talent-app-terraform-state-486804363192"
    key            = "dev/terraform.tfstate"
    region         = "ap-southeast-2"

    # DynamoDB table for state locking
    # Prevents two people from running apply simultaneously (race condition → corruption)
    dynamodb_table = "talent-app-terraform-locks"
    encrypt        = true  # Encrypt state file (contains sensitive outputs!)
  }

  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
  }
}

provider "aws" {
  region = var.aws_region

  # Default tags applied to ALL resources — great for cost tracking!
  default_tags {
    tags = {
      Project     = var.app_name
      Environment = var.environment
      ManagedBy   = "terraform"
      Repository  = "talent-discovery-app"
    }
  }
}

# Current AWS account info (needed for IAM ARNs)
data "aws_caller_identity" "current" {}

# ===== MODULE: ECR =====
# Create FIRST — IAM module needs the ECR ARN
module "ecr" {
  source = "../../modules/ecr"

  app_name    = var.app_name
  environment = var.environment
}

# ===== MODULE: VPC =====
module "vpc" {
  source = "../../modules/vpc"

  app_name    = var.app_name
  environment = var.environment
}

# ===== MODULE: DYNAMODB =====
module "dynamodb" {
  source = "../../modules/dynamodb"

  app_name    = var.app_name
  environment = var.environment
}

# ===== MODULE: COGNITO =====
module "cognito" {
  source = "../../modules/cognito"

  app_name    = var.app_name
  environment = var.environment

  # Include both local dev and production URLs
  # STEP 2: Add your EC2 Elastic IP URL here after first apply
  callback_urls = compact([
    "http://localhost:3000/api/auth/callback/cognito",
    # HTTPS required for non-localhost. Add after setting up SSL:
    # var.ec2_public_ip != "" ? "https://${var.ec2_public_ip}/api/auth/callback/cognito" : "",
  ])

  logout_urls = compact([
    "http://localhost:3000",
    # var.ec2_public_ip != "" ? "https://${var.ec2_public_ip}" : "",
  ])
}

# ===== MODULE: IAM =====
module "iam" {
  source = "../../modules/iam"

  app_name           = var.app_name
  environment        = var.environment
  ecr_repository_arn = "arn:aws:ecr:${var.aws_region}:${data.aws_caller_identity.current.account_id}:repository/${var.app_name}-${var.environment}"
  dynamodb_table_arn = module.dynamodb.table_arn   # Scope DynamoDB access
  aws_region         = var.aws_region
  aws_account_id     = data.aws_caller_identity.current.account_id
}

# ===== MODULE: EC2 =====
module "ec2" {
  source = "../../modules/ec2"

  app_name    = var.app_name
  environment = var.environment
  aws_region  = var.aws_region

  # Networking (from VPC module)
  vpc_id            = module.vpc.vpc_id
  subnet_id         = module.vpc.public_subnet_ids[0]  # First public subnet
  security_group_id = module.vpc.ec2_security_group_id

  # IAM (from IAM module)
  iam_instance_profile = module.iam.ec2_instance_profile_name

  # Container registry (from ECR module)
  ecr_registry_url = split("/", module.ecr.repository_url)[0]  # Just the registry hostname
  ecr_repo_name    = module.ecr.repository_name

  # App configuration
  dynamodb_table_name  = module.dynamodb.table_name
  cognito_client_id    = module.cognito.client_id
  cognito_user_pool_id = module.cognito.user_pool_id
  ec2_public_ip        = var.ec2_public_ip
  domain_name          = var.domain_name

  depends_on = [module.vpc, module.iam, module.ecr, module.cognito]
}

# ===== SSM PARAMETERS =====
# Store Cognito client secret in SSM (EC2 needs it at startup)
# The secret itself comes from the Cognito module output
resource "aws_ssm_parameter" "cognito_client_secret" {
  name        = "/${var.app_name}/${var.environment}/cognito-client-secret"
  description = "Cognito User Pool Client Secret for next-auth"
  type        = "SecureString"  # Encrypted with KMS
  value       = module.cognito.client_secret

  tags = {
    Environment = var.environment
    ManagedBy   = "terraform"
  }
}

# Placeholder parameters — fill in manually via AWS Console or CLI
# aws ssm put-parameter --name "/talent-app/dev/gemini-api-key" \
#   --value "your-key" --type SecureString
resource "aws_ssm_parameter" "gemini_api_key" {
  name        = "/${var.app_name}/${var.environment}/gemini-api-key"
  description = "Google Gemini API key"
  type        = "SecureString"
  value       = "REPLACE_ME"  # Update via: aws ssm put-parameter --overwrite ...

  lifecycle {
    ignore_changes = [value]  # Don't overwrite manual updates with "REPLACE_ME"
  }
}

resource "aws_ssm_parameter" "nextauth_secret" {
  name        = "/${var.app_name}/${var.environment}/nextauth-secret"
  description = "NextAuth.js signing secret (generate with: openssl rand -base64 32)"
  type        = "SecureString"
  value       = "REPLACE_ME"

  lifecycle {
    ignore_changes = [value]
  }
}
