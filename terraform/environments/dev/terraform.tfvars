# ============================================================
# Dev Environment - Terraform Variable Values
# Non-sensitive values only! Secrets go in SSM Parameter Store.
# ============================================================

aws_region    = "ap-southeast-2"
app_name      = "talent-app"
environment   = "dev"
instance_type = "t3.micro"  # Change to t2.micro to use free tier!

ec2_public_ip    = "13.238.83.125"
domain_name      = "talentdiscovery.xyz"
google_client_id = "884309402034-9qlkm1mdiap0cr8skbk0to1r1p1iuoar.apps.googleusercontent.com"
