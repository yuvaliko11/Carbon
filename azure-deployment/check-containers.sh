#!/bin/bash
RG_NAME="choco-gis"
VM_NAME="fiji-carbon-vm"

echo "🔍 Checking Containers on VM..."

az vm run-command invoke \
  --resource-group $RG_NAME \
  --name $VM_NAME \
  --command-id RunShellScript \
  --scripts "sudo docker ps -a"
