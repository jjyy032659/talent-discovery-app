# ============================================================
# DynamoDB Module - Variables
#
# WHY DynamoDB over other databases?
#
# | Service              | Free Tier              | Min Cost/mo | Type       |
# |----------------------|------------------------|-------------|------------|
# | DynamoDB (on-demand) | 25GB, 25RCU/25WCU ∞   | $0          | NoSQL      |
# | RDS PostgreSQL       | 750h t3.micro (1yr)    | ~$13        | Relational |
# | Aurora Serverless v2 | None                   | ~$43        | Relational |
# | MongoDB Atlas        | 512MB shared           | $0 (limited)| Document   |
# | PlanetScale          | 5GB                    | $0 (limited)| MySQL      |
#
# DynamoDB wins here because:
# 1. ALWAYS FREE tier: 25GB storage, 25 RCU/WCU — never expires
# 2. Truly serverless: scales to zero cost, scales to millions of ops
# 3. Single-table design: one table handles all our data patterns
# 4. Managed: no patching, backups, replication to manage
# 5. AWS-native: IAM auth, no connection strings to manage
# 6. Learning: DynamoDB is used by Amazon.com, Lyft, Airbnb
#
# TRADEOFFS:
# - No SQL: can't do complex JOINs (design around this with access patterns)
# - Learning curve: key design is critical — done right here with examples
# ============================================================

variable "app_name" {
  type = string
}

variable "environment" {
  type = string
}

variable "billing_mode" {
  description = <<-EOT
    PAY_PER_REQUEST: Pay per read/write operation — perfect for variable traffic.
    PROVISIONED: Pre-allocate capacity — better for predictable high traffic.
    Use PAY_PER_REQUEST for portfolio/dev — no minimum cost!
  EOT
  type    = string
  default = "PAY_PER_REQUEST"
}

variable "enable_point_in_time_recovery" {
  description = <<-EOT
    PITR: Restore table to any point in the last 35 days.
    FREE — always enable it! Protects against accidental deletes.
  EOT
  type    = bool
  default = true
}
