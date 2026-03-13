# ============================================================
# DynamoDB Module - Main
#
# DATA MODEL (Single-Table Design):
# One DynamoDB table handles ALL data — no JOINs needed,
# each access pattern is served by a specific key combination.
#
# TABLE STRUCTURE:
# PK (Partition Key) = identifies the "entity type + ID"
# SK (Sort Key)      = identifies the "record within that entity"
#
# ITEMS:
# | PK                  | SK                    | Description           |
# |---------------------|----------------------|-----------------------|
# | USER#<cognitoSub>   | PROFILE              | User account info     |
# | USER#<cognitoSub>   | ASSESSMENT#IKIGAI    | Ikigai analysis data  |
# | USER#<cognitoSub>   | ASSESSMENT#SCENARIO  | Scenario test scores  |
# | USER#<cognitoSub>   | ASSESSMENT#ANTITALENT| Anti-talent results   |
# | USER#<cognitoSub>   | TALENT_PROFILE       | Aggregated dimensions |
# | USER#<cognitoSub>   | ROADMAP              | Generated markdown    |
#
# ACCESS PATTERNS:
# 1. Get all data for a user:
#    Query: PK = "USER#<id>"  → returns all 6 items
# 2. Get specific assessment:
#    GetItem: PK = "USER#<id>", SK = "ASSESSMENT#IKIGAI"
# 3. Update talent profile:
#    PutItem: PK = "USER#<id>", SK = "TALENT_PROFILE"
# ============================================================

resource "aws_dynamodb_table" "main" {
  name         = "${var.app_name}-${var.environment}"
  billing_mode = var.billing_mode

  # ----- PRIMARY KEY -----
  # hash_key = Partition Key (PK): determines which partition holds the data
  # range_key = Sort Key (SK): allows range queries within a partition
  hash_key  = "PK"
  range_key = "SK"

  # Define the attributes used in keys (only key attributes defined here;
  # all other attributes are schema-free — add any fields you want!)
  attribute {
    name = "PK"
    type = "S"  # S = String, N = Number, B = Binary
  }

  attribute {
    name = "SK"
    type = "S"
  }

  # ----- POINT-IN-TIME RECOVERY -----
  # Allows restoring the table to any second in the last 35 days.
  # Essential protection against bugs that corrupt/delete data.
  # Cost: FREE (only pay for the restored table storage)
  point_in_time_recovery {
    enabled = var.enable_point_in_time_recovery
  }

  # ----- SERVER-SIDE ENCRYPTION -----
  # Encrypt all data at rest using AWS-managed KMS key (free).
  # For stricter compliance, use customer-managed KMS key ($1/key/month).
  server_side_encryption {
    enabled = true
  }

  # ----- TTL (Time-To-Live) -----
  # Automatically delete items after a set time.
  # Example: session data expires after 24h, temp tokens after 1h.
  # Cost: FREE — DynamoDB deletes TTL items at no charge.
  ttl {
    attribute_name = "ttl"  # Items with this numeric attribute will be auto-deleted
    enabled        = true
  }

  tags = {
    Name        = "${var.app_name}-${var.environment}"
    Environment = var.environment
    ManagedBy   = "terraform"
  }
}
