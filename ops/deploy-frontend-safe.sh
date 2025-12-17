#!/bin/bash
set -e
VM_IP="4.197.177.231"
VM_USER="azureuser"

echo "🏗️ Building locally (to save server CPU)..."
cd frontend
# Ensure we have dependencies (should be cached)
# Ensure we have dependencies (should be cached)
npm install
export REACT_APP_API_URL="https://ctrade.facio.io/api"
npm run build
cd ..

echo "📦 Compressing build artifacts..."
# Compress the build contents
tar -czf build.tar.gz -C frontend/build .

echo "📜 Preparing Nginx Config..."
cp frontend/nginx.conf nginx_custom.conf

echo "🚀 Uploading to VM..."
scp -i ~/.ssh/id_rsa build.tar.gz ${VM_USER}@${VM_IP}:~/build.tar.gz
scp -i ~/.ssh/id_rsa nginx_custom.conf ${VM_USER}@${VM_IP}:~/nginx_custom.conf

echo "🔄 Swapping containers on VM..."
ssh -i ~/.ssh/id_rsa ${VM_USER}@${VM_IP} "
  # Kill any lingering heavy processes if possible (optional, might fail if safe)
  pkill node || true
  
  # Prepare directory
  rm -rf ~/site-build
  mkdir -p ~/site-build
  tar -xzf ~/build.tar.gz -C ~/site-build
  
  # Restart Container serving static files
  docker stop fiji-frontend || true
  docker rm fiji-frontend || true
  
  # Ensure network
  docker network create fiji-network || true
  
  # Run Nginx serving the static files from host volume
  docker run -d --name fiji-frontend \
    --restart unless-stopped \
    --network fiji-network \
    -p 8080:80 \
    -v ~/site-build:/usr/share/nginx/html \
    -v ~/nginx_custom.conf:/etc/nginx/conf.d/default.conf \
    nginx:alpine
"

echo "🧹 Cleanup..."
rm build.tar.gz
rm nginx_custom.conf

echo "✅ Safe Deployment Complete!"
