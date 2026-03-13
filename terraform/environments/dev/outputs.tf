# ============================================================
# Outputs to display after terraform apply
# These values are needed to configure your app and CI/CD.
# ============================================================

output "ec2_public_ip" {
  description = "Static public IP — set this in your DNS and Cognito callback URLs"
  value       = module.ec2.public_ip
}

output "ecr_repository_url" {
  description = "ECR URL — add to GitHub secret: ECR_REPOSITORY_URL"
  value       = module.ecr.repository_url
}

output "ec2_instance_id" {
  description = "EC2 instance ID — add to GitHub secret: EC2_INSTANCE_ID"
  value       = module.ec2.instance_id
}

output "cognito_user_pool_id" {
  description = "Cognito User Pool ID — for AUTH_COGNITO_ISSUER env var"
  value       = module.cognito.user_pool_id
}

output "cognito_client_id" {
  description = "Cognito Client ID — add to GitHub secret: AUTH_COGNITO_ID"
  value       = module.cognito.client_id
}

output "cognito_issuer_url" {
  description = "OIDC issuer URL — add to GitHub secret: AUTH_COGNITO_ISSUER"
  value       = module.cognito.issuer_url
}

output "dynamodb_table_name" {
  description = "DynamoDB table name — add to GitHub secret: DYNAMODB_TABLE_NAME"
  value       = module.dynamodb.table_name
}

output "github_actions_role_arn" {
  description = "GitHub Actions IAM role ARN — add to GitHub secret: AWS_ROLE_ARN"
  value       = module.iam.github_actions_role_arn
}

output "cognito_hosted_ui" {
  description = "Cognito hosted login UI URL — use for manual testing"
  value       = module.cognito.hosted_ui_domain
}

output "next_steps" {
  description = "What to do after terraform apply"
  value       = <<-EOT

    ✅ NEXT STEPS after first 'terraform apply':

    1. Update SSM secrets (replace REPLACE_ME values):
       aws ssm put-parameter --name "/talent-app/dev/gemini-api-key" \
         --value "YOUR_GEMINI_KEY" --type SecureString --overwrite

       aws ssm put-parameter --name "/talent-app/dev/nextauth-secret" \
         --value "$(openssl rand -base64 32)" --type SecureString --overwrite

    2. Add your EC2 public IP to Cognito callbacks:
       Update ec2_public_ip in terraform.tfvars, then run terraform apply again.

    3. Add GitHub Secrets (Settings → Secrets → Actions):
       AWS_ROLE_ARN          = ${module.iam.github_actions_role_arn}
       ECR_REPOSITORY_URL    = ${module.ecr.repository_url}
       EC2_INSTANCE_ID       = ${module.ec2.instance_id}
       AUTH_COGNITO_ID       = ${module.cognito.client_id}
       AUTH_COGNITO_ISSUER   = ${module.cognito.issuer_url}
       DYNAMODB_TABLE_NAME   = ${module.dynamodb.table_name}
       AWS_REGION            = us-east-1

    4. Push to main branch → GitHub Actions deploys automatically!

    5. Visit your app: http://${module.ec2.public_ip}
  EOT
}
