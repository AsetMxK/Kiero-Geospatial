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

COPY package.json package-lock.json ./

RUN --mount=type=cache,target=/root/.npm,sharing=locked \
    npm ci

COPY . .

# Create placeholder env file automatically from template (.env.example)
# We use a Vite-safe placeholder (/___VAR___/) for the base URL to prevent triple-slash errors during build.
RUN sed -n '/VITE_APP_BASE_URL/! s/^\(VITE_[^= ]*\)=.*/\1=__\1__/p' .env.example > .env && \
    echo 'VITE_APP_BASE_URL="/___VITE_APP_BASE_URL___/"' >> .env

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

# Copy runtime environment injection script
COPY scripts/40-inject-envs.sh /docker-entrypoint.d/40-inject-envs.sh
RUN chmod +x /docker-entrypoint.d/40-inject-envs.sh

COPY --from=builder /app/dist /usr/share/nginx/html

# Set proper ownership (nginx user already exists in nginx:alpine)
RUN chown -R nginx:nginx /usr/share/nginx/html && \
    chmod -R 755 /usr/share/nginx/html

CMD ["nginx", "-g", "daemon off;"]