#!/bin/bash
set -e

# Load Config
if [ ! -f acr_name.txt ]; then
    echo "❌ ACR name not found. Run setup-infra.sh first."
    exit 1
fi
ACR_NAME=$(cat acr_name.txt)
RG_NAME="choco-gis"
VM_NAME="fiji-carbon-vm"

echo "🚀 Updating Containers on VM ($VM_NAME)..."

# Get ACR Credentials
echo "Getting ACR credentials..."
ACR_USERNAME=$(az acr credential show --name $ACR_NAME --query "username" -o tsv)
ACR_PASSWORD=$(az acr credential show --name $ACR_NAME --query "passwords[0].value" -o tsv)

# Read OpenAI Key
if [ -f openai_key.txt ]; then
    OPENAI_API_KEY=$(cat openai_key.txt)
else
    echo "⚠️ openai_key.txt not found. AI features will be disabled."
    OPENAI_API_KEY=""
fi

# Prepare Update Script
cat <<EOF > vm-update-temp.sh
#!/bin/bash
set -e

echo "1. Login to ACR..."
echo "$ACR_PASSWORD" | sudo docker login $ACR_NAME.azurecr.io -u "$ACR_USERNAME" --password-stdin

echo "2. Pull Latest Images..."
sudo docker pull $ACR_NAME.azurecr.io/fiji-backend:latest
sudo docker pull $ACR_NAME.azurecr.io/fiji-frontend:latest

echo "3. Restart Containers..."
sudo docker stop fiji-backend fiji-frontend || true
sudo docker rm fiji-backend fiji-frontend || true

# Backend
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

# Frontend
sudo docker run -d --restart always -p 8080:80 \\
  --network fiji-net \\
  -e REACT_APP_API_URL="/api" \\
  -e BACKEND_URL="http://fiji-backend:5002" \\
  --name fiji-frontend \\
  $ACR_NAME.azurecr.io/fiji-frontend:latest

echo "✅ Containers Updated!"
EOF

# Execute Script on VM
echo "Executing update on VM..."
az vm run-command invoke \
  --resource-group $RG_NAME \
  --name $VM_NAME \
  --command-id RunShellScript \
  --scripts @vm-update-temp.sh

rm vm-update-temp.sh
echo "🎉 Update Complete!"
