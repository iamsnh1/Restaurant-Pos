FROM node:20-alpine
WORKDIR /app

# Install openssl (required for Prisma on Alpine)
RUN apk add --no-cache openssl

# Copy package files first
COPY package*.json ./

# Copy Prisma schema
COPY prisma ./prisma

# Install dependencies
RUN npm ci

# Copy rest of the application
COPY . .

# Ensure entrypoint is executable
RUN chmod +x docker-entrypoint.sh

# Expose port
EXPOSE 5001

# Default env vars
ENV HOST=0.0.0.0
ENV PORT=5001

ENTRYPOINT ["./docker-entrypoint.sh"]
