#!/bin/bash
set -e

VM_IP="4.197.177.231"
VM_USER="azureuser"

echo "📦 Packaging frontend..."
# Exclude node_modules to keep tarball small
tar --exclude='node_modules' --exclude='.git' -czf frontend.tar.gz -C frontend .

echo "🚀 Uploading to VM..."
scp frontend.tar.gz ${VM_USER}@${VM_IP}:~/frontend.tar.gz
scp remote-build.sh ${VM_USER}@${VM_IP}:~/remote-build.sh

echo "🔨 Building and Deploying on VM..."
ssh ${VM_USER}@${VM_IP} "chmod +x ~/remote-build.sh && ~/remote-build.sh"

echo "🧹 Cleaning up local tarball..."
rm frontend.tar.gz

echo "✅ Frontend deployment triggered!"
