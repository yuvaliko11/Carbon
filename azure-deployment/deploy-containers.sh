#!/bin/bash
set -e

# Load Config
if [ ! -f acr_name.txt ] || [ ! -f rg_name.txt ]; then
    echo "❌ Configuration not found. Run setup-infra.sh first."
    exit 1
fi
ACR_NAME=$(cat acr_name.txt)
RG_NAME=$(cat rg_name.txt)
LOCATION="australiaeast"
ENV_NAME="fiji-carbon-env"

# MongoDB URI (Default from docker-compose, can be overridden)
MONGODB_URI=${MONGODB_URI:-"mongodb+srv://bi_map_user:GNKVfBppbsTL7nH5@cluster0.ini32ht.mongodb.net/fiji_carbon_db?retryWrites=true&w=majority&appName=Cluster0"}

echo "🚀 Deploying to Azure Container Apps..."

# 1. Create Container App Environment
echo "Creating Environment: $ENV_NAME..."
az containerapp env create \
  --name $ENV_NAME \
  --resource-group $RG_NAME \
  --location $LOCATION

# 2. Deploy Backend
echo "🚀 Deploying Backend..."
az containerapp create \
  --name fiji-backend \
  --resource-group $RG_NAME \
  --environment $ENV_NAME \
  --image $ACR_NAME.azurecr.io/fiji-backend:latest \
  --target-port 5002 \
  --ingress external \
  --registry-server $ACR_NAME.azurecr.io \
  --env-vars MONGODB_URI="$MONGODB_URI" PORT=5002 NODE_ENV=production \
  --query properties.configuration.ingress.fqdn

# Get Backend URL
BACKEND_FQDN=$(az containerapp show --name fiji-backend --resource-group $RG_NAME --query properties.configuration.ingress.fqdn -o tsv)
BACKEND_URL="https://$BACKEND_FQDN"
echo "✅ Backend deployed at: $BACKEND_URL"

# 3. Deploy Frontend
echo "🚀 Deploying Frontend..."
az containerapp create \
  --name fiji-frontend \
  --resource-group $RG_NAME \
  --environment $ENV_NAME \
  --image $ACR_NAME.azurecr.io/fiji-frontend:latest \
  --target-port 80 \
  --ingress external \
  --registry-server $ACR_NAME.azurecr.io \
  --env-vars BACKEND_URL="$BACKEND_URL" \
  --query properties.configuration.ingress.fqdn

FRONTEND_FQDN=$(az containerapp show --name fiji-frontend --resource-group $RG_NAME --query properties.configuration.ingress.fqdn -o tsv)
echo ""
echo "🎉 Deployment Complete!"
echo "🌍 Frontend: https://$FRONTEND_FQDN"
echo "🔌 Backend: $BACKEND_URL"
