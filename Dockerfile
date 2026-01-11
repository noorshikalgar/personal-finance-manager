# Stage 1: Base
FROM node:20-bookworm-slim AS base
# Ensure openssl is available for Prisma
RUN apt-get update && apt-get install -y openssl ca-certificates && rm -rf /var/lib/apt/lists/*

# Stage 2: Dependencies
FROM base AS deps
WORKDIR /app
COPY package.json package-lock.json* ./
# Force installation of Linux-specific native binaries for Tailwind/Oxide
RUN npm ci --include=optional

# Stage 3: Builder
FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
# Generate the Prisma client during build
RUN npx prisma generate
ENV NODE_ENV=production
RUN npm run build

# Stage 4: Runner
FROM base AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

# 1. Create a user with a real home directory (Fixes the /nonexistent error)
RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 --home /home/nextjs nextjs

# 2. Copy the standalone build (the most efficient way for Next.js)
COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

# 3. Copy Prisma files specifically for the migration command
# We copy the 'prisma' engine and CLI from the builder's node_modules
COPY --from=builder --chown=nextjs:nodejs /app/prisma ./prisma
COPY --from=builder --chown=nextjs:nodejs /app/node_modules/prisma ./node_modules/prisma
COPY --from=builder --chown=nextjs:nodejs /app/node_modules/@prisma ./node_modules/@prisma

USER nextjs

EXPOSE 3000
ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

# 4. EXECUTION FIX:
# Use the locally installed prisma binary instead of 'npx'. 
# This prevents the container from trying to download Prisma or access '/nonexistent'.
CMD node node_modules/prisma/build/index.js migrate deploy && node server.js