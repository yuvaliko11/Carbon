#!/bin/bash
set -e

RG_NAME="choco-gis"
VM_NAME="fiji-carbon-vm"

echo "🌱 Seeding Demo User..."

# Create the seed script inside the running container and execute it
az vm run-command invoke \
  --resource-group $RG_NAME \
  --name $VM_NAME \
  --command-id RunShellScript \
  --scripts @azure-deployment/remote-seed-execution.sh

