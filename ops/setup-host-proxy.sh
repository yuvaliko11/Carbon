#!/bin/bash
set -e

DOMAIN="ctrade.facio.io"
EMAIL="admin@facio.io" # Placeholder email

echo "🚀 Setting up Nginx Reverse Proxy & SSL for $DOMAIN..."

# 1. Install Nginx and Certbot
echo "📦 Installing Nginx and Certbot..."
sudo apt-get update
sudo apt-get install -y nginx certbot python3-certbot-nginx

# 2. Configure Nginx
echo "⚙️  Configuring Nginx..."
sudo tee /etc/nginx/sites-available/$DOMAIN > /dev/null <<EOL
server {
    server_name $DOMAIN;

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
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    }

    # Optional: Proxy API directly if needed, but frontend Nginx handles it.
    # We just forward everything to the frontend container.
}
EOL

# 3. Enable Site
echo "🔗 Enabling site..."
sudo ln -sf /etc/nginx/sites-available/$DOMAIN /etc/nginx/sites-enabled/
sudo rm -f /etc/nginx/sites-enabled/default # Remove default if it exists
sudo nginx -t
sudo systemctl reload nginx

# 4. Obtain SSL Certificate
echo "🔒 Obtaining SSL Certificate..."
# Use --non-interactive and --agree-tos
sudo certbot --nginx -d $DOMAIN --non-interactive --agree-tos -m $EMAIL --redirect

echo "✅ HTTPS Setup Complete for $DOMAIN!"
