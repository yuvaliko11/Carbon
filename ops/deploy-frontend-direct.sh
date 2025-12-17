#!/bin/bash
set -e

VM_IP="4.197.177.231"
VM_USER="azureuser"

echo "🚀 Preparing direct frontend deployment..."

# 1. Compress frontend
echo "📦 Compressing frontend code..."
# Exclude node_modules to save time/bandwidth
cd frontend && COPYFILE_DISABLE=1 tar --exclude='node_modules' -czf ../frontend.tar.gz . && cd ..

# 2. Copy files to VM
echo "Cc Copying files to VM..."
scp frontend.tar.gz ${VM_USER}@${VM_IP}:~/
scp remote-build-frontend.sh ${VM_USER}@${VM_IP}:~/

# 3. Execute remote build
echo "🔨 Executing remote build..."
ssh ${VM_USER}@${VM_IP} "bash ~/remote-build-frontend.sh"

# 4. Cleanup
rm frontend.tar.gz

echo "✅ Direct frontend deployment complete!"
