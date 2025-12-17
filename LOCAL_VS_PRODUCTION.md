# Local vs Production - Important!

## 🖥️ What's Running on Your Laptop (LOCAL - Testing Only)

**Current Setup:**
- Backend running on `localhost:5001` (your laptop)
- Frontend running on `localhost:3000` (your laptop)
- **This is ONLY for testing!**
- **Customers should NEVER access this!**

**Purpose:**
- ✅ Test features before deploying
- ✅ Develop new features
- ✅ Debug issues
- ✅ Verify everything works

## ☁️ What Should Run on Azure (PRODUCTION - For Customers)

**Production Setup:**
- Backend on Azure VM: `20.217.208.150` (or your domain)
- Frontend on Azure VM: `20.217.208.150` (or your domain)
- **This is what customers access!**
- **This is your real production environment!**

**Purpose:**
- ✅ Serve real customers
- ✅ Handle production traffic
- ✅ Secure and stable
- ✅ Always available

## 🚨 Important: Don't Let Customers Access Your Laptop!

**Your laptop backend is:**
- ❌ Not secure for public access
- ❌ Not always online
- ❌ Not scalable
- ❌ Not for customers

**Azure VM backend is:**
- ✅ Secure (firewall, SSL, security hardening)
- ✅ Always online (24/7)
- ✅ Scalable
- ✅ Built for customers

## 🚀 Deploy to Azure (For Real Customers)

### Step 1: Deploy Backend to Azure

```bash
cd azure-deployment

# 1. Make sure you're logged into Azure
az login

# 2. Deploy the backend
./deploy-app.sh
```

This will:
- Copy your code to Azure VM
- Set up PM2 on the cloud server
- Configure environment variables
- Start the backend on the cloud
- Set up auto-restart

### Step 2: Deploy Frontend to Azure

```bash
# Still in azure-deployment folder
./deploy-frontend.sh
```

This will:
- Build your React app
- Copy it to Azure VM
- Configure Nginx to serve it
- Make it accessible to customers

### Step 3: Set Up SSL (HTTPS)

```bash
./setup-ssl.sh
```

This sets up HTTPS so customers can access securely.

## ✅ After Deployment

**Customers will access:**
- Frontend: `https://gis.chocoinsurance.com` (or your domain)
- Backend API: `https://gis.chocoinsurance.com/api`

**NOT your laptop!**

## 🧪 Testing Workflow

1. **Develop locally** (your laptop)
   - Test features
   - Fix bugs
   - Verify everything works

2. **Deploy to Azure** (cloud)
   - Run deployment scripts
   - Test on Azure
   - Make available to customers

3. **Monitor production** (Azure)
   - Check logs on Azure VM
   - Monitor health endpoints
   - Ensure stability

## 📊 Monitoring

**Local (Your Laptop):**
- Activity Monitor (system monitoring)
- PM2 Web (app monitoring)
- For testing only

**Production (Azure VM):**
- SSH into VM: `./ssh-vm.sh`
- Check PM2: `sudo -u appuser pm2 status`
- View logs: `sudo -u appuser pm2 logs`
- Health check: `curl https://gis.chocoinsurance.com/api/health`

## 🎯 Summary

| Location | Purpose | Who Accesses |
|----------|---------|--------------|
| **Your Laptop** | Testing & Development | Only You |
| **Azure VM** | Production | Your Customers |

**Never let customers access your laptop! Always deploy to Azure for production!**

