#!/bin/bash

# Configuration
BACKEND_URL="http://20.217.208.150"
INTERVAL=30 # seconds
MAX_ATTEMPTS=20 # 20 attempts * 30 seconds = 10 minutes

echo "🔍 Starting MongoDB connection check..."
echo "Will check every $INTERVAL seconds for up to $((MAX_ATTEMPTS * INTERVAL / 60)) minutes."
echo ""

attempt=0
while [ $attempt -lt $MAX_ATTEMPTS ]; do
  attempt=$((attempt + 1))
  echo "--- Attempt $attempt/$MAX_ATTEMPTS ($(date '+%H:%M:%S')) ---"

  # Check backend health
  HEALTH_RESPONSE=$(curl -s -o /dev/null -w "%{http_code}" "$BACKEND_URL/api/health")
  if [ "$HEALTH_RESPONSE" -eq 200 ]; then
    echo "✅ Backend Health: OK"
  else
    echo "❌ Backend Health: Failed (HTTP $HEALTH_RESPONSE)"
  fi

  # Check MongoDB connection via API
  echo "🧪 Testing MongoDB connection via API..."
  REGISTER_RESPONSE=$(curl -s -X POST "$BACKEND_URL/api/auth/register" \
    -H "Content-Type: application/json" \
    -d '{"name":"ConnectionTest","email":"connectiontest'$attempt'@example.com","password":"Test123456"}')
  
  if echo "$REGISTER_RESPONSE" | grep -q '"success":true'; then
    echo "✅✅✅ MongoDB Connection SUCCESSFUL! ✅✅✅"
    echo "🎉 You can now register users and use the application!"
    exit 0
  elif echo "$REGISTER_RESPONSE" | grep -q '"message":"User already exists"'; then
    echo "✅ MongoDB Connection SUCCESSFUL! (User already exists)"
    echo "🎉 Connection is working!"
    exit 0
  elif echo "$REGISTER_RESPONSE" | grep -q "buffering timed out\|Cannot call.*before initial connection"; then
    echo "⏳ MongoDB connection not ready yet..."
  elif echo "$REGISTER_RESPONSE" | grep -q "IP.*whitelist"; then
    echo "⏳ IP whitelist not updated yet..."
  else
    echo "⏳ Still waiting... Response: $(echo $REGISTER_RESPONSE | jq -r '.message' 2>/dev/null || echo $REGISTER_RESPONSE)"
  fi

  # Check logs
  echo "📊 Checking recent logs on Azure VM..."
  LOGS=$(ssh -i "$HOME/.ssh/azure_vm_key" azureuser@20.217.208.150 'sudo journalctl -u choco-gis-backend -n 20 --no-pager' 2>&1 | grep -E "(MongoDB Connected|✅ MongoDB)" | tail -1)
  
  if [ ! -z "$LOGS" ]; then
    echo "✅ Found in logs: $LOGS"
    echo "🎉 MongoDB connection established!"
    exit 0
  fi

  echo "Waiting $INTERVAL seconds before next check..."
  echo ""
  sleep $INTERVAL
done

echo ""
echo "⏰ Reached maximum attempts. MongoDB connection may still be pending."
echo "💡 MongoDB Atlas can take 10-15 minutes to update IP whitelist."
echo "💡 Please check MongoDB Atlas → Network Access to ensure all IPs are Active."
exit 1

