#!/bin/bash
set -e

echo "🚀 Deploying with MongoDB container..."

VM_IP="4.197.177.231"
VM_USER="azureuser"
REGISTRY="fijicarbonhubacr16944.azurecr.io"
REGISTRY_USER="fijicarbonhubacr16944"
REGISTRY_PASS="${REGISTRY_PASS:-<your_registry_pass>}"

echo "📦 Connecting to VM and deploying..."

ssh ${VM_USER}@${VM_IP} << ENDSSH
    echo "🔐 Logging into Azure Container Registry..."
    echo "${REGISTRY_PASS}" | docker login ${REGISTRY} -u ${REGISTRY_USER} --password-stdin
    
    echo "📥 Pulling latest images..."
    docker pull ${REGISTRY}/fiji-backend:latest
    docker pull ${REGISTRY}/fiji-frontend:latest
    docker pull mongo:7
    
    echo "🛑 Stopping old containers..."
    docker stop fiji-backend fiji-frontend fiji-mongodb 2>/dev/null || true
    docker rm fiji-backend fiji-frontend fiji-mongodb 2>/dev/null || true
    
    echo "🌐 Creating Docker network..."
    docker network create fiji-network 2>/dev/null || echo "Network already exists"
    
    echo "🗄️  Starting MongoDB container..."
    docker run -d --name fiji-mongodb \\
      --restart unless-stopped \\
      --network fiji-network \\
      -v fiji-mongodb-data:/data/db \\
      mongo:7
    
    echo "⏳ Waiting for MongoDB to start..."
    sleep 5
    
    echo "🚀 Starting backend container..."
    docker run -d --name fiji-backend \\
      --restart unless-stopped \\
      --network fiji-network \\
      -p 5002:5002 \\
      -e NODE_ENV=production \\
      -e PORT=5002 \\
      -e MONGODB_URI="mongodb://fiji-mongodb:27017/fiji-carbon" \\
      -e JWT_SECRET="${JWT_SECRET:-<your_jwt_secret>}" \\
      -e OPENAI_API_KEY="${OPENAI_API_KEY:-<your_openai_api_key>}" \\
      -e OPENAI_API_KEY="${OPENAI_API_KEY:-<your_openai_api_key>}" \\
      -v /home/azureuser/uploads:/app/uploads \\
      ${REGISTRY}/fiji-backend:latest
    
    echo "⏳ Waiting for backend to start..."
    sleep 3
    
    echo "🚀 Starting frontend container..."
    docker run -d --name fiji-frontend \\
      --restart unless-stopped \\
      --network fiji-network \\
      -p 8080:80 \\
      -e BACKEND_URL="http://fiji-backend:5002" \\
      ${REGISTRY}/fiji-frontend:latest
    
    echo "✅ Deployment complete!"
    docker ps --filter "name=fiji-" --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}"
    
    echo ""
    echo "🔍 Checking backend logs..."
    docker logs fiji-backend --tail 10
ENDSSH

echo ""
echo "✅ Deployment finished!"
echo "🌐 Visit: http://4.197.177.231"
