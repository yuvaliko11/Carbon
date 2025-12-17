#!/bin/bash

# Production Testing Script
# Run this to test all critical production features

echo "🧪 Starting Production Tests..."
echo ""

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Test 1: PM2 Status
echo "1️⃣  Testing PM2 Status..."
PM2_STATUS=$(pm2 jlist | jq -r '.[0].pm2_env.status' 2>/dev/null)
if [ "$PM2_STATUS" = "online" ]; then
    echo -e "${GREEN}✅ PM2: Backend is online${NC}"
else
    echo -e "${RED}❌ PM2: Backend is not online (status: $PM2_STATUS)${NC}"
    exit 1
fi

# Test 2: Health Check
echo ""
echo "2️⃣  Testing Health Endpoint..."
HEALTH_RESPONSE=$(curl -s http://localhost:5001/api/health)
if echo "$HEALTH_RESPONSE" | grep -q '"status":"ok"'; then
    echo -e "${GREEN}✅ Health: System is healthy${NC}"
elif echo "$HEALTH_RESPONSE" | grep -q '"status":"degraded"'; then
    echo -e "${YELLOW}⚠️  Health: System is degraded (DB may be connecting)${NC}"
else
    echo -e "${RED}❌ Health: System is unhealthy${NC}"
    echo "Response: $HEALTH_RESPONSE"
fi

# Test 3: Readiness Check
echo ""
echo "3️⃣  Testing Readiness..."
READY_RESPONSE=$(curl -s http://localhost:5001/api/ready)
if echo "$READY_RESPONSE" | grep -q '"status":"ready"'; then
    echo -e "${GREEN}✅ Readiness: System is ready${NC}"
else
    echo -e "${YELLOW}⚠️  Readiness: System not ready (DB may be connecting)${NC}"
fi

# Test 4: Liveness Check
echo ""
echo "4️⃣  Testing Liveness..."
LIVE_RESPONSE=$(curl -s http://localhost:5001/api/live)
if echo "$LIVE_RESPONSE" | grep -q '"status":"alive"'; then
    echo -e "${GREEN}✅ Liveness: Process is alive${NC}"
else
    echo -e "${RED}❌ Liveness: Process is not responding${NC}"
    exit 1
fi

# Test 5: Database Connection
echo ""
echo "5️⃣  Testing Database Connection..."
DB_STATE=$(curl -s http://localhost:5001/api/health | jq -r '.database.state' 2>/dev/null)
if [ "$DB_STATE" = "1" ]; then
    echo -e "${GREEN}✅ Database: Connected${NC}"
elif [ "$DB_STATE" = "2" ]; then
    echo -e "${YELLOW}⚠️  Database: Connecting...${NC}"
else
    echo -e "${RED}❌ Database: Not connected (state: $DB_STATE)${NC}"
fi

# Test 6: Memory Usage
echo ""
echo "6️⃣  Testing Memory Usage..."
MEMORY=$(pm2 jlist | jq -r '.[0].monit.memory' 2>/dev/null)
MEMORY_MB=$((MEMORY / 1024 / 1024))
if [ $MEMORY_MB -lt 500 ]; then
    echo -e "${GREEN}✅ Memory: ${MEMORY_MB}MB (healthy)${NC}"
elif [ $MEMORY_MB -lt 800 ]; then
    echo -e "${YELLOW}⚠️  Memory: ${MEMORY_MB}MB (moderate)${NC}"
else
    echo -e "${RED}❌ Memory: ${MEMORY_MB}MB (high)${NC}"
fi

# Test 7: Restart Count
echo ""
echo "7️⃣  Testing Restart Count..."
RESTARTS=$(pm2 jlist | jq -r '.[0].pm2_env.restart_time' 2>/dev/null)
if [ "$RESTARTS" = "0" ] || [ -z "$RESTARTS" ]; then
    echo -e "${GREEN}✅ Restarts: 0 (stable)${NC}"
elif [ "$RESTARTS" -lt 5 ]; then
    echo -e "${YELLOW}⚠️  Restarts: $RESTARTS (acceptable)${NC}"
else
    echo -e "${RED}❌ Restarts: $RESTARTS (too many)${NC}"
fi

# Test 8: Uptime
echo ""
echo "8️⃣  Testing Uptime..."
UPTIME=$(pm2 jlist | jq -r '.[0].pm2_env.pm_uptime' 2>/dev/null)
CURRENT_TIME=$(date +%s)
UPTIME_SECONDS=$((CURRENT_TIME - UPTIME / 1000))
UPTIME_MINUTES=$((UPTIME_SECONDS / 60))
if [ $UPTIME_MINUTES -gt 5 ]; then
    echo -e "${GREEN}✅ Uptime: ${UPTIME_MINUTES} minutes (stable)${NC}"
else
    echo -e "${YELLOW}⚠️  Uptime: ${UPTIME_MINUTES} minutes (recently started)${NC}"
fi

# Summary
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "📊 Test Summary"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "Backend Status: $PM2_STATUS"
echo "Memory Usage: ${MEMORY_MB}MB"
echo "Restarts: $RESTARTS"
echo "Uptime: ${UPTIME_MINUTES} minutes"
echo ""
echo "✅ All critical tests completed!"
echo ""
echo "Next steps:"
echo "1. Test frontend functionality manually"
echo "2. Check browser console for errors"
echo "3. Test all user flows"
echo "4. Review PRODUCTION_TESTING_CHECKLIST.md"
echo ""

