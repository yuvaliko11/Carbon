#!/bin/bash
set -e

# Configuration
RG_NAME="choco-gis"
LOCATION="australiaeast" # Close to Fiji
# Check if ACR name already exists
if [ -f acr_name.txt ]; then
    ACR_NAME=$(cat acr_name.txt)
    echo "Using existing ACR: $ACR_NAME"
else
    ACR_NAME="fijicarbonhubacr$RANDOM" # Random suffix to ensure uniqueness
fi

echo "🚀 Setting up Azure Infrastructure..."

# 1. Create Resource Group (Skipped - using existing)
echo "Using Resource Group: $RG_NAME..."
# az group create --name $RG_NAME --location $LOCATION

# 2. Create Azure Container Registry
echo "Creating Container Registry (ACR)..."
# Check if ACR name is available, if not, generate new one
while ! az acr check-name --name $ACR_NAME --query "nameAvailable" -o tsv; do
  ACR_NAME="fijicarbonhubacr$RANDOM"
done

az acr create --resource-group $RG_NAME --name $ACR_NAME --sku Basic --admin-enabled true

# 3. Save ACR name to a file for other scripts to use
echo $ACR_NAME > acr_name.txt
echo $RG_NAME > rg_name.txt

echo "✅ Infrastructure Setup Complete!"
echo "Resource Group: $RG_NAME"
echo "ACR Name: $ACR_NAME"
