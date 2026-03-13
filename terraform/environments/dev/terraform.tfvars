# ============================================================
# Dev Environment - Terraform Variable Values
# Non-sensitive values only! Secrets go in SSM Parameter Store.
# ============================================================

aws_region    = "us-east-1"
app_name      = "talent-app"
environment   = "dev"
instance_type = "t3.micro"  # Change to t2.micro to use free tier!

# STEP 2 (after first apply): Update with your Elastic IP
# ec2_public_ip = "54.123.45.67"
