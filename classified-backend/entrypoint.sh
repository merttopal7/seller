#!/bin/sh
set -e

echo "🔄 Running database migrations (prisma db push)..."
npx prisma db push

echo "✅ Database schema is up to date"
echo "🚀 Starting server..."
exec node dist/index.js
