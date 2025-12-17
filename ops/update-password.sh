#!/bin/bash

# סקריפט לעדכון password ב-Azure VM
# שימוש: ./update-password.sh YOUR_PASSWORD

if [ -z "$1" ]; then
    echo "❌ שגיאה: צריך לספק password"
    echo ""
    echo "שימוש:"
    echo "  ./update-password.sh YOUR_PASSWORD"
    echo ""
    echo "דוגמה:"
    echo "  ./update-password.sh TestPassword123"
    exit 1
fi

PASSWORD="$1"
VM_IP="20.217.208.150"
SSH_KEY="$HOME/.ssh/azure_vm_key"

echo "🔄 מעדכן את Azure VM עם password: $PASSWORD"
echo ""

# עדכן את ה-environment variable ב-Azure VM
ssh -i "$SSH_KEY" azureuser@$VM_IP "sudo systemctl stop choco-gis-backend && sudo sed -i 's|MONGODB_URI=.*|MONGODB_URI=\"mongodb+srv://bi_map_user:${PASSWORD}@cluster0.ini32ht.mongodb.net/bi_map_db?retryWrites=true\&w=majority\&appName=Cluster0\"|' /opt/choco-gis-backend/.env && sudo systemctl start choco-gis-backend" 2>&1

if [ $? -eq 0 ]; then
    echo ""
    echo "✅ Azure VM עודכן בהצלחה!"
    echo ""
    echo "⏳ ממתין 10 שניות לשרת להתחיל..."
    sleep 10
    
    echo ""
    echo "📊 בודק את הלוגים..."
    ssh -i "$SSH_KEY" azureuser@$VM_IP 'sudo journalctl -u choco-gis-backend -n 20 --no-pager' 2>&1 | grep -E "(Server running|MongoDB|Connected|✅|❌)" | tail -5
    
    echo ""
    echo "🧪 בודק את ה-API..."
    curl -s -X POST http://$VM_IP/api/auth/register \
      -H "Content-Type: application/json" \
      -d '{"name":"Test User","email":"test@test.com","password":"test123456"}' | python3 -m json.tool 2>/dev/null || curl -s -X POST http://$VM_IP/api/auth/register \
      -H "Content-Type: application/json" \
      -d '{"name":"Test User","email":"test@test.com","password":"test123456"}'
else
    echo ""
    echo "❌ שגיאה בעדכון Azure VM"
    exit 1
fi

