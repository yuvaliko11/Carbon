#!/bin/bash
set -e

# Load Config
if [ ! -f acr_name.txt ]; then
    echo "❌ ACR name not found. Run setup-infra.sh first."
    exit 1
fi
RG_NAME="choco-gis"
VM_NAME="fiji-carbon-vm"

echo "🚀 Safely Fixing Nginx Config on VM ($VM_NAME)..."

# Prepare Fix Script
cat <<EOF > vm-safe-fix-nginx.sh
#!/bin/bash
set -e

echo "1. Backing up config..."
sudo cp /etc/nginx/sites-available/ctrade.facio.io /etc/nginx/sites-available/ctrade.facio.io.bak

echo "2. Modifying config (alias -> root)..."
# Replace 'alias /home/azureuser/uploads;' with 'root /home/azureuser;'
sudo sed -i 's|alias /home/azureuser/uploads;|root /home/azureuser;|g' /etc/nginx/sites-available/ctrade.facio.io

echo "3. Testing and Reloading Nginx..."
sudo nginx -t
sudo systemctl reload nginx

echo "✅ Nginx Config Updated!"
EOF

# Execute Script on VM
echo "Executing safe fix on VM..."
az vm run-command invoke \
  --resource-group $RG_NAME \
  --name $VM_NAME \
  --command-id RunShellScript \
  --scripts @vm-safe-fix-nginx.sh

rm vm-safe-fix-nginx.sh
echo "🎉 Fix Complete!"
