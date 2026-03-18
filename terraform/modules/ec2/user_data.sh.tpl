#!/bin/bash
# ============================================================
# EC2 User Data Script
# This script runs AUTOMATICALLY on first boot of the EC2 instance.
# It sets up the entire server environment.
#
# HOW IT WORKS:
# - AWS injects this script via cloud-init (built into Amazon Linux)
# - It runs as root once, on first launch
# - Logs go to: /var/log/cloud-init-output.log
# - Debug: sudo cat /var/log/cloud-init-output.log
# ============================================================

# Exit immediately if any command fails. 'x' logs each command.
set -euxo pipefail

# ----- SYSTEM UPDATE -----
# Always update first — security patches, bug fixes
echo "==> Updating system packages..."
yum update -y

# ----- INSTALL DOCKER -----
# Docker is our container runtime.
# WHY Docker? Guarantees the app runs identically in dev and prod.
# "Works on my machine" ❌ → Docker container ✅
echo "==> Installing Docker..."
yum install -y docker
systemctl start docker
systemctl enable docker  # Start Docker on every boot
usermod -aG docker ec2-user  # Allow ec2-user to run docker without sudo

# ----- INSTALL NGINX -----
# Nginx is a reverse proxy that sits in front of our Next.js app.
# WHY Nginx?
# 1. SSL termination — handles HTTPS so Node.js doesn't have to
# 2. Static file serving — serves public/ files faster
# 3. Connection handling — manages thousands of connections better
# 4. Request buffering — protects Node.js from slow clients
# 5. Load balancing — if you add more EC2 instances later
echo "==> Installing nginx..."
yum install -y nginx
systemctl start nginx
systemctl enable nginx

# ----- CONFIGURE NGINX -----
# Nginx reverse proxy: internet → nginx:80 → next.js:3000
cat > /etc/nginx/conf.d/talent-app.conf << 'NGINX_EOF'
server {
    listen 80;
    server_name ${domain_name} www.${domain_name};

    # Increase for large request bodies (Next.js SSR pages)
    client_max_body_size 10M;

    # Proxy all requests to Next.js running on port 3000
    location / {
        proxy_pass http://127.0.0.1:3000;

        # HTTP/1.1 required for WebSocket support (hot reload, streaming)
        proxy_http_version 1.1;

        # Upgrade headers for WebSocket connections
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';

        # Pass real client IP to Next.js (for logging, rate limiting)
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;

        # Don't use cache for dynamic content
        proxy_cache_bypass $http_upgrade;

        # Timeout settings for long-running AI requests
        proxy_read_timeout 120s;
        proxy_send_timeout 120s;
    }

    # Health check endpoint for monitoring/ALB
    location /health {
        access_log off;
        return 200 "OK\n";
        add_header Content-Type text/plain;
    }
}
NGINX_EOF

# Test nginx config before reloading
nginx -t && systemctl reload nginx

# ----- LOGIN TO ECR -----
# The EC2 IAM role has ECR read permissions (set in IAM module).
# No credentials needed — AWS handles auth via the instance role!
# This is WHY IAM roles are better than hardcoded credentials.
echo "==> Logging into ECR..."
aws ecr get-login-password --region ${aws_region} | \
  docker login --username AWS --password-stdin ${ecr_registry_url}

# ----- PULL INITIAL IMAGE (if available) -----
# On first boot, there might not be an image yet (chicken-and-egg).
# The first GitHub Actions deploy will run the actual container.
echo "==> Pulling app image (may fail on first boot — that's OK)..."
docker pull ${ecr_registry_url}/${ecr_repo_name}:latest || echo "No image yet, skipping..."

# ----- GET SECRETS FROM SSM PARAMETER STORE -----
# WHY SSM Parameter Store instead of hardcoding?
# 1. Security: secrets never in code, logs, or Terraform state
# 2. Rotation: update secret in SSM, re-deploy without code change
# 3. Audit: CloudTrail logs every secret access
# 4. Cost: FREE for standard parameters (vs $0.40/month for Secrets Manager)
#
# SSM vs Secrets Manager:
# - SSM Standard: FREE, good for config + secrets < 4KB
# - Secrets Manager: $0.40/secret/month, adds auto-rotation, cross-account
# - USE SSM for this project (free), consider Secrets Manager for production
echo "==> Fetching secrets from SSM..."
GEMINI_API_KEY=$(aws ssm get-parameter \
  --name "${app_name}-${environment}-gemini-api-key" \
  --with-decryption \
  --query Parameter.Value \
  --output text) || GEMINI_API_KEY="placeholder"

AUTH_SECRET=$(aws ssm get-parameter \
  --name "${app_name}-${environment}-nextauth-secret" \
  --with-decryption \
  --query Parameter.Value \
  --output text) || AUTH_SECRET="placeholder"

AUTH_COGNITO_SECRET=$(aws ssm get-parameter \
  --name "${app_name}-${environment}-cognito-client-secret" \
  --with-decryption \
  --query Parameter.Value \
  --output text) || AUTH_COGNITO_SECRET=""

# ----- START APP CONTAINER -----
if docker image inspect ${ecr_registry_url}/${ecr_repo_name}:latest >/dev/null 2>&1; then
  echo "==> Starting app container..."
  docker run -d \
    --name talent-app \
    --restart unless-stopped \
    -p 3000:3000 \
    -e GEMINI_API_KEY="$GEMINI_API_KEY" \
    -e AUTH_SECRET="$AUTH_SECRET" \
    -e AUTH_COGNITO_ID="${cognito_client_id}" \
    -e AUTH_COGNITO_SECRET="$AUTH_COGNITO_SECRET" \
    -e AUTH_COGNITO_ISSUER="https://cognito-idp.${aws_region}.amazonaws.com/${cognito_user_pool_id}" \
    -e AWS_REGION="${aws_region}" \
    -e DYNAMODB_TABLE_NAME="${dynamodb_table_name}" \
    -e NODE_ENV="production" \
    -e PORT="3000" \
    -e AUTH_TRUST_HOST="true" \
    -e AUTH_URL="https://${domain_name}" \
    ${ecr_registry_url}/${ecr_repo_name}:latest
fi

# ----- CREATE DEPLOYMENT SCRIPT -----
# GitHub Actions SSM-executes this script for each deploy.
# It pulls the latest image and hot-swaps the container (zero downtime ≈).
cat > /home/ec2-user/deploy.sh << 'DEPLOY_EOF'
#!/bin/bash
set -euxo pipefail

ECR_REGISTRY="${ecr_registry_url}"
ECR_REPO="${ecr_repo_name}"
IMAGE="$ECR_REGISTRY/$ECR_REPO:latest"
APP_NAME="${app_name}"
ENV="${environment}"
REGION="${aws_region}"

echo "==> [deploy] Logging into ECR..."
aws ecr get-login-password --region "$REGION" | \
  docker login --username AWS --password-stdin "$ECR_REGISTRY"

echo "==> [deploy] Pulling latest image..."
docker pull "$IMAGE"

echo "==> [deploy] Getting latest secrets..."
GEMINI_API_KEY=$(aws ssm get-parameter \
  --name "$APP_NAME-$ENV-gemini-api-key" \
  --with-decryption --query Parameter.Value --output text)

AUTH_SECRET=$(aws ssm get-parameter \
  --name "$APP_NAME-$ENV-nextauth-secret" \
  --with-decryption --query Parameter.Value --output text)

AUTH_COGNITO_SECRET=$(aws ssm get-parameter \
  --name "$APP_NAME-$ENV-cognito-client-secret" \
  --with-decryption --query Parameter.Value --output text)

echo "==> [deploy] Stopping old container..."
docker stop talent-app 2>/dev/null || true
docker rm   talent-app 2>/dev/null || true

echo "==> [deploy] Starting new container..."
docker run -d \
  --name talent-app \
  --restart unless-stopped \
  -p 3000:3000 \
  -e GEMINI_API_KEY="$GEMINI_API_KEY" \
  -e AUTH_SECRET="$AUTH_SECRET" \
  -e AUTH_COGNITO_ID="${cognito_client_id}" \
  -e AUTH_COGNITO_SECRET="$AUTH_COGNITO_SECRET" \
  -e AUTH_COGNITO_ISSUER="https://cognito-idp.${aws_region}.amazonaws.com/${cognito_user_pool_id}" \
  -e AWS_REGION="${aws_region}" \
  -e DYNAMODB_TABLE_NAME="${dynamodb_table_name}" \
  -e NODE_ENV="production" \
  -e PORT="3000" \
  -e AUTH_TRUST_HOST="true" \
  -e AUTH_URL="https://${domain_name}" \
  "$IMAGE"

echo "==> [deploy] Cleaning up old images..."
docker image prune -f

echo "==> [deploy] Done! App is running."
DEPLOY_EOF

chmod +x /home/ec2-user/deploy.sh
chown ec2-user:ec2-user /home/ec2-user/deploy.sh

echo "==> EC2 setup complete!"
