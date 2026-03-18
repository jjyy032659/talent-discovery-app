# ============================================================
# Cognito Module - Variables
#
# WHY Amazon Cognito for Auth?
#
# | Service        | Free Tier    | Price After         | AWS Native |
# |----------------|--------------|---------------------|------------|
# | Cognito        | 50,000 MAU   | $0.0055/MAU         | ✅ Yes     |
# | Auth0          | 7,500 MAU    | $23+/month          | ❌ No      |
# | Firebase Auth  | Unlimited    | Free (Google lock-in)| ❌ No     |
# | Supabase Auth  | 50,000 MAU   | $25+/month          | ❌ No      |
#
# Cognito wins for this project because:
# 1. 50,000 MAUs free — more than enough for a portfolio project
# 2. AWS-native: no extra network hops, IAM integration built-in
# 3. Features: MFA, social login (Google, Facebook), SAML, OIDC
# 4. JWT tokens work seamlessly with DynamoDB row-level security
# 5. Learning: Cognito is used at massive scale (Amazon.com uses it)
# ============================================================

variable "app_name" {
  type = string
}

variable "environment" {
  type = string
}

variable "callback_urls" {
  description = <<-EOT
    OAuth2 callback URLs after successful login.
    Must include BOTH local dev and production URLs.
    Cognito validates the redirect_uri against this list.
    Format: https://yourdomain.com/api/auth/callback/cognito
  EOT
  type    = list(string)
  default = ["http://localhost:3000/api/auth/callback/cognito"]
}

variable "logout_urls" {
  description = "URLs to redirect to after logout"
  type        = list(string)
  default     = ["http://localhost:3000"]
}

variable "allow_self_registration" {
  description = "Allow users to sign up themselves (vs admin-only creation)"
  type        = bool
  default     = true
}

variable "google_client_id" {
  description = "Google OAuth client ID for Cognito federation"
  type        = string
  default     = ""
}

variable "google_client_secret" {
  description = "Google OAuth client secret for Cognito federation"
  type        = string
  default     = ""
  sensitive   = true
}
