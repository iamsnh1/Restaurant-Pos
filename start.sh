#!/bin/sh
set -e

cd /app/backend

# Debug: Print environment variables (without sensitive data)
echo "Environment check:"
echo "NODE_ENV=$NODE_ENV"
echo "PORT=$PORT"
echo "DATABASE_URL=${DATABASE_URL:+SET}" # Show SET if exists, empty if not
echo "JWT_SECRET=${JWT_SECRET:+SET}"

# Wait a bit for platform to inject environment variables
echo "Waiting for environment variables..."
sleep 5

# Check DATABASE_URL at runtime (not build time)
if [ -z "$DATABASE_URL" ]; then
  echo "ERROR: DATABASE_URL is not set"
  echo "Available env vars:"
  env | grep -E "(DATABASE|POSTGRES|DB)" || echo "No database-related env vars found"
  exit 1
fi

echo "Waiting for PostgreSQL and running migrations..."
retries=0
max_retries=30
until npx prisma db push --accept-data-loss --schema=./prisma/schema.prisma; do
  retries=$((retries + 1))
  if [ "$retries" -ge "$max_retries" ]; then
    echo "ERROR: Could not connect to database after $max_retries attempts"
    exit 1
  fi
  echo "Waiting for database... retry $retries/$max_retries in 3s"
  sleep 3
done
echo "Migrations applied successfully"

echo "Seeding database (if empty)..."
npx prisma db seed || true

echo "Starting backend..."
node server.js &

echo "Starting nginx..."
nginx -g "daemon off;"
