#!/bin/bash
set -e

# Load Config
if [ ! -f acr_name.txt ]; then
    echo "❌ ACR name not found. Run setup-infra.sh first."
    exit 1
fi
RG_NAME="choco-gis"
VM_NAME="fiji-carbon-vm"

echo "🚀 Diagnosing Nginx 404 on VM ($VM_NAME)..."

# Prepare Diag Script
cat <<EOF > vm-diag-nginx.sh
#!/bin/bash
echo "--- Current Nginx Config for /uploads ---"
grep -A 5 "location /uploads" /etc/nginx/sites-available/ctrade.facio.io

echo ""
echo "--- File Permissions ---"
ls -la /home/azureuser/uploads/ | head -n 5

echo ""
echo "--- Nginx Error Log (Last 10 lines) ---"
sudo tail -n 10 /var/log/nginx/error.log

echo ""
echo "--- Namei Check (Path Permissions) ---"
namei -nom /home/azureuser/uploads
EOF

# Execute Script on VM
az vm run-command invoke \
  --resource-group $RG_NAME \
  --name $VM_NAME \
  --command-id RunShellScript \
  --scripts @vm-diag-nginx.sh

rm vm-diag-nginx.sh
