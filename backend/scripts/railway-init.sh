#!/bin/bash

# Railway initialization script
set -e

echo "Starting DannigOptica Backend on Railway..."

# Verify critical environment variables
echo "Verifying environment variables..."
if [ -z "$DATABASE_URL" ]; then
    echo "ERROR: DATABASE_URL is not configured"
    exit 1
fi

if [ -z "$JWT_SECRET" ]; then
    echo "ERROR: JWT_SECRET is not configured"
    exit 1
fi

echo "Environment variables configured correctly"

# Generate Prisma client
echo "Generating Prisma client..."
npx prisma generate

# Apply database migrations
echo "Applying database migrations..."
npx prisma db push --accept-data-loss

echo "Database initialized correctly"

# Start server
echo "Starting server..."
exec npm start
