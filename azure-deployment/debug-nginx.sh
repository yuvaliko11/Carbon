#!/bin/bash
set -e

RG_NAME="choco-gis"
VM_NAME="fiji-carbon-vm"

echo "🔍 Debugging Nginx and Docker on VM..."

az vm run-command invoke \
  --resource-group $RG_NAME \
  --name $VM_NAME \
  --command-id RunShellScript \
  --scripts "
    echo '--- Nginx Status ---'
    sudo systemctl status nginx --no-pager
    
    echo '--- Nginx Configuration ---'
    cat /etc/nginx/sites-enabled/ctrade.facio.io
    
    echo '--- Nginx Error Logs ---'
    sudo tail -n 20 /var/log/nginx/error.log
    
    echo '--- Docker Containers ---'
    sudo docker ps
    
    echo '--- Backend Logs ---'
    sudo docker logs fiji-backend --tail 20
    
    echo '--- Uploads Directory ---'
    ls -la /home/azureuser/uploads
    
    echo '--- Backend Uploads Mount ---'
    sudo docker inspect -f '{{ .Mounts }}' fiji-backend
  "
