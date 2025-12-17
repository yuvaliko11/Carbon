#!/bin/bash
set -e

# Load Config
if [ ! -f acr_name.txt ]; then
    echo "❌ ACR name not found. Run setup-infra.sh first."
    exit 1
fi
ACR_NAME=$(cat acr_name.txt)

echo "🚀 Building and Pushing Images to $ACR_NAME..."

# Login to ACR (Not needed for az acr build)
# az acr login --name $ACR_NAME

# Build and Push Backend
echo "📦 Building Backend..."
az acr build --registry $ACR_NAME --image fiji-backend:latest ./backend

# Build and Push Frontend
echo "📦 Building Frontend..."
az acr build --registry $ACR_NAME --image fiji-frontend:latest \
  --build-arg REACT_APP_GOOGLE_MAPS_API_KEY="AIzaSyCkNkX9HHOWspzdIbgls72kEC3liutx4m8" \
  --build-arg REACT_APP_GOOGLE_MAPS_MAP_ID="3f443fab2e0d534989ba5380" \
  ./frontend

echo "✅ Build and Push Complete!"
