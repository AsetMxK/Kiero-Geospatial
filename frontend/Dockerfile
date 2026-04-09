# --- Stage 1: Build React App ---
FROM node:20-alpine AS builder

WORKDIR /app

# Build arguments for Vite (Environment Variables)
ARG VITE_GOOGLE_MAPS_API_KEY
ARG VITE_CLIENT_ID
ARG VITE_GATEWAY_URL

# Set as environment variables for the build
ENV VITE_GOOGLE_MAPS_API_KEY=$VITE_GOOGLE_MAPS_API_KEY
ENV VITE_CLIENT_ID=$VITE_CLIENT_ID
ENV VITE_GATEWAY_URL=$VITE_GATEWAY_URL

COPY package*.json ./

RUN npm install

COPY . .

RUN npm run build

FROM nginx:alpine

# Install netcat for healthcheck (minimal footprint)
RUN apk add --no-cache busybox-extras

COPY --from=builder /app/dist /usr/share/nginx/html

COPY nginx.conf /etc/nginx/conf.d/default.conf

CMD ["nginx", "-g", "daemon off;"]