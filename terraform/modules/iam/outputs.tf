output "ec2_instance_profile_name" {
  description = "EC2 instance profile name — attach to aws_instance resource"
  value       = aws_iam_instance_profile.ec2.name
}

output "ec2_role_arn" {
  description = "EC2 IAM role ARN"
  value       = aws_iam_role.ec2.arn
}

output "github_actions_role_arn" {
  description = <<-EOT
    GitHub Actions IAM role ARN.
    Add this to GitHub Secrets as AWS_ROLE_ARN.
    GitHub Actions will assume this role via OIDC.
  EOT
  value = aws_iam_role.github_actions.arn
}
