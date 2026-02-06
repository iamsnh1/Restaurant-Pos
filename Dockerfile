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

# Copy startup script (will be executed at runtime, not build time)
COPY start.sh /start.sh
RUN chmod +x /start.sh

WORKDIR /app/backend

EXPOSE 80

CMD ["/start.sh"]
