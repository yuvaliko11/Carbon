#!/bin/bash

echo "🔍 Checking Backend Server Status..."
echo ""

# Check if backend is running on port 5001
echo "1. Checking if backend is running on port 5001..."
if lsof -Pi :5001 -sTCP:LISTEN -t >/dev/null 2>&1 ; then
    echo "   ✅ Backend server is running on port 5001"
else
    echo "   ❌ Backend server is NOT running on port 5001"
    echo "   💡 Start the backend with: cd backend && npm start"
fi

# Check if backend is running on port 5000 (alternative)
echo ""
echo "2. Checking if backend is running on port 5000..."
if lsof -Pi :5000 -sTCP:LISTEN -t >/dev/null 2>&1 ; then
    echo "   ✅ Backend server is running on port 5000"
    echo "   ⚠️  Note: Frontend expects port 5001. Update REACT_APP_API_URL or change backend port."
else
    echo "   ❌ Backend server is NOT running on port 5000"
fi

# Check backend health endpoint
echo ""
echo "3. Testing backend health endpoint..."
if curl -s http://localhost:5001/api/health > /dev/null 2>&1; then
    echo "   ✅ Backend health check passed (port 5001)"
    curl -s http://localhost:5001/api/health | head -1
elif curl -s http://localhost:5000/api/health > /dev/null 2>&1; then
    echo "   ✅ Backend health check passed (port 5000)"
    curl -s http://localhost:5000/api/health | head -1
else
    echo "   ❌ Backend health check failed - server may not be running"
fi

# Check if .env file exists
echo ""
echo "4. Checking backend .env file..."
if [ -f "backend/.env" ]; then
    echo "   ✅ Backend .env file exists"
    if grep -q "MONGODB_URI" backend/.env && ! grep -q "your_mongodb_connection_string_here" backend/.env; then
        echo "   ✅ MONGODB_URI is set in .env"
    else
        echo "   ⚠️  MONGODB_URI may not be properly configured"
    fi
    if grep -q "PORT=5001" backend/.env; then
        echo "   ✅ PORT is set to 5001"
    elif grep -q "PORT=5000" backend/.env; then
        echo "   ⚠️  PORT is set to 5000 (frontend expects 5001)"
    else
        echo "   ℹ️  Using default port (5000 for development)"
    fi
else
    echo "   ❌ Backend .env file NOT found"
    echo "   💡 Create backend/.env file with MONGODB_URI and PORT"
fi

echo ""
echo "📋 Summary:"
echo "   - If backend is not running, start it with: cd backend && npm start"
echo "   - If backend is on port 5000, either:"
echo "     1. Set PORT=5001 in backend/.env, OR"
echo "     2. Set REACT_APP_API_URL=http://localhost:5000/api in frontend/.env"
echo "   - Make sure MongoDB connection string is correct in backend/.env"



