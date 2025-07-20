#!/bin/bash

# Quick start script for local development with self-hosted Supabase

set -e

echo "🚀 Starting AI Remix Platform with Self-hosted Supabase..."

# Check if Docker is running
if ! docker info > /dev/null 2>&1; then
    echo "❌ Docker is not running. Please start Docker first."
    exit 1
fi

# Create .env.local if it doesn't exist
if [ ! -f .env.local ]; then
    echo "📄 Creating local environment configuration..."
    cp .env.docker .env.local
    
    # Generate random passwords for local development
    POSTGRES_PASSWORD=$(openssl rand -base64 16 | tr -d "=+/")
    JWT_SECRET=$(openssl rand -base64 32 | tr -d "=+/")
    NEXTAUTH_SECRET=$(openssl rand -base64 16 | tr -d "=+/")
    
    # Update .env.local with generated secrets
    sed -i.bak "s/your-super-secret-and-long-postgres-password/$POSTGRES_PASSWORD/g" .env.local
    sed -i.bak "s/super-secret-jwt-token-with-at-least-32-characters-long/$JWT_SECRET/g" .env.local
    sed -i.bak "s/your-nextauth-secret/$NEXTAUTH_SECRET/g" .env.local
    
    # Set local URLs
    sed -i.bak "s|https://yourdomain.com|http://localhost:3000|g" .env.local
    sed -i.bak "s|yourdomain.com:8000|localhost:8000|g" .env.local
    
    rm -f .env.local.bak
    
    echo "✅ Local environment configured with random secrets"
fi

# Load environment variables
set -a
source .env.local
set +a

echo "🐳 Starting Supabase services..."

# Use simplified Docker Compose for local development
docker-compose -f docker-compose.simple.yml up -d

echo "⏳ Waiting for services to be ready..."

# Wait for PostgreSQL to be ready
echo "Waiting for PostgreSQL..."
until docker-compose -f docker-compose.simple.yml exec -T postgres pg_isready -U postgres > /dev/null 2>&1; do
    sleep 2
done

# Wait for PostgREST to be ready
echo "Waiting for PostgREST..."
until curl -s http://localhost:3001 > /dev/null 2>&1; do
    sleep 2
done

# Wait for GoTrue to be ready
echo "Waiting for GoTrue..."
until curl -s http://localhost:9999 > /dev/null 2>&1; do
    sleep 2
done

# Wait for Kong API Gateway to be ready
echo "Waiting for Kong API Gateway..."
until curl -s http://localhost:8000 > /dev/null 2>&1; do
    sleep 2
done

echo "✅ All services are ready!"

# Install Node.js dependencies if not already installed
if [ ! -d "node_modules" ]; then
    echo "📦 Installing Node.js dependencies..."
    npm install
fi

echo "🏗️ Building Next.js application..."
npm run build

echo "🌐 Starting Next.js development server..."

# Start Next.js in background
npm run dev > /dev/null 2>&1 &
NEXTJS_PID=$!

# Save PID for cleanup
echo $NEXTJS_PID > .nextjs.pid

echo ""
echo "🎉 AI Remix Platform is now running!"
echo ""
echo "📋 Service URLs:"
echo "🌐 Next.js App:      http://localhost:3000"
echo "🔌 Supabase API:     http://localhost:8000"
echo "🔐 Auth (GoTrue):    http://localhost:9999"
echo "📊 PostgREST API:    http://localhost:3001"
echo "💾 PostgreSQL:       localhost:5432"
echo ""
echo "🔑 Database credentials:"
echo "Username: postgres"
echo "Password: $POSTGRES_PASSWORD"
echo "Database: postgres"
echo ""
echo "⚙️ Environment:"
echo "JWT Secret: $JWT_SECRET"
echo "NextAuth Secret: $NEXTAUTH_SECRET"
echo ""
echo "🛠️ Useful commands:"
echo "📊 View logs:        docker-compose -f docker-compose.simple.yml logs -f"
echo "🔍 Check status:     docker-compose -f docker-compose.simple.yml ps"
echo "🛑 Stop services:    ./scripts/stop-local.sh"
echo "🗄️ Database shell:   docker-compose -f docker-compose.simple.yml exec postgres psql -U postgres"
echo ""
echo "🚀 Ready to build amazing projects with Claude AI!"
echo ""
echo "Press Ctrl+C to stop all services..."

# Function to handle cleanup on script exit
cleanup() {
    echo ""
    echo "🛑 Stopping services..."
    
    # Kill Next.js if it's running
    if [ -f .nextjs.pid ]; then
        kill $(cat .nextjs.pid) 2>/dev/null || true
        rm -f .nextjs.pid
    fi
    
    # Stop Docker services
    docker-compose -f docker-compose.simple.yml down
    
    echo "✅ All services stopped"
    exit 0
}

# Set up signal handlers
trap cleanup SIGINT SIGTERM

# Keep script running
while true; do
    sleep 1
done