# ============================================================
# VPC Module - Main
#
# WHY VPC?
# Without a VPC your resources would be in a shared network.
# A VPC gives you isolation, custom routing, and security groups.
# Every AWS account gets a default VPC but creating a custom one
# teaches you networking and is best practice for real projects.
#
# ARCHITECTURE:
#   Internet
#      ↓
#   Internet Gateway (IGW) — the VPC's front door to the internet
#      ↓
#   Public Subnets (us-east-1a, us-east-1b)
#   └── EC2 instance (our web server)
#      ↓ (if needed via NAT Gateway)
#   Private Subnets (us-east-1a, us-east-1b)
#   └── (future: RDS, ElastiCache, etc.)
# ============================================================

# ----- VPC -----
resource "aws_vpc" "main" {
  cidr_block = var.vpc_cidr

  # enable_dns_hostnames: gives EC2 instances DNS names like
  # ec2-54-123-45-67.compute-1.amazonaws.com
  # Required for ECS, EKS, and some AWS service integrations
  enable_dns_hostnames = true
  enable_dns_support   = true

  tags = {
    Name        = "${var.app_name}-${var.environment}-vpc"
    Environment = var.environment
    ManagedBy   = "terraform"
  }
}

# ----- INTERNET GATEWAY -----
# The IGW is the bridge between your VPC and the public internet.
# Without it, nothing in your VPC can reach or be reached from internet.
# One IGW per VPC — it's highly available by default (AWS manages it).
resource "aws_internet_gateway" "main" {
  vpc_id = aws_vpc.main.id

  tags = {
    Name        = "${var.app_name}-${var.environment}-igw"
    Environment = var.environment
    ManagedBy   = "terraform"
  }
}

# ----- PUBLIC SUBNETS -----
# Subnets divide your VPC's IP space across Availability Zones.
# Availability Zones = physically separate data centers in a region.
# count = number of subnets to create (one per AZ)
resource "aws_subnet" "public" {
  count = length(var.public_subnet_cidrs)

  vpc_id            = aws_vpc.main.id
  cidr_block        = var.public_subnet_cidrs[count.index]
  availability_zone = var.availability_zones[count.index]

  # map_public_ip_on_launch: automatically assign a public IP to
  # any EC2 instance launched in this subnet — needed for our web server
  map_public_ip_on_launch = true

  tags = {
    Name        = "${var.app_name}-${var.environment}-public-${count.index + 1}"
    Environment = var.environment
    Tier        = "public"
    ManagedBy   = "terraform"
  }
}

# ----- PRIVATE SUBNETS -----
# Private subnets for internal services (no direct internet access).
# Best practice: databases, internal APIs always go in private subnets.
resource "aws_subnet" "private" {
  count = length(var.private_subnet_cidrs)

  vpc_id            = aws_vpc.main.id
  cidr_block        = var.private_subnet_cidrs[count.index]
  availability_zone = var.availability_zones[count.index]

  # No public IPs — resources here are truly private
  map_public_ip_on_launch = false

  tags = {
    Name        = "${var.app_name}-${var.environment}-private-${count.index + 1}"
    Environment = var.environment
    Tier        = "private"
    ManagedBy   = "terraform"
  }
}

# ----- PUBLIC ROUTE TABLE -----
# A route table is a set of rules (routes) that determine where
# network traffic from your subnet is directed.
resource "aws_route_table" "public" {
  vpc_id = aws_vpc.main.id

  # Route all outbound traffic (0.0.0.0/0 = "everything") to the IGW.
  # This is what makes a subnet "public" — it can reach the internet.
  route {
    cidr_block = "0.0.0.0/0"
    gateway_id = aws_internet_gateway.main.id
  }

  tags = {
    Name        = "${var.app_name}-${var.environment}-public-rt"
    Environment = var.environment
    ManagedBy   = "terraform"
  }
}

# Associate each public subnet with the public route table
resource "aws_route_table_association" "public" {
  count = length(aws_subnet.public)

  subnet_id      = aws_subnet.public[count.index].id
  route_table_id = aws_route_table.public.id
}

# ----- SECURITY GROUP: ALB / Web -----
# Security Groups are stateful firewalls for AWS resources.
# "Stateful" means: if you allow inbound traffic, the response
# is automatically allowed outbound (no need to write both rules).
#
# WHY separate SG for web traffic?
# Separation of concerns — if we add an ALB later, it gets its own
# SG and the EC2 SG only allows traffic FROM the ALB.
resource "aws_security_group" "web" {
  name        = "${var.app_name}-${var.environment}-web-sg"
  description = "Allow HTTP and HTTPS inbound traffic from internet"
  vpc_id      = aws_vpc.main.id

  # Allow HTTP (port 80) from anywhere — nginx handles this
  ingress {
    description = "HTTP from internet"
    from_port   = 80
    to_port     = 80
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }

  # Allow HTTPS (port 443) from anywhere — for future SSL
  ingress {
    description = "HTTPS from internet"
    from_port   = 443
    to_port     = 443
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }

  # Allow all outbound — EC2 needs to pull images from ECR,
  # call AWS APIs, download packages, etc.
  egress {
    description = "All outbound traffic"
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = {
    Name        = "${var.app_name}-${var.environment}-web-sg"
    Environment = var.environment
    ManagedBy   = "terraform"
  }
}

# ----- SECURITY GROUP: EC2 instance -----
# This is tighter — only allows web traffic + SSH for management.
resource "aws_security_group" "ec2" {
  name        = "${var.app_name}-${var.environment}-ec2-sg"
  description = "Security group for EC2 instance"
  vpc_id      = aws_vpc.main.id

  # Allow HTTP from web SG (or directly from internet for simplicity)
  ingress {
    description = "HTTP from internet via nginx"
    from_port   = 80
    to_port     = 80
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }

  ingress {
    description = "HTTPS from internet"
    from_port   = 443
    to_port     = 443
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }

  # NOTE: We use SSM Session Manager instead of SSH for deployments.
  # This means port 22 does NOT need to be open — more secure!
  # SSM works over HTTPS (443) which is already open via egress.
  # Uncomment below ONLY if you need direct SSH access for debugging:
  # ingress {
  #   description = "SSH for debugging only"
  #   from_port   = 22
  #   to_port     = 22
  #   protocol    = "tcp"
  #   cidr_blocks = ["YOUR_IP/32"]  # Restrict to your IP only!
  # }

  egress {
    description = "All outbound traffic for ECR, SSM, APIs"
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = {
    Name        = "${var.app_name}-${var.environment}-ec2-sg"
    Environment = var.environment
    ManagedBy   = "terraform"
  }
}
