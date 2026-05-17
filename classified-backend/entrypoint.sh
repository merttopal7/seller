#!/bin/sh
set -e

echo "🔄 Running database migrations (prisma db push)..."
npx prisma db push --skip-generate

echo "✅ Database schema is up to date"
echo "🚀 Starting server..."
exec node dist/index.js
