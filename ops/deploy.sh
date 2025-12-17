#!/bin/bash

# One-command deployment - just run this!
# Handles everything automatically: backend, frontend, checks, restarts

cd "$(dirname "$0")"

echo "🚀 Starting Full Deployment..."
echo ""

# Deploy backend with auto-checks (Updates ACR & ACA)
bash azure-deployment/auto-deploy.sh

# Update VM (ctrade.facio.io)
bash azure-deployment/update-vm.sh

echo ""
echo "✅ All done! Your application is live at:"
echo "   https://gis.chocoinsurance.com"
echo ""

