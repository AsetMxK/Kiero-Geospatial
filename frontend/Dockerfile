# =============================================================================
# Geo Frontend — Production Dockerfile
#
# Multi-stage build: Vite SPA → Nginx static server
# Pinned nginx version, optimized layer caching.
# =============================================================================

# ---------------------------------------------------------------------------
# Stage 1: Build React App
# ---------------------------------------------------------------------------
FROM node:20-alpine AS builder

WORKDIR /app

# Build arguments for Vite (compile-time environment injection)
ARG VITE_GOOGLE_MAPS_API_KEY
ARG VITE_CLIENT_ID
ARG VITE_GATEWAY_URL
ARG VITE_APP_BASE_URL

ENV VITE_GOOGLE_MAPS_API_KEY=$VITE_GOOGLE_MAPS_API_KEY
ENV VITE_CLIENT_ID=$VITE_CLIENT_ID
ENV VITE_GATEWAY_URL=$VITE_GATEWAY_URL
ENV VITE_APP_BASE_URL=$VITE_APP_BASE_URL

COPY package.json package-lock.json ./

RUN --mount=type=cache,target=/root/.npm \
    npm ci && npm cache clean --force

COPY . .

RUN npm run build

# ---------------------------------------------------------------------------
# Stage 2: Nginx Runtime
# ---------------------------------------------------------------------------
FROM nginx:1.27-alpine AS runtime

LABEL maintainer="kiero-teknologi" \
      app.name="geo-frontend" \
      app.environment="production"

# Remove default config and html
RUN rm -rf /etc/nginx/conf.d/default.conf /usr/share/nginx/html/*

COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=builder /app/dist /usr/share/nginx/html

# Set proper ownership (nginx user already exists in nginx:alpine)
RUN chown -R nginx:nginx /usr/share/nginx/html && \
    chmod -R 755 /usr/share/nginx/html

CMD ["nginx", "-g", "daemon off;"]