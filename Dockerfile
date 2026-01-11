# Use Node 20 as the base for all stages
FROM node:20-bookworm-slim AS base

# --- STAGE 1: Install dependencies ---
FROM base AS deps
# Install native dependencies required for Prisma and native binaries
RUN apt-get update && apt-get install -y \
    openssl \
    ca-certificates \
    libc6 \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Copy package files
COPY package.json package-lock.json* ./

# Install ALL dependencies including optional native binaries for Linux
# We use --include=optional to ensure lightningcss/oxide binaries are pulled
RUN npm ci --include=optional

# --- STAGE 2: Build the application ---
FROM base AS builder
WORKDIR /app

# Copy node_modules from deps stage
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Generate Prisma Client
RUN npx prisma generate

# Set environment variables for build
ENV NEXT_TELEMETRY_DISABLED=1
ENV NODE_ENV=production

# Build Next.js (This will use Turbopack if configured in next.config)
RUN npm run build

# --- STAGE 3: Production Runner ---
FROM base AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

# Create a non-root user for security
RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 nextjs

# Copy built standalone folder and static files
# Note: standalone mode must be enabled in next.config.ts
COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static
COPY --from=builder /app/prisma ./prisma

# Copy Prisma binaries for the runner
COPY --from=builder /app/node_modules/.prisma ./node_modules/.prisma
COPY --from=builder /app/node_modules/@prisma ./node_modules/@prisma

USER nextjs

EXPOSE 3000

# Script to run migrations and start the server
CMD npx prisma migrate deploy && node server.js