#!/bin/bash
set -e

# Load Config
if [ ! -f acr_name.txt ]; then
    echo "❌ ACR name not found. Run setup-infra.sh first."
    exit 1
fi
RG_NAME="choco-gis"
VM_NAME="fiji-carbon-vm"

echo "🚀 Restoring Nginx Configuration on VM ($VM_NAME)..."

# Prepare Restore Script
cat <<EOF > vm-restore-nginx.sh
#!/bin/bash
set -e

echo "1. Restoring Nginx Config..."
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
        proxy_set_header X-Forwarded-For \\\$proxy_add_x_forwarded_for;
    }

    location /uploads {
        alias /home/azureuser/uploads;
        try_files \\\$uri \\\$uri/ =404;
        expires 30d;
        add_header Cache-Control "public, no-transform";
    }
}
EOL

echo "2. Testing and Restarting Nginx..."
sudo nginx -t
sudo systemctl restart nginx
sudo systemctl status nginx --no-pager

echo "✅ Nginx Restored!"
EOF

# Execute Script on VM
echo "Executing restore on VM..."
az vm run-command invoke \
  --resource-group $RG_NAME \
  --name $VM_NAME \
  --command-id RunShellScript \
  --scripts @vm-restore-nginx.sh

rm vm-restore-nginx.sh
echo "🎉 Restore Complete!"
