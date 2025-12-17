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
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_cache_bypass \$http_upgrade;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
    }

    location /api {
        proxy_pass http://localhost:5002; # Forward to Backend Container
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_cache_bypass \$http_upgrade;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
    }

    location /uploads {
        root /home/azureuser;
        try_files $uri $uri/ =404;
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
echo "Logging into ACR..."
echo "${ACR_PASSWORD:-"<your_password>"}" | sudo docker login fijicarbonhubacr16944.azurecr.io -u "fijicarbonhubacr16944" --password-stdin

# 6. Stop and Remove Existing Containers
sudo docker stop fiji-frontend fiji-backend || true
sudo docker rm fiji-frontend fiji-backend || true

# 7. Pull Latest Images
sudo docker pull fijicarbonhubacr16944.azurecr.io/fiji-backend:latest
sudo docker pull fijicarbonhubacr16944.azurecr.io/fiji-frontend:latest

# 8. Create Network
sudo docker network create fiji-net || true

# Read OpenAI Key
if [ -f openai_key.txt ]; then
    OPENAI_API_KEY="${OPENAI_API_KEY:-<your_openai_key>}"
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
sudo docker run -d --restart always -p 5002:5002 \
  --network fiji-net \
  -v /home/azureuser/uploads:/app/uploads \
  -e PORT=5002 \
  -e MONGODB_URI="${MONGODB_URI:-<your_mongodb_uri>}" \
  -e NODE_ENV=production \
  -e JWT_SECRET="${JWT_SECRET:-<your_jwt_secret>}" \
  -e OPENAI_API_KEY="${OPENAI_API_KEY:-'<your_key>'}" \
  --name fiji-backend \
  fijicarbonhubacr16944.azurecr.io/fiji-backend:latest

# Frontend on 8080 (Proxied by Nginx)
sudo docker run -d --restart always -p 8080:80 \
  --network fiji-net \
  -e REACT_APP_API_URL="/api"   -e BACKEND_URL="http://fiji-backend:5002"   --name fiji-frontend \
  fijicarbonhubacr16944.azurecr.io/fiji-frontend:latest

# 10. Obtain SSL Certificate (if not exists)
# We use --expand to update existing certs if needed
sudo certbot --nginx -d ctrade.facio.io --non-interactive --agree-tos -m admin@facio.io --redirect --expand || echo "Certbot failed or already set up"

