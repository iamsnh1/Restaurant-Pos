# Single-container image: frontend (nginx) + backend (Node). Build from repo root: docker build -f deploy/Dockerfile .

# ---- Frontend ----
FROM node:20-alpine AS frontend
WORKDIR /app
ARG VITE_API_URL=/api
ENV VITE_API_URL=$VITE_API_URL
COPY frontend/package*.json ./
RUN npm ci
COPY frontend/ ./
RUN npm run build

# ---- Backend ----
FROM node:20-alpine AS backend
WORKDIR /app
COPY backend/package*.json ./
RUN npm ci
COPY backend/ ./
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
