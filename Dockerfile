FROM node:20-bookworm-slim AS base
RUN apt-get update && apt-get install -y openssl ca-certificates libc6 && rm -rf /var/lib/apt/lists/*
WORKDIR /app

# --- STAGE 1: Build ---
FROM base AS builder
COPY package.json package-lock.json* ./
# We install EVERYTHING here to ensure builds/migrations have all tools
RUN npm ci --include=optional
COPY . .
RUN npx prisma generate
RUN npm run build

# --- STAGE 2: Runner ---
FROM base AS runner
WORKDIR /app

# Create user with home directory
RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 --home /home/nextjs nextjs

# Set up NPM cache directory for the user so npx doesn't fail
ENV NPM_CONFIG_CACHE=/home/nextjs/.npm
ENV NEXT_TELEMETRY_DISABLED=1
ENV NODE_ENV=production

# Copy standalone build
COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static
COPY --from=builder --chown=nextjs:nodejs /app/prisma ./prisma

# Instead of copying node_modules, we rely on the fact that Prisma CLI 
# is actually needed for migrations. standalone mode removes it.
# So we copy the Prisma CLI back in one go.
COPY --from=builder --chown=nextjs:nodejs /app/node_modules/prisma ./node_modules/prisma
COPY --from=builder --chown=nextjs:nodejs /app/node_modules/@prisma ./node_modules/@prisma
# This is the "missing" stuff from your error:
COPY --from=builder --chown=nextjs:nodejs /app/node_modules/valibot ./node_modules/valibot

USER nextjs

# The CMD now uses npx but it will WORK because:
# 1. The user has a /home/nextjs directory to cache things
# 2. We provided the local node_modules it was missing
CMD npx prisma migrate deploy && node server.js