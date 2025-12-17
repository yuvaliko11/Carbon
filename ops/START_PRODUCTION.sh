#!/bin/bash

# Start Production Backend
# This script starts the backend in production mode for testing

echo "🚀 Starting Production Backend..."
echo ""

# Stop any existing instances
pm2 delete gis-crm-backend 2>/dev/null

# Start with production config
cd "$(dirname "$0")"
pm2 start ecosystem.config.production.js --env production

# Wait for startup
echo "⏳ Waiting for server to start..."
sleep 5

# Check status
pm2 status

# Test health
echo ""
echo "🏥 Testing health endpoint..."
HEALTH=$(curl -s http://localhost:5001/api/health)
if echo "$HEALTH" | grep -q "status"; then
    echo "✅ Server is responding!"
    echo "$HEALTH" | jq '.' 2>/dev/null || echo "$HEALTH"
else
    echo "⚠️  Server may still be starting..."
    echo "Check logs with: pm2 logs gis-crm-backend"
fi

echo ""
echo "✅ Production backend started!"
echo ""
echo "Useful commands:"
echo "  pm2 status              - Check status"
echo "  pm2 logs gis-crm-backend - View logs"
echo "  pm2 monit               - Monitor resources"
echo "  ./test-production.sh    - Run tests"
echo ""

