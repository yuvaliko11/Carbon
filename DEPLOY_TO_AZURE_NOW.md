# 🚀 Deploy to Azure Cloud (Container Apps)

We have upgraded the deployment strategy to use **Azure Container Apps**. This is a modern, serverless container platform that is easier to manage and scale than raw VMs.

## Prerequisites
- Azure CLI installed (`brew install azure-cli` on Mac).
- Logged in to Azure (`az login`).

## One-Command Deployment

We have automated the entire process. Just run:

```bash
./azure-deployment/deploy-vm.sh
```

This script will:
1.  **Setup Infrastructure**: Create Resource Group and Azure Container Registry (ACR).
2.  **Build & Push**: Build Docker images for Frontend and Backend and push them to ACR.
3.  **Deploy**: Create Container Apps for Frontend and Backend, linking them together.

## Manual Steps (if needed)

### 1. Setup Infrastructure
```bash
./azure-deployment/setup-infra.sh
```

### 2. Build and Push Images
```bash
./azure-deployment/build-and-push.sh
```

### 3. Deploy Containers
```bash
./azure-deployment/deploy-containers.sh
```

## Architecture
- **Frontend**: React App served by Nginx (Docker container).
- **Backend**: Node.js API (Docker container).
- **Database**: MongoDB Atlas (External).
- **Networking**: Frontend proxies `/api` requests to Backend via internal/external networking.

## Troubleshooting
- If `az login` fails, run it manually first.
- If build fails, check Docker is running locally (actually `az acr build` runs in cloud, so local Docker is not strictly required, but good for testing).
