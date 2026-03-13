output "table_name" {
  description = "DynamoDB table name — pass as DYNAMODB_TABLE_NAME env var"
  value       = aws_dynamodb_table.main.name
}

output "table_arn" {
  description = "DynamoDB table ARN — used in IAM policies to grant access"
  value       = aws_dynamodb_table.main.arn
}
