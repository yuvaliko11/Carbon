#!/bin/bash
set -e

echo "🚀 Building frontend on VM..."

# Unzip (only if needed)
# mkdir -p frontend
# tar -xzf frontend.tar.gz -C frontend

# Build
cd frontend
echo "🔨 Building Docker image with Deployment API Key..."
docker build \
  --build-arg REACT_APP_GOOGLE_MAPS_API_KEY=${REACT_APP_GOOGLE_MAPS_API_KEY:-"<your_google_maps_api_key>"} \
  --build-arg REACT_APP_GOOGLE_MAPS_MAP_ID=${REACT_APP_GOOGLE_MAPS_MAP_ID:-"<your_map_id>"} \
  -t fijicarbonhubacr16944.azurecr.io/fiji-frontend:latest .

# Restart container
echo "🔄 Restarting frontend container..."
docker stop fiji-frontend || true
docker rm fiji-frontend || true

docker run -d --name fiji-frontend \
  --restart unless-stopped \
  --network fiji-network \
  -p 8080:80 \
  fijicarbonhubacr16944.azurecr.io/fiji-frontend:latest

echo "✅ Frontend deployed successfully with Deployment API Key!"
docker ps --filter "name=fiji-frontend"
