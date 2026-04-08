# --- Stage 1: Runtime ---
FROM node:18-alpine

WORKDIR /app

# Install netcat for healthchecks
RUN apk add --no-cache netcat-openbsd

# Install dependencies
COPY package*.json ./
RUN npm install --only=production

# Copy app source
COPY . .

# Generate Prisma Client
RUN npx prisma generate

# Security: Run as non-root user
RUN mkdir -p logs && mkdir -p archives && chown -R node:node /app
USER node

EXPOSE 3000

# Start command
CMD ["npm", "run", "start"]