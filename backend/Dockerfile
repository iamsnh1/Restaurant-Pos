FROM node:20-alpine
WORKDIR /app

# Copy package files first
COPY package*.json ./

# Copy Prisma schema before npm ci (needed for postinstall hook)
COPY prisma ./prisma

# Install dependencies (this will run prisma generate via postinstall)
RUN npm ci

# Copy rest of the application
COPY . .

# Ensure entrypoint is executable
RUN chmod +x docker-entrypoint.sh

EXPOSE 5001
ENTRYPOINT ["./docker-entrypoint.sh"]
