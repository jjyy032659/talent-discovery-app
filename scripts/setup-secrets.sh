#!/bin/bash
# ============================================================
# Setup Secrets in AWS SSM Parameter Store
#
# Run this AFTER terraform apply to set the actual secret values.
# Terraform creates placeholder "REPLACE_ME" values.
# This script replaces them with real values.
#
# USAGE:
#   chmod +x scripts/setup-secrets.sh
#   ./scripts/setup-secrets.sh
# ============================================================

set -euo pipefail

REGION="us-east-1"
APP="talent-app"
ENV="dev"

echo "============================================================"
echo "  Setting up SSM Parameter Store secrets"
echo "  App: $APP | Env: $ENV | Region: $REGION"
echo "============================================================"

# ---- GEMINI API KEY ----
echo ""
echo "Enter your Gemini API key (from https://aistudio.google.com/apikey):"
read -r -s GEMINI_KEY  # -s = silent (don't echo to terminal)

aws ssm put-parameter \
  --name "/$APP/$ENV/gemini-api-key" \
  --value "$GEMINI_KEY" \
  --type SecureString \
  --overwrite \
  --region "$REGION"
echo "  Gemini API key stored"

# ---- NEXTAUTH SECRET ----
# Generate a cryptographically secure random secret
NEXTAUTH_SECRET=$(openssl rand -base64 32)

aws ssm put-parameter \
  --name "/$APP/$ENV/nextauth-secret" \
  --value "$NEXTAUTH_SECRET" \
  --type SecureString \
  --overwrite \
  --region "$REGION"
echo "  NextAuth secret generated and stored"
echo "  (Save this for local dev .env.local: $NEXTAUTH_SECRET)"

echo ""
echo "All secrets configured!"
echo ""
echo "Now update your .env.local with:"
echo "  AUTH_SECRET=$NEXTAUTH_SECRET"
