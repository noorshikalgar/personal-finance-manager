# Stage 1: Build the application
FROM node:20-alpine AS builder
WORKDIR /usr/src/app

COPY package*.json ./
RUN npm ci --only=production=false && npm cache clean --force

COPY . .
RUN npm run build

# Stage 2: Run the application
FROM node:20-alpine AS production
# Optional: Install dumb-init for proper signal handling and curl for healthchecks
RUN apk add --no-cache dumb-init curl

WORKDIR /usr/src/app

# Create a non-root user for security
RUN addgroup -g 1001 -S nodejs && adduser -S nestjs -u 1001 -G nodejs
USER nestjs

# Copy only necessary files from the builder stage
COPY --from=builder /usr/src/app/package*.json ./
RUN npm ci --only=production && npm cache clean --force
COPY --from=builder /usr/src/app/dist ./dist

EXPOSE 3000
HEALTHCHECK --interval=30s --timeout=3s --start-period=10s --retries=3 CMD curl -f http://localhost:3000/health || exit 1

# Use dumb-init to handle signals properly (optional, but recommended)
ENTRYPOINT ["dumb-init", "--"]
CMD ["node", "dist/main.js"]
