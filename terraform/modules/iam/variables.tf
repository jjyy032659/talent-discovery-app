# ============================================================
# IAM Module - Variables
#
# IAM (Identity and Access Management) is the permission system
# for ALL of AWS. Understanding IAM is the most critical DevOps skill.
#
# KEY CONCEPTS:
# - Principal: WHO (user, role, service) makes a request
# - Action: WHAT they want to do (s3:GetObject, ec2:DescribeInstances)
# - Resource: ON WHAT (arn:aws:s3:::my-bucket/*)
# - Effect: Allow or Deny
# - Condition: When (e.g., only from specific IP, only with MFA)
#
# LEAST PRIVILEGE PRINCIPLE:
# Grant ONLY the permissions needed, nothing more.
# This limits blast radius if credentials are compromised.
# ============================================================

variable "app_name" {
  type = string
}

variable "environment" {
  type = string
}

variable "ecr_repository_arn" {
  description = "ECR repo ARN so EC2 can only pull from OUR repo, not all ECR repos"
  type        = string
}

variable "dynamodb_table_arn" {
  description = "DynamoDB table ARN for least-privilege access"
  type        = string
}

variable "aws_region" {
  type    = string
  default = "us-east-1"
}

variable "aws_account_id" {
  description = "AWS account ID for OIDC trust policy"
  type        = string
}
