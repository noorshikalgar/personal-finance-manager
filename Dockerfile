# =========================
# STAGE 1: Builder (with Prisma)
# =========================
FROM node:22-slim AS builder

RUN apt-get update && apt-get install -y \
    openssl \
    python3 \
    make \
    g++ \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Copy lockfiles first for cache
COPY package.json package-lock.json ./
COPY prisma ./prisma/

# Install deps (Prisma + Tailwind native deps)
RUN npm ci

# Copy app source
COPY . .

# Generate Prisma client
RUN npx prisma generate

# Build Next.js (disable turbo to avoid lightningcss native issues)
ENV NEXT_TELEMETRY_DISABLED=1
RUN NEXT_DISABLE_TURBOPACK=1 npm run build


# =========================
# STAGE 2: Runtime (includes Prisma CLI for migrations)
# =========================
FROM node:22-slim AS runner

RUN apt-get update && apt-get install -y \
    openssl \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

# Non-root user
RUN groupadd --system --gid 1001 nodejs \
 && useradd --system --uid 1001 nextjs

# Copy Next.js standalone output
COPY --from=builder /app/public ./public
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static

# 🔑 COPY PRISMA (required for migrate deploy)
COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/prisma.config.ts ./prisma.config.ts

USER nextjs

EXPOSE 3000
ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

# 🔥 Run migrations, then start app
CMD ["sh", "-c", "./node_modules/.bin/prisma migrate deploy && node server.js"]
