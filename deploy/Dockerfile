# Single-container image: frontend (nginx) + backend (Node). Build from repo root: docker build -f deploy/Dockerfile .

# ---- Frontend ----
FROM node:20-alpine AS frontend
WORKDIR /app
ARG VITE_API_URL=/api
ENV VITE_API_URL=$VITE_API_URL
# Set Node memory limit to prevent OOM (exit code 137)
ENV NODE_OPTIONS="--max-old-space-size=1024"
COPY frontend/package*.json ./
RUN npm ci --prefer-offline --no-audit
COPY frontend/ ./
# Build with memory optimization
RUN NODE_OPTIONS="--max-old-space-size=1024" npm run build

# ---- Backend ----
FROM node:20-alpine AS backend
WORKDIR /app
COPY backend/package*.json ./
# Copy Prisma schema before npm ci (needed for postinstall script that runs prisma generate)
COPY backend/prisma ./prisma
# Install dependencies (postinstall script will run prisma generate automatically)
RUN npm ci --prefer-offline --no-audit
# Copy rest of backend files
COPY backend/ ./
# Verify Prisma client is generated (postinstall should have done this)
RUN npx prisma generate

# ---- Final: nginx + Node ----
FROM node:20-alpine
RUN apk add --no-cache nginx
WORKDIR /app

# Frontend static files
COPY --from=frontend /app/dist /usr/share/nginx/html

# Backend
COPY --from=backend /app ./

# Nginx config (proxy /api and /socket.io to 127.0.0.1:5001)
COPY deploy/nginx.conf /etc/nginx/conf.d/default.conf

COPY deploy/entrypoint.sh /entrypoint.sh
RUN chmod +x /entrypoint.sh

ENV NODE_ENV=production
ENV PORT=5001
EXPOSE 80
ENTRYPOINT ["/entrypoint.sh"]
