FROM node:20-alpine
WORKDIR /app

COPY package*.json ./
RUN npm ci
COPY . .
RUN npx prisma generate && chmod +x docker-entrypoint.sh

EXPOSE 5001
ENTRYPOINT ["./docker-entrypoint.sh"]
