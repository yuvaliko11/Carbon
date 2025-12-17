#!/bin/bash

# Start backend with PM2 (if not already running)
cd "$(dirname "$0")"
if ! pm2 list | grep -q "gis-crm-backend.*online"; then
    echo "🚀 Starting backend server with PM2..."
    pm2 start ecosystem.config.js
    pm2 save
else
    echo "✅ Backend server is already running"
fi

# Start frontend
echo "🚀 Starting frontend..."
cd frontend
npm start
