# syntax=docker/dockerfile:1

# 1. Base stage for shared Node alpine configuration
FROM node:20-alpine AS base

# 2. Dependencies stage: install packages based on package-lock.json
FROM base AS deps
# Check https://github.com/nodejs/docker-node/tree/b4117f9333da4138b03a546ec926ef50a31506c3#nodealpine to understand why libc6-compat might be needed.
RUN apk add --no-cache libc6-compat
WORKDIR /app

# Copy package manifests
COPY package.json package-lock.json* ./

# Clean install of all dependencies
RUN npm ci

# 3. Builder stage: compile the Next.js application
FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Disable Next.js telemetry during build
ENV NEXT_TELEMETRY_DISABLED=1

# Run production build (outputs to .next/standalone due to next.config.ts)
RUN npm run build

# 4. Production runner stage
FROM base AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

# Create a non-root group and user for security
RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 nextjs

# Copy static assets from public folder
COPY --from=builder /app/public ./public

# Prepare .next directory and ensure appropriate write permissions for Next.js cache
RUN mkdir -p .next && chown nextjs:nodejs .next

# Copy standalone build and static assets from builder stage
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

# Switch to non-root user
USER nextjs

EXPOSE 3000

# Start Next.js standalone server
CMD ["node", "server.js"]
