# ============================================================
# Cognito Module - Main
#
# Creates:
# 1. User Pool — the database of users (credentials, attributes)
# 2. User Pool Client — OAuth2 app config (like an OAuth "app")
# 3. User Pool Domain — hosted login UI URL
#
# COGNITO CONCEPTS:
# - User Pool: Think of it as a users table + auth service
# - Identity Pool: Maps Cognito users to IAM roles (for direct AWS access)
#   (We don't use Identity Pool — our app calls AWS via server-side SDK)
# - User Pool Client: OAuth2 "application" — defines allowed flows, URLs
# - User Pool Domain: Cognito-hosted login page (no UI to build!)
# ============================================================

# ----- USER POOL -----
resource "aws_cognito_user_pool" "main" {
  name = "${var.app_name}-${var.environment}-users"

  # ----- PASSWORD POLICY -----
  # Enforce reasonable security without being annoying
  password_policy {
    minimum_length                   = 8
    require_uppercase                = true
    require_lowercase                = true
    require_numbers                  = true
    require_symbols                  = false  # Symbols often cause UX issues
    temporary_password_validity_days = 7
  }

  # ----- USER ATTRIBUTES -----
  # email is the primary login identifier (username alternative)
  username_attributes = ["email"]

  # Auto-verify email addresses (Cognito sends verification code)
  auto_verified_attributes = ["email"]

  # ----- EMAIL VERIFICATION -----
  # COGNITO_DEFAULT: Uses Cognito's SES for email (free but limited branding)
  # DEVELOPER: Uses your own SES sending identity (custom from address)
  # For learning: COGNITO_DEFAULT is fine. Production: use custom SES.
  email_configuration {
    email_sending_account = "COGNITO_DEFAULT"
  }

  # ----- ACCOUNT RECOVERY -----
  # Allow users to reset password via email
  account_recovery_setting {
    recovery_mechanism {
      name     = "verified_email"
      priority = 1
    }
  }

  # ----- SCHEMA: CUSTOM ATTRIBUTES -----
  # You can add custom attributes to store extra user data.
  # Standard attributes (email, name, etc.) are available by default.
  # Custom attrs must be prefixed with custom: in the API.
  schema {
    name                     = "email"
    attribute_data_type      = "String"
    required                 = true
    mutable                  = true
    developer_only_attribute = false
    string_attribute_constraints {
      min_length = 0
      max_length = 2048
    }
  }

  # ----- MFA (Multi-Factor Auth) -----
  # OFF: No MFA (simplest for dev/learning)
  # OPTIONAL: User can enable MFA (good for production)
  # REQUIRED: All users must use MFA (enterprise)
  mfa_configuration = "OFF"

  # ----- USER POOL DELETION PROTECTION -----
  # Prevents accidental deletion of the user pool (and all users!)
  deletion_protection = "INACTIVE"  # Set to ACTIVE in production!

  tags = {
    Name        = "${var.app_name}-${var.environment}-user-pool"
    Environment = var.environment
    ManagedBy   = "terraform"
  }
}

# ----- USER POOL CLIENT -----
# This is the OAuth2 "application" config.
# Each client gets its own client_id and optionally client_secret.
# Our Next.js app uses one client. A mobile app would use a separate client.
resource "aws_cognito_user_pool_client" "app" {
  name         = "${var.app_name}-${var.environment}-nextjs"
  user_pool_id = aws_cognito_user_pool.main.id

  # Generate a client secret (needed for server-side OAuth2 code flow)
  # Server-side apps SHOULD use a secret (unlike SPAs where it can't be hidden)
  generate_secret = true

  # ----- TOKEN VALIDITY -----
  # How long each token type is valid
  access_token_validity  = 1    # hours — short for security
  id_token_validity      = 1    # hours
  refresh_token_validity = 30   # days — allows "remember me"

  token_validity_units {
    access_token  = "hours"
    id_token      = "hours"
    refresh_token = "days"
  }

  # ----- OAUTH2 CONFIGURATION -----
  # Authorization Code flow: most secure for web apps
  # 1. User clicks login → Cognito hosted UI
  # 2. User authenticates → Cognito redirects with ?code=XYZ
  # 3. Server exchanges code for tokens (using client secret)
  # This keeps tokens server-side — never exposed to browser
  allowed_oauth_flows                  = ["code"]
  allowed_oauth_flows_user_pool_client = true
  allowed_oauth_scopes                 = ["email", "openid", "profile"]

  callback_urls = var.callback_urls
  logout_urls   = var.logout_urls

  # Which identity providers are supported
  # COGNITO = native Cognito login (email/password)
  # Add "Google", "Facebook", etc. to enable social login later
  supported_identity_providers = ["COGNITO"]

  # Prevent user existence errors — don't tell attackers if email exists
  prevent_user_existence_errors = "ENABLED"

  # Read and write access to standard user attributes
  read_attributes  = ["email", "email_verified", "name", "preferred_username"]
  write_attributes = ["email", "name", "preferred_username"]
}

# ----- USER POOL DOMAIN -----
# Gives Cognito a URL for its hosted login UI:
# https://<domain>.auth.<region>.amazoncognito.com
#
# WHY a hosted UI? Zero frontend work for auth pages!
# Cognito handles: sign up, sign in, forgot password, MFA.
# You can customize colors/logo. For custom domains, you need ACM cert.
resource "aws_cognito_user_pool_domain" "main" {
  domain       = "${var.app_name}-${var.environment}"  # Must be globally unique!
  user_pool_id = aws_cognito_user_pool.main.id
}
