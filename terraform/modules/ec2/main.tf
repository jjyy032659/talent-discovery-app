# EC2 instance running Docker + nginx behind an Elastic IP.
# The instance is configured once at launch via user_data; subsequent deploys
# go through GitHub Actions → SSM → Docker swap, not instance recreation.

# Always resolve to the latest Amazon Linux 2023 AMI at plan time
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

resource "aws_instance" "app" {
  ami           = data.aws_ami.amazon_linux_2023.id
  instance_type = var.instance_type

  subnet_id              = var.subnet_id
  vpc_security_group_ids = [var.security_group_id]

  # Instance profile grants the EC2 permissions to pull from ECR,
  # read SSM secrets, and accept SSM Session Manager connections —
  # no SSH keys or hardcoded credentials needed.
  iam_instance_profile = var.iam_instance_profile

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

  disable_api_termination = false

  root_block_device {
    volume_type           = "gp3"
    volume_size           = 30
    encrypted             = true
    delete_on_termination = true
  }

  tags = {
    Name        = "${var.app_name}-${var.environment}-server"
    Environment = var.environment
    ManagedBy   = "terraform"
  }

  # Ignore user_data and ami changes — the server is configured at first launch
  # and updated via Docker swap. Recreating the instance would wipe SSL certs.
  lifecycle {
    ignore_changes = [user_data, ami]
  }

  depends_on = [var.iam_instance_profile]
}

# Elastic IP keeps a static address so DNS records and Cognito callback URLs
# don't break when the instance restarts.
resource "aws_eip" "app" {
  domain   = "vpc"
  instance = aws_instance.app.id

  tags = {
    Name        = "${var.app_name}-${var.environment}-eip"
    Environment = var.environment
    ManagedBy   = "terraform"
  }
}
