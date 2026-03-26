# Creates a Cognito User Pool with Google federation and a hosted login UI.
# All users — email/password and Google — are stored in the same pool.

resource "aws_cognito_user_pool" "main" {
  name = "${var.app_name}-${var.environment}-users"

  password_policy {
    minimum_length                   = 8
    require_uppercase                = true
    require_lowercase                = true
    require_numbers                  = true
    require_symbols                  = false
    temporary_password_validity_days = 7
  }

  username_attributes      = ["email"]
  auto_verified_attributes = ["email"]

  email_configuration {
    email_sending_account = "COGNITO_DEFAULT"
  }

  account_recovery_setting {
    recovery_mechanism {
      name     = "verified_email"
      priority = 1
    }
  }

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

  mfa_configuration = "OFF"

  deletion_protection = "INACTIVE"

  tags = {
    Name        = "${var.app_name}-${var.environment}-user-pool"
    Environment = var.environment
    ManagedBy   = "terraform"
  }
}

# Federates Google sign-in through Cognito so both auth methods land in
# the same user pool and share the same client_id/secret.
resource "aws_cognito_identity_provider" "google" {
  count        = var.google_client_id != "" ? 1 : 0
  user_pool_id = aws_cognito_user_pool.main.id
  provider_name = "Google"
  provider_type = "Google"

  provider_details = {
    client_id                     = var.google_client_id
    client_secret                 = var.google_client_secret
    authorize_scopes              = "email profile openid"
    oidc_issuer                   = "https://accounts.google.com"
    token_url                     = "https://oauth2.googleapis.com/token"
    token_request_method          = "POST"
    authorize_url                 = "https://accounts.google.com/o/oauth2/v2/auth"
    attributes_url                = "https://people.googleapis.com/v1/people/me?personFields="
    attributes_url_add_attributes = "true"
  }

  attribute_mapping = {
    email          = "email"
    email_verified = "email_verified"
    name           = "name"
    username       = "sub"
    picture        = "picture"
  }
}

resource "aws_cognito_user_pool_client" "app" {
  name         = "${var.app_name}-${var.environment}-nextjs"
  user_pool_id = aws_cognito_user_pool.main.id

  # Server-side apps should use a client secret; SPAs cannot protect one
  generate_secret = true

  access_token_validity  = 1   # hours
  id_token_validity      = 1   # hours
  refresh_token_validity = 30  # days

  token_validity_units {
    access_token  = "hours"
    id_token      = "hours"
    refresh_token = "days"
  }

  # Authorization Code flow — Cognito redirects with ?code=, server exchanges
  # it for tokens using the client secret. Tokens stay server-side.
  allowed_oauth_flows                  = ["code"]
  allowed_oauth_flows_user_pool_client = true
  allowed_oauth_scopes                 = ["email", "openid", "profile"]

  callback_urls = var.callback_urls
  logout_urls   = var.logout_urls

  supported_identity_providers = var.google_client_id != "" ? ["COGNITO", "Google"] : ["COGNITO"]

  depends_on = [aws_cognito_identity_provider.google]

  # Prevents telling callers whether an email address exists in the pool
  prevent_user_existence_errors = "ENABLED"

  read_attributes  = ["email", "email_verified", "name", "preferred_username"]
  write_attributes = ["email", "name", "preferred_username"]
}

# Provides the hosted login UI at:
# https://<app-name>-<env>.auth.<region>.amazoncognito.com
resource "aws_cognito_user_pool_domain" "main" {
  domain       = "${var.app_name}-${var.environment}"
  user_pool_id = aws_cognito_user_pool.main.id
}
