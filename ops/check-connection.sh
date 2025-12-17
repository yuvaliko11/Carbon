#!/bin/bash

# סקריפט לבדיקת חיבור MongoDB אוטומטית
# בודק כל 10 שניות אם החיבור עובד

export PATH="$HOME/google-cloud-sdk/bin:$PATH"

echo "🔍 בודק חיבור MongoDB כל 10 שניות..."
echo "להפסיק: Ctrl+C"
echo ""

COUNTER=0
MAX_ATTEMPTS=60  # 10 דקות

while [ $COUNTER -lt $MAX_ATTEMPTS ]; do
    COUNTER=$((COUNTER + 1))
    
    echo "[$COUNTER] בודק..."
    
    # נסה ליצור משתמש
    RESPONSE=$(curl -s -X POST http://20.217.208.150/api/auth/register \
        -H "Content-Type: application/json" \
        -d "{\"name\":\"Test User\",\"email\":\"test$(date +%s)@test.com\",\"password\":\"test123456\"}")
    
    # בדוק אם זה עבד
    if echo "$RESPONSE" | grep -q '"success":true'; then
        echo ""
        echo "✅ ✅ ✅ עובד! החיבור הצליח! ✅ ✅ ✅"
        echo ""
        echo "תגובה:"
        echo "$RESPONSE" | python3 -m json.tool 2>/dev/null || echo "$RESPONSE"
        exit 0
    fi
    
    # בדוק את הלוגים
    LOGS=$(ssh -i "$HOME/.ssh/azure_vm_key" azureuser@20.217.208.150 'sudo journalctl -u choco-gis-backend -n 20 --no-pager' 2>&1 | grep -E "(MongoDB|Connected|✅|❌)" | tail -1)
    
    if echo "$LOGS" | grep -q "✅ MongoDB Connected"; then
        echo "✅ MongoDB Connected בלוגים!"
        echo "$LOGS"
        exit 0
    fi
    
    if echo "$RESPONSE" | grep -q "buffering timed out"; then
        echo "⏳ עדיין ממתין... (buffering timeout)"
    elif echo "$RESPONSE" | grep -q "bad auth"; then
        echo "❌ עדיין יש בעיית authentication"
    else
        echo "⏳ עדיין ממתין... ($RESPONSE)"
    fi
    
    sleep 10
done

echo ""
echo "⏰ הגעת למקסימום ניסיונות (10 דקות)"
echo "החיבור עדיין לא עובד. בדוק את ה-password ב-MongoDB Atlas."

