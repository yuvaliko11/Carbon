# Update Azure VM Server Code

The Azure VM server has old code. You need to update it with the new files.

## Option 1: Copy Files via SCP (Recommended)

Run these commands from your local machine:

```bash
# Copy the new assets route file
scp -i "/Users/yuvaliko/.ssh/azure_vm_key" \
  "/Users/yuvaliko/Desktop/Choco GIS CRM/backend/routes/assets.js" \
  azureuser@20.217.208.150:/tmp/assets.js

# Copy the updated server.js
scp -i "/Users/yuvaliko/.ssh/azure_vm_key" \
  "/Users/yuvaliko/Desktop/Choco GIS CRM/backend/server.js" \
  azureuser@20.217.208.150:/tmp/server.js

# Copy the updated Asset model
scp -i "/Users/yuvaliko/.ssh/azure_vm_key" \
  "/Users/yuvaliko/Desktop/Choco GIS CRM/backend/models/Asset.js" \
  azureuser@20.217.208.150:/tmp/Asset.js

# Copy the updated asset controller
scp -i "/Users/yuvaliko/.ssh/azure_vm_key" \
  "/Users/yuvaliko/Desktop/Choco GIS CRM/backend/controllers/assetController.js" \
  azureuser@20.217.208.150:/tmp/assetController.js

# Copy the updated validation middleware
scp -i "/Users/yuvaliko/.ssh/azure_vm_key" \
  "/Users/yuvaliko/Desktop/Choco GIS CRM/backend/middleware/validation.js" \
  azureuser@20.217.208.150:/tmp/validation.js

# Copy the updated Site model
scp -i "/Users/yuvaliko/.ssh/azure_vm_key" \
  "/Users/yuvaliko/Desktop/Choco GIS CRM/backend/models/Site.js" \
  azureuser@20.217.208.150:/tmp/Site.js

# Then SSH in and move files
ssh -i "/Users/yuvaliko/.ssh/azure_vm_key" azureuser@20.217.208.150 << 'EOF'
sudo cp /tmp/assets.js /opt/choco-gis-backend/routes/assets.js
sudo cp /tmp/server.js /opt/choco-gis-backend/server.js
sudo cp /tmp/Asset.js /opt/choco-gis-backend/models/Asset.js
sudo cp /tmp/assetController.js /opt/choco-gis-backend/controllers/assetController.js
sudo cp /tmp/validation.js /opt/choco-gis-backend/middleware/validation.js
sudo cp /tmp/Site.js /opt/choco-gis-backend/models/Site.js
sudo chown -R appuser:appuser /opt/choco-gis-backend
sudo rm /opt/choco-gis-backend/routes/properties.js
sudo pkill -u appuser -f "node server.js"
cd /opt/choco-gis-backend
sudo -u appuser /usr/bin/node server.js > /tmp/app.log 2>&1 &
EOF
```

## Option 2: Use Git (if you have git on VM)

```bash
ssh -i "/Users/yuvaliko/.ssh/azure_vm_key" azureuser@20.217.208.150
cd /opt/choco-gis-backend
sudo -u appuser git pull
sudo pkill -u appuser -f "node server.js"
sudo -u appuser /usr/bin/node server.js > /tmp/app.log 2>&1 &
```



