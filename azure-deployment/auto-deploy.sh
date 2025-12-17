#!/bin/bash
set -e

echo "🚀 Starting Full Cloud Deployment..."

# 1. Setup Infrastructure
./azure-deployment/setup-infra.sh

# 2. Build and Push
./azure-deployment/build-and-push.sh

# 3. Deploy Containers
./azure-deployment/deploy-containers.sh

echo ""
echo "✅ All steps completed successfully!"
