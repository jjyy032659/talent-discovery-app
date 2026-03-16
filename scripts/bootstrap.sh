#!/bin/bash
# ============================================================
# Bootstrap Script - Run ONCE before terraform apply
#
# WHY THIS SCRIPT?
# Terraform stores its state in an S3 bucket.
# But Terraform can't CREATE the S3 bucket it stores state in!
# (Chicken-and-egg problem)
# This script creates the S3 bucket and DynamoDB lock table
# using the AWS CLI directly.
#
# REQUIREMENTS:
# - AWS CLI installed and configured (aws configure)
# - Permissions: s3:CreateBucket, dynamodb:CreateTable, iam:*
#
# USAGE:
#   chmod +x scripts/bootstrap.sh
#   ./scripts/bootstrap.sh
#
# Run this ONCE. After that, use terraform apply for everything.
# ============================================================

set -euo pipefail

# ---- CONFIGURATION ----
# These MUST match the backend config in environments/dev/main.tf!
BUCKET_NAME="talent-app-terraform-state-486804363192"  # account ID ensures global uniqueness
LOCK_TABLE="talent-app-terraform-locks"
REGION="ap-southeast-2"

echo "============================================================"
echo "  Bootstrapping Terraform Backend"
echo "  Bucket: $BUCKET_NAME"
echo "  Lock Table: $LOCK_TABLE"
echo "  Region: $REGION"
echo "============================================================"

# ---- CREATE S3 BUCKET ----
echo ""
echo "==> Creating S3 bucket for Terraform state..."

# us-east-1 is the default and doesn't need LocationConstraint
# Other regions need: --create-bucket-configuration LocationConstraint=REGION
if aws s3api head-bucket --bucket "$BUCKET_NAME" 2>/dev/null; then
  echo "  Bucket already exists, skipping..."
else
  if [ "$REGION" = "us-east-1" ]; then
    aws s3api create-bucket \
      --bucket "$BUCKET_NAME" \
      --region "$REGION"
  else
    aws s3api create-bucket \
      --bucket "$BUCKET_NAME" \
      --region "$REGION" \
      --create-bucket-configuration LocationConstraint="$REGION"
  fi
  echo "  Bucket created: $BUCKET_NAME"
fi

# ---- ENABLE VERSIONING ----
# If Terraform state gets corrupted, you can restore a previous version
echo ""
echo "==> Enabling S3 versioning (allows state recovery)..."
aws s3api put-bucket-versioning \
  --bucket "$BUCKET_NAME" \
  --versioning-configuration Status=Enabled
echo "  Versioning enabled"

# ---- ENABLE ENCRYPTION ----
# State file contains sensitive data (like Cognito client secrets)
echo ""
echo "==> Enabling S3 server-side encryption..."
aws s3api put-bucket-encryption \
  --bucket "$BUCKET_NAME" \
  --server-side-encryption-configuration '{
    "Rules": [{
      "ApplyServerSideEncryptionByDefault": {
        "SSEAlgorithm": "AES256"
      }
    }]
  }'
echo "  Encryption enabled"

# ---- BLOCK PUBLIC ACCESS ----
# State files should NEVER be public!
echo ""
echo "==> Blocking all public access to state bucket..."
aws s3api put-public-access-block \
  --bucket "$BUCKET_NAME" \
  --public-access-block-configuration \
    "BlockPublicAcls=true,IgnorePublicAcls=true,BlockPublicPolicy=true,RestrictPublicBuckets=true"
echo "  Public access blocked"

# ---- CREATE DYNAMODB LOCK TABLE ----
# Prevents two terraform applies from running simultaneously.
# Without this: two people could corrupt the state file!
echo ""
echo "==> Creating DynamoDB state lock table..."

if aws dynamodb describe-table --table-name "$LOCK_TABLE" --region "$REGION" 2>/dev/null; then
  echo "  Table already exists, skipping..."
else
  aws dynamodb create-table \
    --table-name "$LOCK_TABLE" \
    --attribute-definitions AttributeName=LockID,AttributeType=S \
    --key-schema AttributeName=LockID,KeyType=HASH \
    --billing-mode PAY_PER_REQUEST \
    --region "$REGION"

  # Wait for table to be ready
  echo "  Waiting for DynamoDB table to be active..."
  aws dynamodb wait table-exists --table-name "$LOCK_TABLE" --region "$REGION"
  echo "  Lock table created: $LOCK_TABLE"
fi

echo ""
echo "============================================================"
echo "  Bootstrap complete!"
echo ""
echo "  NEXT STEPS:"
echo "  1. cd terraform/environments/dev"
echo "  2. terraform init"
echo "  3. terraform plan"
echo "  4. terraform apply"
echo ""
echo "  After first apply, check outputs for GitHub Secrets values."
echo "============================================================"
