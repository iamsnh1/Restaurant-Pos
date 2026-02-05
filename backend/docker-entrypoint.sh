#!/bin/sh
set -e

echo "Waiting for PostgreSQL and running migrations..."
until npx prisma db push --accept-data-loss 2>/dev/null; do
  echo "Waiting for database... retrying in 2s"
  sleep 2
done

echo "Seeding database (if empty)..."
npx prisma db seed || true

echo "Starting backend..."
exec node server.js
