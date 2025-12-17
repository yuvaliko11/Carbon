#!/bin/bash
set -e

VM_IP="4.197.177.231"
VM_USER="azureuser"

echo "🔍 Connecting to VM to debug..."

ssh ${VM_USER}@${VM_IP} << ENDSSH
    echo "📊 Docker Containers:"
    docker ps --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}"
    
    echo ""
    echo "📝 Frontend Logs:"
    docker logs fiji-frontend --tail 20
    
    echo ""
    echo "🌐 Testing Local Connection (Frontend):"
    curl -I http://localhost:8080 || echo "❌ Failed to connect to localhost:8080"
    
    echo ""
    echo "🌐 Testing Local Connection (Backend):"
    curl -I http://localhost:5002 || echo "❌ Failed to connect to localhost:5002"
ENDSSH
