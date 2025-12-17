#!/bin/bash
set -e

VM_IP="4.197.177.231"
VM_USER="azureuser"

echo "🚀 Packaging LOCAL build..."
if [ ! -d "frontend/build" ]; then
    echo "❌ Error: frontend/build directory not found. Run 'npm run build' first."
    exit 1
fi

# Create a temporary directory for packaging
rm -rf temp_package
mkdir temp_package
cp -r frontend/build temp_package/
cp Dockerfile.production temp_package/
cp frontend/nginx.conf.template temp_package/

# Compress
tar -czf build.tar.gz -C temp_package .
rm -rf temp_package

echo "📦 Uploading build to VM..."
scp build.tar.gz ${VM_USER}@${VM_IP}:~/build.tar.gz
scp remote-deploy-built.sh ${VM_USER}@${VM_IP}:~/remote-deploy-built.sh

echo "🔨 Executing remote deployment..."
ssh ${VM_USER}@${VM_IP} "chmod +x ~/remote-deploy-built.sh && ~/remote-deploy-built.sh"

echo "🧹 Cleanup..."
rm build.tar.gz

echo "✅ Deployment complete!"
