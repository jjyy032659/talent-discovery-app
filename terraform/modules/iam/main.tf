# Two IAM roles:
# 1. EC2 instance role — lets the server pull images, read secrets, accept SSM commands
# 2. GitHub Actions OIDC role — lets CI/CD push images and deploy via SSM without
#    storing long-lived AWS credentials in GitHub

# ── EC2 Instance Role ─────────────────────────────────────────────────────────

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

# ECR — GetAuthorizationToken must be * (not resource-scoped by AWS)
data "aws_iam_policy_document" "ec2_ecr" {
  statement {
    sid       = "GetECRAuthToken"
    effect    = "Allow"
    actions   = ["ecr:GetAuthorizationToken"]
    resources = ["*"]
  }

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

data "aws_iam_policy_document" "ec2_ssm_params" {
  statement {
    sid    = "ReadAppSecrets"
    effect = "Allow"
    actions = [
      "ssm:GetParameter",
      "ssm:GetParameters",
      "ssm:GetParametersByPath",
    ]
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

data "aws_iam_policy_document" "ec2_dynamodb" {
  statement {
    sid    = "DynamoDBCRUD"
    effect = "Allow"
    actions = [
      "dynamodb:GetItem",
      "dynamodb:PutItem",
      "dynamodb:UpdateItem",
      "dynamodb:DeleteItem",
      "dynamodb:Query",
      "dynamodb:Scan",
      "dynamodb:BatchGetItem",
      "dynamodb:BatchWriteItem",
    ]
    resources = [
      var.dynamodb_table_arn,
      "${var.dynamodb_table_arn}/index/*",
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

# SSM Session Manager — needed for port-forward and remote command execution
resource "aws_iam_role_policy_attachment" "ec2_ssm_core" {
  role       = aws_iam_role.ec2.name
  policy_arn = "arn:aws:iam::aws:policy/AmazonSSMManagedInstanceCore"
}

resource "aws_iam_role_policy_attachment" "ec2_cloudwatch" {
  role       = aws_iam_role.ec2.name
  policy_arn = "arn:aws:iam::aws:policy/CloudWatchAgentServerPolicy"
}

# EC2 uses instance profiles rather than roles directly
resource "aws_iam_instance_profile" "ec2" {
  name = "${var.app_name}-${var.environment}-ec2-profile"
  role = aws_iam_role.ec2.name
}

# ── GitHub Actions OIDC Role ──────────────────────────────────────────────────
# GitHub generates a short-lived JWT; AWS validates it against the registered
# OIDC provider and issues temporary credentials. No static secrets in GitHub.

resource "aws_iam_openid_connect_provider" "github" {
  url            = "https://token.actions.githubusercontent.com"
  client_id_list = ["sts.amazonaws.com"]

  # GitHub's stable OIDC TLS certificate thumbprints
  thumbprint_list = ["6938fd4d98bab03faadb97b34396831e3780aea1",
                     "1c58a3a8518e8759bf075b76b750d4f2df264fcd"]

  tags = {
    Name      = "github-actions-oidc"
    ManagedBy = "terraform"
  }
}

# Restrict assumption to our specific repo only
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

# SSM SendCommand doesn't support resource-level restrictions
data "aws_iam_policy_document" "github_ssm" {
  statement {
    sid    = "SSMRunCommand"
    effect = "Allow"
    actions = [
      "ssm:SendCommand",
      "ssm:GetCommandInvocation",
      "ssm:ListCommandInvocations",
    ]
    resources = ["*"]
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
