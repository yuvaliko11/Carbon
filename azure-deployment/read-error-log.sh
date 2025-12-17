#!/bin/bash
set -e

# Load Config
if [ ! -f acr_name.txt ]; then
    echo "❌ ACR name not found. Run setup-infra.sh first."
    exit 1
fi
RG_NAME="choco-gis"
VM_NAME="fiji-carbon-vm"

echo "🚀 Reading Nginx Error Log on VM ($VM_NAME)..."

# Prepare Read Script
cat <<EOF > vm-read-error-log.sh
#!/bin/bash
sudo tail -n 20 /var/log/nginx/error.log
EOF

# Execute Script on VM
az vm run-command invoke \
  --resource-group $RG_NAME \
  --name $VM_NAME \
  --command-id RunShellScript \
  --scripts @vm-read-error-log.sh

rm vm-read-error-log.sh
