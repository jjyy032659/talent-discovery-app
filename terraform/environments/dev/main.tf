# Root module for the dev environment.
# Wires all feature modules together and manages remote state.

terraform {
  required_version = ">= 1.9.0"

  # State stored in S3 so it survives local machine issues and can be shared.
  # Run scripts/bootstrap.sh first to create the bucket and lock table.
  backend "s3" {
    bucket         = "talent-app-terraform-state-486804363192"
    key            = "dev/terraform.tfstate"
    region         = "ap-southeast-2"
    dynamodb_table = "talent-app-terraform-locks"
    encrypt        = true
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

  default_tags {
    tags = {
      Project     = var.app_name
      Environment = var.environment
      ManagedBy   = "terraform"
      Repository  = "talent-discovery-app"
    }
  }
}

data "aws_caller_identity" "current" {}

module "ecr" {
  source = "../../modules/ecr"

  app_name    = var.app_name
  environment = var.environment
}

module "vpc" {
  source = "../../modules/vpc"

  app_name    = var.app_name
  environment = var.environment
}

module "dynamodb" {
  source = "../../modules/dynamodb"

  app_name    = var.app_name
  environment = var.environment
}

module "cognito" {
  source = "../../modules/cognito"

  app_name    = var.app_name
  environment = var.environment

  callback_urls = compact([
    "http://localhost:3000/api/auth/callback/cognito",
    "http://localhost:3000/api/auth/callback/cognito-email",
    var.domain_name != "" ? "https://${var.domain_name}/api/auth/callback/cognito" : "",
    var.domain_name != "" ? "https://${var.domain_name}/api/auth/callback/cognito-email" : "",
    var.domain_name != "" ? "https://www.${var.domain_name}/api/auth/callback/cognito" : "",
    var.domain_name != "" ? "https://www.${var.domain_name}/api/auth/callback/cognito-email" : "",
  ])

  logout_urls = compact([
    "http://localhost:3000",
    var.domain_name != "" ? "https://${var.domain_name}" : "",
    var.domain_name != "" ? "https://www.${var.domain_name}" : "",
  ])

  google_client_id     = var.google_client_id
  google_client_secret = var.google_client_secret
}

module "iam" {
  source = "../../modules/iam"

  app_name           = var.app_name
  environment        = var.environment
  ecr_repository_arn = "arn:aws:ecr:${var.aws_region}:${data.aws_caller_identity.current.account_id}:repository/${var.app_name}-${var.environment}"
  dynamodb_table_arn = module.dynamodb.table_arn
  aws_region         = var.aws_region
  aws_account_id     = data.aws_caller_identity.current.account_id
  github_repo        = "jjyy032659/talent-discovery-app"
}

module "ec2" {
  source = "../../modules/ec2"

  app_name    = var.app_name
  environment = var.environment
  aws_region  = var.aws_region

  vpc_id            = module.vpc.vpc_id
  subnet_id         = module.vpc.public_subnet_ids[0]
  security_group_id = module.vpc.ec2_security_group_id

  iam_instance_profile = module.iam.ec2_instance_profile_name

  ecr_registry_url = split("/", module.ecr.repository_url)[0]
  ecr_repo_name    = module.ecr.repository_name

  dynamodb_table_name  = module.dynamodb.table_name
  cognito_client_id    = module.cognito.client_id
  cognito_user_pool_id = module.cognito.user_pool_id
  ec2_public_ip        = var.ec2_public_ip
  domain_name          = var.domain_name

  depends_on = [module.vpc, module.iam, module.ecr, module.cognito]
}

# Cognito client secret is managed by Terraform and stored in SSM so the
# EC2 startup script can read it without it appearing in source control.
resource "aws_ssm_parameter" "cognito_client_secret" {
  name        = "/${var.app_name}/${var.environment}/cognito-client-secret"
  description = "Cognito User Pool Client Secret for next-auth"
  type        = "SecureString"
  value       = module.cognito.client_secret

  tags = {
    Environment = var.environment
    ManagedBy   = "terraform"
  }
}

# Placeholder parameters — set the real values after first apply:
# aws ssm put-parameter --name "/talent-app/dev/gemini-api-key" \
#   --value "your-key" --type SecureString --overwrite
resource "aws_ssm_parameter" "gemini_api_key" {
  name        = "/${var.app_name}/${var.environment}/gemini-api-key"
  description = "Google Gemini API key"
  type        = "SecureString"
  value       = "REPLACE_ME"

  lifecycle {
    ignore_changes = [value]
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
