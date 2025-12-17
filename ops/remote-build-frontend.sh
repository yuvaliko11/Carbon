#!/bin/bash
set -e

echo "🚀 Building frontend on VM..."

# Unzip
rm -rf frontend
mkdir -p frontend
tar -xzf frontend.tar.gz -C frontend

# Build
cd frontend
echo "📂 Directory contents:"
ls -R
echo "🔨 Building Docker image..."
docker build \
  --build-arg REACT_APP_GOOGLE_MAPS_API_KEY=${REACT_APP_GOOGLE_MAPS_API_KEY:-"<your_google_maps_api_key>"} \
  --build-arg REACT_APP_GOOGLE_MAPS_MAP_ID=${REACT_APP_GOOGLE_MAPS_MAP_ID:-"<your_map_id>"} \
  -t fijicarbonhubacr16944.azurecr.io/fiji-frontend:latest .


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
