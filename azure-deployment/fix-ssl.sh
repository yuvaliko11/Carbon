#!/bin/bash
set -e

# Load Config
if [ ! -f acr_name.txt ]; then
    echo "❌ ACR name not found. Run setup-infra.sh first."
    exit 1
fi
RG_NAME="choco-gis"
VM_NAME="fiji-carbon-vm"

echo "🚀 Restoring SSL on VM ($VM_NAME)..."

# Prepare Fix Script
cat <<EOF > vm-fix-ssl.sh
#!/bin/bash
set -e

echo "Running Certbot to reinstall SSL..."
# This will modify the nginx config to add SSL and redirect HTTP to HTTPS
sudo certbot --nginx -d ctrade.facio.io --non-interactive --agree-tos -m admin@facio.io --redirect --expand

echo "Reloading Nginx..."
sudo systemctl reload nginx

echo "✅ SSL Restored!"
EOF

# Execute Script on VM
echo "Executing SSL fix on VM..."
az vm run-command invoke \
  --resource-group $RG_NAME \
  --name $VM_NAME \
  --command-id RunShellScript \
  --scripts @vm-fix-ssl.sh \
  --query 'value[0].message' -o tsv

rm vm-fix-ssl.sh
echo "🎉 Fix Complete!"
