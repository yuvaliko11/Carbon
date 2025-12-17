#!/bin/bash
set -e

RG_NAME="choco-gis"
VM_NAME="fiji-carbon-vm"

echo "🔍 Debugging VM..."

# Run diagnostics command on VM
az vm run-command invoke \
  --resource-group $RG_NAME \
  --name $VM_NAME \
  --command-id RunShellScript \
  --scripts "
    echo '--- Backend Logs ---'
    sudo docker logs fiji-backend --tail 50
  "
