# 🔧 Fix MongoDB Connection Issue

## Problem
The backend server is running, but it cannot connect to MongoDB Atlas. The error message indicates:
```
Could not connect to any servers in your MongoDB Atlas cluster. 
One common reason is that you're trying to access the database from an IP that isn't whitelisted.
```

## Solution: Whitelist Your IP Address in MongoDB Atlas

### Step 1: Get Your Current IP Address
**Your current IP address is: `85.130.145.206`**

(You can also check it at: https://api.ipify.org)

### Step 2: Add IP to MongoDB Atlas Whitelist

1. **Go to MongoDB Atlas Dashboard**
   - Visit: https://cloud.mongodb.com/
   - Log in to your account

2. **Navigate to Network Access**
   - Click on your project/cluster
   - Go to **Security** → **Network Access** (or **IP Access List**)

3. **Add Your IP Address**
   - Click **"Add IP Address"** or **"Add Entry"**
   - You have two options:
     - **Option A (Recommended for Development)**: Click **"Add Current IP Address"** button
     - **Option B (Manual)**: Enter your IP address manually
   - Click **"Confirm"**

4. **Alternative: Allow All IPs (Development Only)**
   - For development/testing, you can temporarily allow all IPs:
     - Click **"Add IP Address"**
     - Enter `0.0.0.0/0` (allows all IPs)
     - ⚠️ **Warning**: Only use this for development. Never use this in production!

### Step 3: Wait for Changes to Take Effect
- MongoDB Atlas may take 1-2 minutes to apply the IP whitelist changes
- The backend will automatically retry the connection

### Step 4: Verify Connection

After adding your IP, test the connection:

```bash
cd backend
node scripts/testConnection.js
```

Or restart your backend server:
```bash
cd backend
npm start
```

You should see:
```
✅ MongoDB Connected: ...
✅ Database: bi_map_db
```

## Quick Fix Script

You can also run this to test the connection:
```bash
cd backend
node -e "require('dotenv').config(); const mongoose = require('mongoose'); mongoose.connect(process.env.MONGODB_URI, {serverSelectionTimeoutMS: 5000}).then(() => {console.log('✅ MongoDB connection successful'); process.exit(0);}).catch(err => {console.error('❌ MongoDB connection failed:', err.message); process.exit(1);});"
```

## Additional Troubleshooting

If the issue persists after whitelisting your IP:

1. **Check MongoDB Connection String**
   - Verify `MONGODB_URI` in `backend/.env` is correct
   - Format: `mongodb+srv://username:password@cluster.mongodb.net/database?retryWrites=true&w=majority`

2. **Check MongoDB User Credentials**
   - Go to MongoDB Atlas → **Security** → **Database Access**
   - Verify the username and password match your connection string
   - Make sure the user has proper permissions

3. **Check Cluster Status**
   - Go to MongoDB Atlas → **Clusters**
   - Make sure your cluster is running (not paused)

4. **Check Firewall/VPN**
   - If you're on a corporate network or VPN, it might be blocking MongoDB connections
   - Try from a different network or disable VPN temporarily

## After Fixing

Once the connection is established:
- The backend will automatically connect to MongoDB
- The 503 error will disappear
- You'll be able to log in successfully

