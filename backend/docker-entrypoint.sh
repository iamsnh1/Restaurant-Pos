#!/bin/sh
set -e

if [ -z "$DATABASE_URL" ]; then
  echo "ERROR: DATABASE_URL is not set"
  exit 1
fi

echo "Waiting for PostgreSQL and running migrations..."
retries=0
max_retries=30
until npx prisma db push --accept-data-loss; do
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
exec node server.js
