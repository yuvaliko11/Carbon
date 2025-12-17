#!/bin/bash

# Configuration
BACKEND_URL="http://20.217.208.150"
WAIT_MINUTES=15
WAIT_SECONDS=$((WAIT_MINUTES * 60))

echo "⏳ ממתין $WAIT_MINUTES דקות ל-MongoDB Atlas לעדכן את ה-IP whitelist..."
echo "📅 התחלה: $(date '+%H:%M:%S')"
echo "📅 סיום צפוי: $(date -v+${WAIT_MINUTES}M '+%H:%M:%S')"
echo ""

# Countdown
for i in $(seq $WAIT_SECONDS -1 1); do
  minutes=$((i / 60))
  seconds=$((i % 60))
  printf "\r⏳ נותרו: %02d:%02d דקות" $minutes $seconds
  sleep 1
done

echo ""
echo ""
echo "✅ סיימתי להמתין! בודק את החיבור עכשיו..."
echo ""

# Check backend health
echo "🩺 בודק backend health..."
HEALTH_RESPONSE=$(curl -s -o /dev/null -w "%{http_code}" "$BACKEND_URL/api/health")
if [ "$HEALTH_RESPONSE" -eq 200 ]; then
  echo "✅ Backend Health: OK"
else
  echo "❌ Backend Health: Failed (HTTP $HEALTH_RESPONSE)"
fi

echo ""
echo "🧪 בודק MongoDB connection via API..."
REGISTER_RESPONSE=$(curl -s -X POST "$BACKEND_URL/api/auth/register" \
  -H "Content-Type: application/json" \
  -d '{"name":"ConnectionTest","email":"connectiontest'$(date +%s)'@example.com","password":"Test123456"}')

echo ""
echo "📊 תגובת ה-API:"
echo "$REGISTER_RESPONSE" | jq .

echo ""

if echo "$REGISTER_RESPONSE" | grep -q '"success":true'; then
  echo "✅✅✅ MongoDB Connection SUCCESSFUL! ✅✅✅"
  echo "🎉 החיבור עובד! אתה יכול עכשיו להירשם ולהתחבר!"
  exit 0
elif echo "$REGISTER_RESPONSE" | grep -q '"message":"User already exists"'; then
  echo "✅ MongoDB Connection SUCCESSFUL! (User already exists)"
  echo "🎉 החיבור עובד!"
  exit 0
elif echo "$REGISTER_RESPONSE" | grep -q "Database connection not ready"; then
  echo "⏳ החיבור עדיין לא מוכן..."
  echo "💡 נסה שוב בעוד כמה דקות"
  exit 1
elif echo "$REGISTER_RESPONSE" | grep -q "IP.*whitelist"; then
  echo "❌ עדיין יש בעיה עם IP whitelist"
  echo "💡 בדוק שוב ב-MongoDB Atlas שכל ה-IPs הם Active"
  exit 1
else
  echo "❌ החיבור עדיין לא עובד"
  echo "💡 בדוק את הלוגים על ה-Azure VM:"
  echo "   ssh azureuser@20.217.208.150 'sudo journalctl -u choco-gis-backend -n 20'"
  exit 1
fi

