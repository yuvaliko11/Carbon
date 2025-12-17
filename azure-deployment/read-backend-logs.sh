#!/bin/bash
set -e

# Load Config
if [ ! -f acr_name.txt ]; then
    echo "❌ ACR name not found. Run setup-infra.sh first."
    exit 1
fi
RG_NAME="choco-gis"
VM_NAME="fiji-carbon-vm"

echo "🚀 Fetching Backend Logs from VM ($VM_NAME)..."

# Execute Script on VM
az vm run-command invoke \
  --resource-group $RG_NAME \
  --name $VM_NAME \
  --command-id RunShellScript \
  --scripts "sudo docker logs fiji-backend 2>&1 | grep -E 'AI SERVICE VERSION|DEBUG:|Text snippet|Regex|Rent|Analyzing|OCR|PDF Text|Error|Attempting'"
