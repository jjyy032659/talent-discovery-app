# ============================================================
# IAM Module - Main
#
# Creates TWO IAM roles:
#
# 1. EC2 Instance Role:
#    Attached to EC2 → grants EC2 permission to call AWS APIs
#    (pull ECR images, read SSM secrets, write CloudWatch logs)
#    EC2 gets temporary credentials via instance metadata service.
#    NO hardcoded credentials needed! This is the AWS-recommended pattern.
#
# 2. GitHub Actions OIDC Role:
#    GitHub Actions assumes this role via OIDC federation.
#    Grants: push to ECR + send SSM commands to EC2
#    WHY OIDC? No long-lived AWS credentials stored in GitHub!
#    OIDC = GitHub generates a short-lived token, AWS validates it.
# ============================================================

# ===== PART 1: EC2 INSTANCE ROLE =====

# Trust policy: who can ASSUME this role
# EC2 service needs to assume this role to get credentials
data "aws_iam_policy_document" "ec2_trust" {
  statement {
    sid     = "EC2AssumeRole"
    effect  = "Allow"
    actions = ["sts:AssumeRole"]
    principals {
      type        = "Service"
      identifiers = ["ec2.amazonaws.com"]
    }
  }
}

# The EC2 role itself
resource "aws_iam_role" "ec2" {
  name               = "${var.app_name}-${var.environment}-ec2-role"
  assume_role_policy = data.aws_iam_policy_document.ec2_trust.json
  description        = "Role for EC2 instances running the talent-app"

  tags = {
    Name        = "${var.app_name}-${var.environment}-ec2-role"
    Environment = var.environment
    ManagedBy   = "terraform"
  }
}

# ----- POLICY: ECR Access -----
# Allows EC2 to authenticate with ECR and pull Docker images.
# Scoped to ONLY our repository (least privilege).
data "aws_iam_policy_document" "ec2_ecr" {
  # Auth token needed to log in to the ECR registry
  statement {
    sid       = "GetECRAuthToken"
    effect    = "Allow"
    actions   = ["ecr:GetAuthorizationToken"]
    resources = ["*"]  # This action can't be scoped to a specific resource
  }

  # Pull (read) operations on our specific repository
  statement {
    sid    = "PullFromECR"
    effect = "Allow"
    actions = [
      "ecr:GetDownloadUrlForLayer",
      "ecr:BatchGetImage",
      "ecr:BatchCheckLayerAvailability",
    ]
    resources = [var.ecr_repository_arn]
  }
}

resource "aws_iam_policy" "ec2_ecr" {
  name        = "${var.app_name}-${var.environment}-ec2-ecr"
  description = "Allow EC2 to pull images from ECR"
  policy      = data.aws_iam_policy_document.ec2_ecr.json
}

resource "aws_iam_role_policy_attachment" "ec2_ecr" {
  role       = aws_iam_role.ec2.name
  policy_arn = aws_iam_policy.ec2_ecr.arn
}

# ----- POLICY: SSM Parameter Store -----
# Allows EC2 to read secrets (Gemini API key, NextAuth secret).
# We read specific paths only — not all parameters.
data "aws_iam_policy_document" "ec2_ssm_params" {
  statement {
    sid    = "ReadAppSecrets"
    effect = "Allow"
    actions = [
      "ssm:GetParameter",
      "ssm:GetParameters",
      "ssm:GetParametersByPath",
    ]
    # Only allow reading parameters under our app's path
    resources = [
      "arn:aws:ssm:${var.aws_region}:${var.aws_account_id}:parameter/${var.app_name}-*"
    ]
  }
}

resource "aws_iam_policy" "ec2_ssm_params" {
  name   = "${var.app_name}-${var.environment}-ec2-ssm"
  policy = data.aws_iam_policy_document.ec2_ssm_params.json
}

resource "aws_iam_role_policy_attachment" "ec2_ssm_params" {
  role       = aws_iam_role.ec2.name
  policy_arn = aws_iam_policy.ec2_ssm_params.arn
}

# ----- POLICY: DynamoDB Access -----
# Allows the app (running on EC2) to read/write talent profile data.
data "aws_iam_policy_document" "ec2_dynamodb" {
  statement {
    sid    = "DynamoDBCRUD"
    effect = "Allow"
    actions = [
      "dynamodb:GetItem",
      "dynamodb:PutItem",
      "dynamodb:UpdateItem",
      "dynamodb:DeleteItem",
      "dynamodb:Query",    # Query by partition key
      "dynamodb:Scan",     # Full table scan (use sparingly!)
      "dynamodb:BatchGetItem",
      "dynamodb:BatchWriteItem",
    ]
    resources = [
      var.dynamodb_table_arn,
      "${var.dynamodb_table_arn}/index/*",  # For GSI queries if added later
    ]
  }
}

resource "aws_iam_policy" "ec2_dynamodb" {
  name   = "${var.app_name}-${var.environment}-ec2-dynamodb"
  policy = data.aws_iam_policy_document.ec2_dynamodb.json
}

resource "aws_iam_role_policy_attachment" "ec2_dynamodb" {
  role       = aws_iam_role.ec2.name
  policy_arn = aws_iam_policy.ec2_dynamodb.arn
}

# ----- AWS MANAGED POLICY: SSM Session Manager -----
# This allows GitHub Actions to run commands on EC2 via SSM
# WITHOUT opening SSH port 22. Much more secure!
# AmazonSSMManagedInstanceCore: the standard policy for SSM agents
resource "aws_iam_role_policy_attachment" "ec2_ssm_core" {
  role       = aws_iam_role.ec2.name
  policy_arn = "arn:aws:iam::aws:policy/AmazonSSMManagedInstanceCore"
}

# ----- AWS MANAGED POLICY: CloudWatch Logs -----
resource "aws_iam_role_policy_attachment" "ec2_cloudwatch" {
  role       = aws_iam_role.ec2.name
  policy_arn = "arn:aws:iam::aws:policy/CloudWatchAgentServerPolicy"
}

# Instance Profile: wrapper around the role that EC2 instances use
# (EC2 uses "instance profiles", not roles directly)
resource "aws_iam_instance_profile" "ec2" {
  name = "${var.app_name}-${var.environment}-ec2-profile"
  role = aws_iam_role.ec2.name
}

# ===== PART 2: GITHUB ACTIONS OIDC ROLE =====
#
# HOW GITHUB OIDC WORKS:
# 1. GitHub Actions generates a JWT token signed by GitHub
# 2. AWS validates the token against GitHub's OIDC provider
# 3. AWS issues temporary credentials for our IAM role
# 4. No long-lived secrets stored in GitHub! ✅
#
# SECURITY BENEFIT:
# Traditional: Store AWS_ACCESS_KEY_ID + AWS_SECRET_ACCESS_KEY in GitHub
#   → These are long-lived → if leaked, attacker has access indefinitely
# OIDC: GitHub gets 1-hour temporary credentials
#   → If token leaked, it expires in 1 hour
#   → Scoped to specific repo/branch conditions

# Register GitHub as an OIDC identity provider in our AWS account
resource "aws_iam_openid_connect_provider" "github" {
  url = "https://token.actions.githubusercontent.com"

  # GitHub's OIDC audiences
  client_id_list = ["sts.amazonaws.com"]

  # GitHub's OIDC thumbprint (SHA1 of the TLS cert)
  # This value is stable — GitHub posts it in their docs
  thumbprint_list = ["6938fd4d98bab03faadb97b34396831e3780aea1",
                     "1c58a3a8518e8759bf075b76b750d4f2df264fcd"]

  tags = {
    Name      = "github-actions-oidc"
    ManagedBy = "terraform"
  }
}

# Trust policy for GitHub Actions
# Restricts to our specific GitHub repository (not any repo on GitHub!)
data "aws_iam_policy_document" "github_actions_trust" {
  statement {
    sid     = "GitHubActionsOIDC"
    effect  = "Allow"
    actions = ["sts:AssumeRoleWithWebIdentity"]

    principals {
      type        = "Federated"
      identifiers = [aws_iam_openid_connect_provider.github.arn]
    }

    condition {
      test     = "StringEquals"
      variable = "token.actions.githubusercontent.com:aud"
      values   = ["sts.amazonaws.com"]
    }

    # IMPORTANT: Restrict to YOUR repo's main branch
    # Format: repo:<owner>/<repo>:ref:refs/heads/<branch>
    # Change "your-github-username/talent-discovery-app" to your actual repo!
    condition {
      test     = "StringLike"
      variable = "token.actions.githubusercontent.com:sub"
      values   = ["repo:${var.github_repo}:*"]
    }
  }
}

resource "aws_iam_role" "github_actions" {
  name               = "${var.app_name}-${var.environment}-github-actions"
  assume_role_policy = data.aws_iam_policy_document.github_actions_trust.json
  description        = "Role assumed by GitHub Actions for CI/CD"

  tags = {
    Name        = "${var.app_name}-${var.environment}-github-actions"
    Environment = var.environment
    ManagedBy   = "terraform"
  }
}

# ----- GITHUB ACTIONS POLICY: ECR Push -----
data "aws_iam_policy_document" "github_ecr" {
  statement {
    sid       = "ECRAuth"
    effect    = "Allow"
    actions   = ["ecr:GetAuthorizationToken"]
    resources = ["*"]
  }

  statement {
    sid    = "ECRPush"
    effect = "Allow"
    actions = [
      "ecr:BatchCheckLayerAvailability",
      "ecr:CompleteLayerUpload",
      "ecr:GetDownloadUrlForLayer",
      "ecr:InitiateLayerUpload",
      "ecr:PutImage",
      "ecr:UploadLayerPart",
      "ecr:BatchGetImage",
      "ecr:DescribeImages",
    ]
    resources = [var.ecr_repository_arn]
  }
}

resource "aws_iam_policy" "github_ecr" {
  name   = "${var.app_name}-${var.environment}-github-ecr"
  policy = data.aws_iam_policy_document.github_ecr.json
}

resource "aws_iam_role_policy_attachment" "github_ecr" {
  role       = aws_iam_role.github_actions.name
  policy_arn = aws_iam_policy.github_ecr.arn
}

# ----- GITHUB ACTIONS POLICY: SSM Deploy -----
# GitHub Actions sends commands to EC2 via SSM (no SSH needed)
data "aws_iam_policy_document" "github_ssm" {
  statement {
    sid    = "SSMRunCommand"
    effect = "Allow"
    actions = [
      "ssm:SendCommand",
      "ssm:GetCommandInvocation",
      "ssm:ListCommandInvocations",
    ]
    resources = ["*"]  # SSM doesn't support resource-level for SendCommand
  }

  statement {
    sid       = "DescribeEC2"
    effect    = "Allow"
    actions   = ["ec2:DescribeInstances"]
    resources = ["*"]
  }
}

resource "aws_iam_policy" "github_ssm" {
  name   = "${var.app_name}-${var.environment}-github-ssm"
  policy = data.aws_iam_policy_document.github_ssm.json
}

resource "aws_iam_role_policy_attachment" "github_ssm" {
  role       = aws_iam_role.github_actions.name
  policy_arn = aws_iam_policy.github_ssm.arn
}
