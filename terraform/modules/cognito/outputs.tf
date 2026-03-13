output "user_pool_id" {
  description = "Cognito User Pool ID — used to build the OIDC issuer URL"
  value       = aws_cognito_user_pool.main.id
}

output "user_pool_arn" {
  description = "Cognito User Pool ARN — used in IAM policies"
  value       = aws_cognito_user_pool.main.arn
}

output "client_id" {
  description = "OAuth2 Client ID — public, goes in AUTH_COGNITO_ID env var"
  value       = aws_cognito_user_pool_client.app.id
}

output "client_secret" {
  description = "OAuth2 Client Secret — sensitive! Goes in SSM Parameter Store"
  value       = aws_cognito_user_pool_client.app.client_secret
  sensitive   = true  # Terraform won't print this in logs
}

output "issuer_url" {
  description = <<-EOT
    OIDC Issuer URL for next-auth Cognito provider.
    Format: https://cognito-idp.<region>.amazonaws.com/<pool-id>
    Used as AUTH_COGNITO_ISSUER environment variable.
  EOT
  value = "https://cognito-idp.${data.aws_region.current.name}.amazonaws.com/${aws_cognito_user_pool.main.id}"
}

output "hosted_ui_domain" {
  description = "Cognito hosted login UI base URL"
  value       = "https://${aws_cognito_user_pool_domain.main.domain}.auth.${data.aws_region.current.name}.amazoncognito.com"
}

data "aws_region" "current" {}
