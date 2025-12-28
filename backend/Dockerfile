# --- Stage 1: Runtime ---
FROM node:18-alpine

WORKDIR /app

# Install netcat for healthchecks
RUN apk add --no-cache netcat-openbsd

# Install dependencies (only production)
COPY package*.json ./
# Make sure to install production deps nicely
RUN npm install --only=production

# Copy application code
COPY . .

# Generate Prisma Client
# Note: Ensure that schema.prisma is included in the context (usually under prisma/ folder)
RUN npx prisma generate

# Create and use non-root user for security
RUN mkdir -p logs && mkdir -p archives && chown -R node:node /app
USER node

# Expose port
EXPOSE 3000

# Start command
CMD ["npm", "run", "start"]