#!/bin/bash
set -e

# Load Config
if [ ! -f acr_name.txt ]; then
    echo "❌ ACR name not found. Run setup-infra.sh first."
    exit 1
fi
RG_NAME="choco-gis"
VM_NAME="fiji-carbon-vm"

echo "🚀 Fixing Nginx Configuration on VM ($VM_NAME)..."

# Prepare Fix Script
cat <<EOF > vm-fix-nginx.sh
#!/bin/bash
set -e

echo "1. Updating Nginx Config..."
sudo tee /etc/nginx/sites-available/ctrade.facio.io > /dev/null <<EOL
server {
    server_name ctrade.facio.io;
    client_max_body_size 50M;

    location / {
        proxy_pass http://localhost:8080;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \\\$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \\\$host;
        proxy_cache_bypass \\\$http_upgrade;
        proxy_set_header X-Real-IP \\\$remote_addr;
        proxy_set_header X-Forwarded-For \\\$proxy_add_x_forwarded_for;
    }

    location /api {
        proxy_pass http://localhost:5002;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \\\$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \\\$host;
        proxy_cache_bypass \\\$http_upgrade;
        proxy_set_header X-Real-IP \\\$remote_addr;
        proxy_set_header X-Real-IP \\\$remote_addr;
        proxy_set_header X-Forwarded-For \\\$proxy_add_x_forwarded_for;
        proxy_read_timeout 300; # 5 minutes for OCR
    }

    location /uploads {
        # CHANGED: Use root instead of alias to avoid try_files issues
        root /home/azureuser;
        try_files \\\$uri \\\$uri/ =404;
        expires 30d;
        add_header Cache-Control "public, no-transform";
    }
}
EOL

echo "2. Testing and Reloading Nginx..."
sudo nginx -t
sudo systemctl reload nginx

echo "✅ Nginx Configuration Updated!"
EOF

# Execute Script on VM
echo "Executing fix on VM..."
az vm run-command invoke \
  --resource-group $RG_NAME \
  --name $VM_NAME \
  --command-id RunShellScript \
  --scripts @vm-fix-nginx.sh

rm vm-fix-nginx.sh
echo "🎉 Fix Complete!"
