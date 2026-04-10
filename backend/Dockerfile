# =============================================================================
# Geo Backend — Production Dockerfile
#
# Multi-stage build: deps → prisma → runtime
# Non-root user, dumb-init for PID 1 signal handling, optimized layer caching.
# =============================================================================

# ---------------------------------------------------------------------------
# Stage 1: Install production dependencies
# ---------------------------------------------------------------------------
FROM node:20-alpine AS deps

WORKDIR /app

COPY package.json package-lock.json ./

RUN --mount=type=cache,target=/root/.npm \
    npm ci --omit=dev && npm cache clean --force

# ---------------------------------------------------------------------------
# Stage 2: Generate Prisma Client
# ---------------------------------------------------------------------------
FROM node:20-alpine AS prisma

WORKDIR /app

COPY package.json package-lock.json ./

# Full install needed for prisma CLI (devDependency)
RUN --mount=type=cache,target=/root/.npm \
    npm ci --ignore-scripts && npm cache clean --force

COPY prisma ./prisma

RUN npx prisma generate

# ---------------------------------------------------------------------------
# Stage 3: Production Runtime
# ---------------------------------------------------------------------------
FROM node:20-alpine AS runtime

LABEL maintainer="kiero-teknologi" \
      app.name="geo-backend" \
      app.environment="production"

# dumb-init + non-root user in single layer
RUN apk add --no-cache dumb-init && \
    addgroup -g 1001 -S nodejs && \
    adduser -S appuser -u 1001 -G nodejs

WORKDIR /app

# Copy production dependencies
COPY --from=deps --chown=appuser:nodejs /app/node_modules ./node_modules

# Copy generated Prisma client
COPY --from=prisma /app/node_modules/.prisma ./node_modules/.prisma
COPY --from=prisma /app/node_modules/@prisma ./node_modules/@prisma

# Copy application source selectively (no COPY . . — minimal attack surface)
COPY --chown=appuser:nodejs package.json ./
COPY --chown=appuser:nodejs index.js ./
COPY --chown=appuser:nodejs prisma ./prisma
COPY --chown=appuser:nodejs config ./config
COPY --chown=appuser:nodejs middleware ./middleware
COPY --chown=appuser:nodejs routes ./routes
COPY --chown=appuser:nodejs services ./services
COPY --chown=appuser:nodejs utils ./utils

# Create runtime directories (logs & archives are generated at runtime)
RUN mkdir -p logs archives && chown -R appuser:nodejs logs archives

USER appuser

ENV NODE_ENV=production

ENTRYPOINT ["dumb-init", "--"]
CMD ["node", "index.js"]