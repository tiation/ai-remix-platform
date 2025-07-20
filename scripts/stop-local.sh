#!/bin/bash

# Stop local development environment

echo "🛑 Stopping AI Remix Platform..."

# Kill Next.js if it's running
if [ -f .nextjs.pid ]; then
    echo "Stopping Next.js development server..."
    kill $(cat .nextjs.pid) 2>/dev/null || true
    rm -f .nextjs.pid
fi

# Stop Docker services
echo "Stopping Docker services..."
docker-compose -f docker-compose.simple.yml down

# Optional: Remove volumes (uncomment to reset database)
# docker-compose -f docker-compose.simple.yml down -v

echo "✅ All services stopped"