# ============================================================
# VPC Module - Outputs
# Outputs expose values from this module to the parent module.
# Other modules (ec2, rds, etc.) need these IDs to place
# resources inside this VPC.
# ============================================================

output "vpc_id" {
  description = "ID of the VPC — used by all other modules"
  value       = aws_vpc.main.id
}

output "public_subnet_ids" {
  description = "List of public subnet IDs for EC2 and ALB placement"
  value       = aws_subnet.public[*].id
}

output "private_subnet_ids" {
  description = "List of private subnet IDs for future DB/cache resources"
  value       = aws_subnet.private[*].id
}

output "ec2_security_group_id" {
  description = "Security group ID to attach to EC2 instances"
  value       = aws_security_group.ec2.id
}

output "web_security_group_id" {
  description = "Security group ID for web-facing resources"
  value       = aws_security_group.web.id
}
