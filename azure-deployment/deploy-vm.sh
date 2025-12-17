#!/bin/bash
set -e

# Load Config
if [ ! -f acr_name.txt ]; then
    echo "❌ ACR name not found. Run setup-infra.sh first."
    exit 1
fi
ACR_NAME=$(cat acr_name.txt)
RG_NAME="choco-gis" # Using existing RG
VM_NAME="fiji-carbon-vm"
LOCATION="australiaeast"

echo "🚀 Deploying to Azure VM ($VM_NAME)..."

# 1. Create VM
# 1. Create VM (Skipped to avoid SSH key prompt)
# echo "Creating VM..."
# az vm create \
#   --resource-group $RG_NAME \
#   --name $VM_NAME \
#   --image Ubuntu2204 \
#   --admin-username azureuser \
#   --generate-ssh-keys \
#   --size Standard_B2s \
#   --public-ip-sku Standard \
#   --location $LOCATION

# 2. Open Ports (Skipped)
# echo "Opening Ports..."
# az vm open-port --resource-group $RG_NAME --name $VM_NAME --port 80 --priority 1010
# az vm open-port --resource-group $RG_NAME --name $VM_NAME --port 5002 --priority 1020

# 3. Get Public IP
IP_ADDRESS=$(az vm show --show-details --resource-group $RG_NAME --name $VM_NAME --query publicIps -o tsv)
echo "VM IP: $IP_ADDRESS"

# 3b. Get ACR Credentials
echo "Getting ACR credentials..."
ACR_USERNAME=$(az acr credential show --name $ACR_NAME --query "username" -o tsv)
ACR_PASSWORD=$(az acr credential show --name $ACR_NAME --query "passwords[0].value" -o tsv)

# 4. Prepare Deployment Script for VM
echo "Preparing VM setup script..."
cat <<EOF > vm-setup.sh
#!/bin/bash
set -e

# 1. Install Nginx and Certbot
sudo apt-get update
sudo apt-get install -y nginx certbot python3-certbot-nginx

# 2. Configure Nginx
sudo tee /etc/nginx/sites-available/ctrade.facio.io > /dev/null <<EOL
server {
    server_name ctrade.facio.io;
    client_max_body_size 50M;

    location / {
        proxy_pass http://localhost:8080; # Forward to Frontend Container
        proxy_http_version 1.1;
        proxy_set_header Upgrade \\\$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \\\$host;
        proxy_cache_bypass \\\$http_upgrade;
        proxy_set_header X-Real-IP \\\$remote_addr;
        proxy_set_header X-Forwarded-For \\\$proxy_add_x_forwarded_for;
    }

    location /api {
        proxy_pass http://localhost:5002; # Forward to Backend Container
        proxy_http_version 1.1;
        proxy_set_header Upgrade \\\$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \\\$host;
        proxy_cache_bypass \\\$http_upgrade;
        proxy_set_header X-Real-IP \\\$remote_addr;
        proxy_set_header X-Forwarded-For \\\$proxy_add_x_forwarded_for;
    }

    location /uploads {
        root /home/azureuser;
        try_files \$uri \$uri/ =404;
        expires 30d;
        add_header Cache-Control "public, no-transform";
    }
}
EOL

# 3. Enable Site
sudo ln -sf /etc/nginx/sites-available/ctrade.facio.io /etc/nginx/sites-enabled/
sudo rm -f /etc/nginx/sites-enabled/default
sudo nginx -t
sudo systemctl reload nginx

# 4. Install Docker
if ! command -v docker &> /dev/null; then
    curl -fsSL https://get.docker.com -o get-docker.sh
    sudo sh get-docker.sh
    sudo usermod -aG docker azureuser
fi

# 5. Login to ACR
echo "$ACR_PASSWORD" | sudo docker login $ACR_NAME.azurecr.io -u "$ACR_USERNAME" --password-stdin

# 6. Stop and Remove Existing Containers
sudo docker stop fiji-frontend fiji-backend || true
sudo docker rm fiji-frontend fiji-backend || true

# 7. Pull Latest Images
sudo docker pull $ACR_NAME.azurecr.io/fiji-backend:latest
sudo docker pull $ACR_NAME.azurecr.io/fiji-frontend:latest

# 8. Create Network
sudo docker network create fiji-net || true

# Read OpenAI Key
if [ -f openai_key.txt ]; then
    OPENAI_API_KEY=$(cat openai_key.txt)
else
    echo "⚠️ openai_key.txt not found. AI features will be disabled."
    OPENAI_API_KEY=""
fi

# 9. Run Containers
# Create uploads directory
mkdir -p /home/azureuser/uploads
sudo chown -R 1000:1000 /home/azureuser/uploads
sudo chmod -R 755 /home/azureuser/uploads

# Backend on 5002
sudo docker run -d --restart always -p 5002:5002 \\
  --network fiji-net \\
  -v /home/azureuser/uploads:/app/uploads \\
  -e PORT=5002 \\
  -e MONGODB_URI="mongodb+srv://bi_map_user:GNKVfBppbsTL7nH5@cluster0.ini32ht.mongodb.net/fiji_carbon_db?retryWrites=true&w=majority&appName=Cluster0" \\
  -e NODE_ENV=production \\
  -e JWT_SECRET="production_secret_key_secure_123" \\
  -e OPENAI_API_KEY="$OPENAI_API_KEY" \\
  --name fiji-backend \\
  $ACR_NAME.azurecr.io/fiji-backend:latest

# Frontend on 8080 (Proxied by Nginx)
sudo docker run -d --restart always -p 8080:80 \\
  --network fiji-net \\
  -e REACT_APP_API_URL="/api" \
  -e BACKEND_URL="http://fiji-backend:5002" \
  --name fiji-frontend \\
  $ACR_NAME.azurecr.io/fiji-frontend:latest

# 10. Obtain SSL Certificate (if not exists)
# We use --expand to update existing certs if needed
sudo certbot --nginx -d ctrade.facio.io --non-interactive --agree-tos -m admin@facio.io --redirect --expand || echo "Certbot failed or already set up"

EOF

# 5. Execute Script on VM
echo "Configuring VM and starting containers..."
az vm run-command invoke \
  --resource-group $RG_NAME \
  --name $VM_NAME \
  --command-id RunShellScript \
  --scripts @vm-setup.sh

echo ""
echo "🎉 Deployment Complete!"
echo "🌍 URL: http://$IP_ADDRESS"
