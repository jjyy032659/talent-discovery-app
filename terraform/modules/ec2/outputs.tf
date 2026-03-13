output "instance_id" {
  description = "EC2 instance ID — used by GitHub Actions SSM commands"
  value       = aws_instance.app.id
}

output "public_ip" {
  description = "Elastic (static) public IP of the server"
  value       = aws_eip.app.public_ip
}

output "public_dns" {
  description = "Public DNS name of the EC2 instance"
  value       = aws_instance.app.public_dns
}
