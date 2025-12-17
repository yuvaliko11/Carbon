#!/bin/bash
set -e

VM_IP="4.197.177.231"
VM_USER="azureuser"

echo "🚀 Preparing direct backend deployment..."

# 1. Compress
echo "📦 Compressing backend code..."
cd backend && COPYFILE_DISABLE=1 tar --exclude='node_modules' -czf ../backend.tar.gz . && cd ..

# 2. Copy files to VM
echo "Cc Copying files to VM..."
scp -i ~/.ssh/id_rsa backend.tar.gz ${VM_USER}@${VM_IP}:~/
scp -i ~/.ssh/id_rsa remote-build-backend.sh ${VM_USER}@${VM_IP}:~/

# 3. Execute remote build
echo "🔨 Executing remote build..."
ssh -i ~/.ssh/id_rsa ${VM_USER}@${VM_IP} "bash ~/remote-build-backend.sh"

# 4. Cleanup
rm backend.tar.gz

echo "✅ Direct deployment complete!"
