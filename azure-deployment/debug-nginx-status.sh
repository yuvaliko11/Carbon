#!/bin/bash
set -e

# Load Config
if [ ! -f acr_name.txt ]; then
    echo "❌ ACR name not found. Run setup-infra.sh first."
    exit 1
fi
RG_NAME="choco-gis"
VM_NAME="fiji-carbon-vm"

echo "🚀 Checking Nginx Status on VM ($VM_NAME)..."

# Prepare Debug Script
cat <<EOF > vm-debug-nginx.sh
#!/bin/bash
echo "--- Nginx Service Status ---"
sudo systemctl status nginx --no-pager

echo ""
echo "--- Nginx Config Timeout Settings ---"
grep "timeout" /etc/nginx/sites-enabled/ctrade.facio.io

echo ""
echo "--- Nginx Config Test ---"
sudo nginx -t

echo ""
echo "--- Nginx Error Logs (Last 20 lines) ---"
sudo tail -n 20 /var/log/nginx/error.log
EOF

# Execute Script on VM
az vm run-command invoke \
  --resource-group $RG_NAME \
  --name $VM_NAME \
  --command-id RunShellScript \
  --scripts @vm-debug-nginx.sh \
  --query 'value[0].message' -o tsv

rm vm-debug-nginx.sh
