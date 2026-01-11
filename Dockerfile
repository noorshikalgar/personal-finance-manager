# =========================
# STAGE 1: Build
# =========================
FROM node:22-slim AS builder

RUN apt-get update && apt-get install -y \
    openssl \
    python3 \
    make \
    g++ \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Copy only what is needed first (better caching)
COPY package.json package-lock.json ./
COPY prisma ./prisma/

# IMPORTANT: install deps INSIDE builder
RUN npm ci

# Copy rest of the app
COPY . .

# Generate prisma client
RUN npx prisma generate

# Build Next.js (Turbopack / Tailwind native deps are correct now)
ENV NEXT_TELEMETRY_DISABLED=1
RUN npm run build


# =========================
# STAGE 2: Runtime
# =========================
FROM node:22-slim AS runner

WORKDIR /app
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

# Non-root user
RUN groupadd --system --gid 1001 nodejs \
 && useradd --system --uid 1001 nextjs

# Copy only what runtime needs
COPY --from=builder /app/public ./public
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static

USER nextjs

EXPOSE 3000
ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

CMD ["node", "server.js"]
