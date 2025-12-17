#!/bin/bash
set -e

echo "🚀 Deploying pre-built frontend on VM..."

# Unzip
rm -rf build_deploy
mkdir -p build_deploy
tar -xzf build.tar.gz -C build_deploy

# Build
cd build_deploy
echo "🔨 Building Docker image (fast)..."
docker build -f Dockerfile.production -t fijicarbonhubacr16944.azurecr.io/fiji-frontend:latest .

# Restart container
echo "🔄 Restarting frontend container..."
docker stop fiji-frontend || true
docker rm fiji-frontend || true

# Ensure network exists
docker network create fiji-network || true

docker run -d --name fiji-frontend \
  --restart unless-stopped \
  --network fiji-network \
  -p 8080:80 \
  -e BACKEND_URL=http://fiji-backend:5002 \
  fijicarbonhubacr16944.azurecr.io/fiji-frontend:latest

echo "✅ Frontend deployed successfully!"
docker ps --filter "name=fiji-frontend"
