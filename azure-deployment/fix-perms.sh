#!/bin/bash
set -e

# Load Config
if [ ! -f acr_name.txt ]; then
    echo "❌ ACR name not found. Run setup-infra.sh first."
    exit 1
fi
RG_NAME="choco-gis"
VM_NAME="fiji-carbon-vm"

echo "🚀 Checking and Fixing Permissions on VM ($VM_NAME)..."

# Prepare Fix Script
cat <<EOF > vm-fix-perms.sh
#!/bin/bash
echo "--- Initial Permissions ---"
ls -ld /home/azureuser
ls -ld /home/azureuser/uploads

echo "--- Fixing Permissions ---"
# Allow others (Nginx) to traverse /home/azureuser
sudo chmod o+x /home/azureuser
# Ensure uploads dir is readable/executable
sudo chmod 755 /home/azureuser/uploads

echo "--- Final Permissions ---"
ls -ld /home/azureuser
ls -ld /home/azureuser/uploads

echo "✅ Permissions Updated!"
EOF

# Execute Script on VM
echo "Executing permission fix on VM..."
az vm run-command invoke \
  --resource-group $RG_NAME \
  --name $VM_NAME \
  --command-id RunShellScript \
  --scripts @vm-fix-perms.sh

rm vm-fix-perms.sh
echo "🎉 Fix Complete!"
