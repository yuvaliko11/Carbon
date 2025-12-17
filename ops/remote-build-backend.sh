#!/bin/bash
set -e

echo "🚀 Building backend on VM..."

# Unzip
rm -rf backend
mkdir -p backend
tar -xzf backend.tar.gz -C backend

# Build
cd backend
echo "📂 Directory contents:"
ls -R
echo "🔨 Building Docker image..."
docker build -t fijicarbonhubacr16944.azurecr.io/fiji-backend:latest .

# Restart container
echo "🔄 Restarting backend container..."
docker stop fiji-backend || true
docker rm fiji-backend || true

# Ensure network exists
docker network create fiji-network || true

docker run -d --name fiji-backend \
  --restart unless-stopped \
  --network fiji-network \
  -p 5002:5002 \
  -e NODE_ENV=production \
  -e PORT=5002 \
  -v /home/azureuser/uploads:/app/uploads \
  -e MONGODB_URI="${MONGODB_URI:-<your_mongodb_uri>}" \
  -e OPENAI_API_KEY="${OPENAI_API_KEY:-<your_key>}" \
  -e JWT_SECRET="${JWT_SECRET:-<your_jwt_secret>}" \
  fijicarbonhubacr16944.azurecr.io/fiji-backend:latest

echo "✅ Backend deployed successfully!"
docker ps --filter "name=fiji-backend"
