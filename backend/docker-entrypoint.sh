#!/bin/sh
set -e

echo "Using MongoDB database..."
echo "Generating Prisma Client..."
npx prisma generate

echo "Pushing schema to database..."
# MongoDB uses db push to sync schema
npx prisma db push --accept-data-loss

echo "Seeding database..."
npx prisma db seed || echo "Seeding failed or skipped"

echo "Starting backend..."
exec node server.js
