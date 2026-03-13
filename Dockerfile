# ============================================================
# Multi-Stage Dockerfile for Next.js App
#
# WHY MULTI-STAGE?
# Stage 1 (deps): Install dependencies → large node_modules
# Stage 2 (builder): Build the app → creates .next/
# Stage 3 (runner): Only copy what's needed to RUN the app
#
# Result: Final image is ~200MB instead of ~1.5GB!
# Benefits: Faster deploys, less ECR storage cost, smaller attack surface
#
# WHY node:20-alpine?
# - alpine: 5MB base instead of 200MB for Debian-based images
# - node:20: LTS version with long-term support (security patches)
# - vs node:20-slim: alpine is even smaller but less compatible
# ============================================================

# ============================================================
# STAGE 1: Install ALL dependencies (dev + prod)
# We need devDependencies for the TypeScript build
# ============================================================
FROM node:20-alpine AS deps

# Install libc compatibility for native modules (some npm packages need glibc)
# alpine uses musl libc, this adds glibc compatibility
RUN apk add --no-cache libc6-compat

WORKDIR /app

# Copy package files FIRST (before source code)
# WHY? Docker layer caching!
# If package.json doesn't change, this layer is cached.
# Source code changes won't invalidate the npm install layer.
# This makes rebuilds MUCH faster.
COPY package.json package-lock.json ./

# npm ci = "clean install":
# - Reads package-lock.json exactly (reproducible builds!)
# - Fails if lock file doesn't match package.json
# - Faster than npm install
# - Perfect for CI/CD
RUN npm ci

# ============================================================
# STAGE 2: Build the Next.js application
# ============================================================
FROM node:20-alpine AS builder

WORKDIR /app

# Copy deps from stage 1
COPY --from=deps /app/node_modules ./node_modules

# Copy all source files
COPY . .

# Build-time environment variables
# NEXT_TELEMETRY_DISABLED: Don't send usage data to Vercel
# These are baked into the build — runtime env vars come via -e docker run
ENV NEXT_TELEMETRY_DISABLED=1
ENV NODE_ENV=production

# Build the Next.js app
# With output: 'standalone' in next.config.ts, this creates:
# .next/standalone/server.js — self-contained server
# .next/static/ — static assets
# public/ — public files
RUN npm run build

# ============================================================
# STAGE 3: Production runner (minimal image)
# Only copy what's needed to RUN — no source code, no devDeps!
# ============================================================
FROM node:20-alpine AS runner

WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

# Create a non-root user for security
# WHY? If the container is compromised, the attacker only has
# limited filesystem permissions (not root)
# This is a security best practice for all containers
RUN addgroup --system --gid 1001 nodejs && \
    adduser  --system --uid 1001 nextjs

# Copy public assets (images, favicon, etc.)
COPY --from=builder /app/public ./public

# Copy standalone server (includes only necessary dependencies)
# chown sets ownership to our non-root user
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./

# Copy static files (.next/static contains JS/CSS chunks)
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

# Switch to non-root user
USER nextjs

# Expose the port Next.js listens on
EXPOSE 3000

# Tell Next.js which host and port to listen on
ENV PORT=3000
ENV HOSTNAME="0.0.0.0"  # Listen on all interfaces, not just localhost

# Start the standalone server
# This is created by next.config.ts output: 'standalone'
CMD ["node", "server.js"]
