# ============================================================
# EC2 Module - Main
#
# Creates:
# - EC2 instance running Docker + nginx
# - Elastic IP (static public IP — doesn't change on restart)
# - Key pair (for emergency SSH access)
#
# HOW DEPLOYMENT WORKS:
# 1. Terraform creates EC2 → user_data.sh runs → server ready
# 2. GitHub Actions: build image → push to ECR → SSM run deploy.sh
# 3. deploy.sh: pull new image → swap container → done!
# ============================================================

# ----- DATA: Latest Amazon Linux 2023 AMI -----
# We use a data source to always get the latest AMI ID automatically.
# Without this, the AMI ID would become outdated and we'd be running
# an old OS version with security vulnerabilities.
#
# Amazon Linux 2023 (AL2023) vs Ubuntu:
# - AL2023: AWS-optimized, comes with AWS CLI, SSM agent pre-installed
# - Ubuntu: More packages, familiar to most devs
# - We choose AL2023 for best AWS integration and learning
data "aws_ami" "amazon_linux_2023" {
  most_recent = true
  owners      = ["amazon"]

  filter {
    name   = "name"
    values = ["al2023-ami-*-x86_64"]
  }

  filter {
    name   = "virtualization-type"
    values = ["hvm"]
  }
}

# ----- EC2 INSTANCE -----
resource "aws_instance" "app" {
  ami           = data.aws_ami.amazon_linux_2023.id
  instance_type = var.instance_type

  # Place in public subnet so it's reachable from internet
  subnet_id = var.subnet_id

  # Attach security group from VPC module
  vpc_security_group_ids = [var.security_group_id]

  # IAM Instance Profile gives this EC2 permissions to:
  # - Pull images from ECR (no credentials needed!)
  # - Read secrets from SSM Parameter Store
  # - Run SSM Session Manager (for deployments without SSH)
  # - Write logs to CloudWatch
  iam_instance_profile = var.iam_instance_profile

  # The setup script (rendered from template with actual values)
  user_data = templatefile("${path.module}/user_data.sh.tpl", {
    aws_region           = var.aws_region
    ecr_registry_url     = var.ecr_registry_url
    ecr_repo_name        = var.ecr_repo_name
    dynamodb_table_name  = var.dynamodb_table_name
    cognito_client_id    = var.cognito_client_id
    cognito_user_pool_id = var.cognito_user_pool_id
    app_name             = var.app_name
    environment          = var.environment
    ec2_public_ip        = var.ec2_public_ip
    domain_name          = var.domain_name
  })

  # Protect against accidental termination via Terraform.
  # You'd need to set this to false before running terraform destroy.
  disable_api_termination = false

  # EBS root volume settings
  root_block_device {
    volume_type           = "gp3"    # gp3 is cheaper than gp2 and faster
    volume_size           = 30       # AL2023 AMI snapshot requires minimum 30GB
    encrypted             = true     # Always encrypt volumes
    delete_on_termination = true
  }

  tags = {
    Name        = "${var.app_name}-${var.environment}-server"
    Environment = var.environment
    ManagedBy   = "terraform"
  }

  # Ensure IAM profile is ready before EC2 tries to use it
  depends_on = [var.iam_instance_profile]
}

# ----- ELASTIC IP -----
# An Elastic IP gives us a STATIC public IP address.
# WHY? Without it:
# - EC2's public IP changes every time it restarts
# - Cognito callback URLs would break
# - DNS records would need updating
# - Cost: FREE when attached to a running instance
#         $0.005/hour (~$3.60/mo) when NOT attached
#         → Always terminate or associate to avoid wasted cost!
resource "aws_eip" "app" {
  domain   = "vpc"
  instance = aws_instance.app.id

  tags = {
    Name        = "${var.app_name}-${var.environment}-eip"
    Environment = var.environment
    ManagedBy   = "terraform"
  }
}
