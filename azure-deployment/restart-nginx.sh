#!/bin/bash
set -e

# Load Config
if [ ! -f acr_name.txt ]; then
    echo "❌ ACR name not found. Run setup-infra.sh first."
    exit 1
fi
RG_NAME="choco-gis"
VM_NAME="fiji-carbon-vm"

echo "🚀 Restarting Nginx on VM ($VM_NAME)..."

# Prepare Restart Script
cat <<EOF > vm-restart-nginx.sh
#!/bin/bash
echo "Stopping Nginx..."
sudo systemctl stop nginx
echo "Starting Nginx..."
sudo systemctl start nginx
echo "Checking Status..."
sudo systemctl status nginx --no-pager
EOF

# Execute Script on VM
az vm run-command invoke \
  --resource-group $RG_NAME \
  --name $VM_NAME \
  --command-id RunShellScript \
  --scripts @vm-restart-nginx.sh

rm vm-restart-nginx.sh
