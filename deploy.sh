#!/bin/bash

echo "🚀 Deploying Greens Life Application..."

# Check if .env file exists
if [ ! -f .env ]; then
    echo "⚠️  .env file not found. Creating from example..."
    cp .env.example .env
    echo "📝 Please edit .env file with your configuration before running again."
    exit 1
fi

# Build and start production containers
echo "🔨 Building production containers..."
docker-compose -f docker-compose.prod.yml build

echo "🚀 Starting production deployment..."
docker-compose -f docker-compose.prod.yml up -d

echo "⏳ Waiting for services to be ready..."
sleep 30

# Check if services are running
echo "🔍 Checking service health..."
if docker-compose -f docker-compose.prod.yml ps | grep -q "Up"; then
    echo "✅ Deployment successful!"
    echo ""
    echo "🌐 Your application is now running:"
    echo "   Frontend: http://localhost"
    echo "   Backend API: http://localhost:3001"
    echo "   MongoDB: localhost:27017"
    echo ""
    echo "📊 View logs:"
    echo "   docker-compose -f docker-compose.prod.yml logs -f"
    echo ""
    echo "🛑 Stop deployment:"
    echo "   docker-compose -f docker-compose.prod.yml down"
else
    echo "❌ Deployment failed. Check logs:"
    docker-compose -f docker-compose.prod.yml logs
fi