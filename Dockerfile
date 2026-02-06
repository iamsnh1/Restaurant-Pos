# Multi-stage build for fullstack deployment
# Frontend + Backend in one container (served by Nginx)

# ============================================
# Stage 1: Build Frontend
# ============================================
FROM node:20-alpine AS frontend-build
WORKDIR /app/frontend

ARG VITE_API_URL=/api
ENV VITE_API_URL=$VITE_API_URL

COPY frontend/package*.json ./
RUN npm ci --prefer-offline --no-audit

COPY frontend/ ./
RUN npm run build

# ============================================
# Stage 2: Build Backend
# ============================================
FROM node:20-alpine AS backend-build
WORKDIR /app/backend

# Copy Prisma schema before npm ci (needed for postinstall hook)
COPY backend/prisma ./prisma
COPY backend/package*.json ./
RUN npm ci --prefer-offline --no-audit

COPY backend/ ./
RUN chmod +x docker-entrypoint.sh

# ============================================
# Stage 3: Production - Nginx + Node
# ============================================
FROM nginx:alpine

# Install Node.js for backend
RUN apk add --no-cache nodejs npm

# Copy frontend build
COPY --from=frontend-build /app/frontend/dist /usr/share/nginx/html

# Copy backend
COPY --from=backend-build /app/backend /app/backend

# Copy nginx config for single container
COPY nginx.prod.conf /etc/nginx/conf.d/default.conf

# Create startup script
RUN echo '#!/bin/sh' > /start.sh && \
    echo 'cd /app/backend' >> /start.sh && \
    echo 'if [ -z "$DATABASE_URL" ]; then' >> /start.sh && \
    echo '  echo "ERROR: DATABASE_URL is not set"' >> /start.sh && \
    echo '  exit 1' >> /start.sh && \
    echo 'fi' >> /start.sh && \
    echo 'retries=0' >> /start.sh && \
    echo 'max_retries=30' >> /start.sh && \
    echo 'until cd /app/backend && npx prisma db push --accept-data-loss; do' >> /start.sh && \
    echo '  retries=$((retries + 1))' >> /start.sh && \
    echo '  if [ "$retries" -ge "$max_retries" ]; then' >> /start.sh && \
    echo '    echo "ERROR: Could not connect to database after $max_retries attempts"' >> /start.sh && \
    echo '    exit 1' >> /start.sh && \
    echo '  fi' >> /start.sh && \
    echo '  echo "Waiting for database... retry $retries/$max_retries in 3s"' >> /start.sh && \
    echo '  sleep 3' >> /start.sh && \
    echo 'done' >> /start.sh && \
    echo 'cd /app/backend && npx prisma db seed || true' >> /start.sh && \
    echo 'cd /app/backend && node server.js &' >> /start.sh && \
    echo 'nginx -g "daemon off;"' >> /start.sh && \
    chmod +x /start.sh

WORKDIR /app/backend

EXPOSE 80

CMD ["/start.sh"]
