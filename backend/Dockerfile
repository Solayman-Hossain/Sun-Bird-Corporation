# ==============================================================================
# Sun Bird Corporation Cloud ERP - Multi-Stage Production Dockerfile
# ==============================================================================

# Stage 1: TypeScript Build & Optimization Stage
FROM node:20-alpine AS builder

WORKDIR /app

# Copy dependency manifests
COPY package*.json tsconfig.json ./

# Clean installation of all dependencies (including devDependencies for tsc)
RUN npm ci

# Copy TypeScript source code
COPY src/ ./src/

# Compile TypeScript into production-ready JavaScript
RUN npm run build

# Stage 2: Production Execution Runtime
FROM node:20-alpine AS runner

WORKDIR /app

ENV NODE_ENV=production
ENV PORT=5000

# Copy package manifests and install ONLY production dependencies
COPY package*.json ./
RUN npm ci --only=production && npm cache clean --force

# Copy compiled JavaScript from builder stage
COPY --from=builder /app/dist ./dist

# Run as non-privileged security user
RUN addgroup -g 1001 -S sunbird && \
    adduser -u 1001 -S erpuser -G sunbird

USER erpuser

EXPOSE 5000

# Container healthcheck against /api/v1/health
HEALTHCHECK --interval=30s --timeout=5s --start-period=15s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://127.0.0.1:5000/api/v1/health || exit 1

# Launch production server
CMD ["node", "dist/server.js"]
