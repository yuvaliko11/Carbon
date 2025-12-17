# Monitoring Setup Guide

## 🖥️ PM2 Web Dashboard (Recommended - Free & Reliable)

PM2 Web is the **best monitoring solution** for your Node.js application. It's:
- ✅ **Free** (with paid premium features)
- ✅ **Web-based** (works on any device)
- ✅ **Reliable** (won't crash)
- ✅ **Real-time** monitoring
- ✅ **Beautiful** interface

### Setup Steps:

1. **Start PM2 Web** (already running):
   ```bash
   pm2 web
   ```
   Access at: **http://localhost:9615**

2. **Optional: PM2 Plus (Cloud Dashboard)**
   - Sign up at: https://app.pm2.io/
   - Get your keys and link:
     ```bash
     pm2 link <public_key> <private_key>
     ```
   - Monitor from anywhere in the world!

## 📊 macOS System Monitoring Apps

### Option 1: iStat Menus (Best - Paid)
- **Price**: ~$11.99 (one-time)
- **Why it's amazing**: 
  - Beautiful, native macOS app
  - Menu bar monitoring
  - CPU, Memory, Network, Disk, Battery
  - Highly customizable
  - Very stable (won't crash)
- **Download**: https://bjango.com/mac/istatmenus/

### Option 2: MenuMeters (Free - Open Source)
- **Price**: Free
- **Why it's good**:
  - Free and open source
  - Menu bar monitoring
  - CPU, Memory, Network, Disk
  - Lightweight
- **Download**: https://github.com/yujitach/MenuMeters

### Option 3: Activity Monitor (Built-in)
- **Price**: Free (comes with macOS)
- **Location**: Applications > Utilities > Activity Monitor
- **Why it's useful**:
  - Already installed
  - No crashes (system app)
  - Full system monitoring

## 🎯 Recommended Setup

**For Application Monitoring:**
- ✅ **PM2 Web** (http://localhost:9615) - Best for Node.js apps
- ✅ **PM2 Plus** (https://app.pm2.io/) - Cloud monitoring (optional)

**For System Monitoring:**
- ✅ **iStat Menus** - If you want the best (paid)
- ✅ **MenuMeters** - If you want free
- ✅ **Activity Monitor** - If you want built-in

## 🚀 Quick Start

### PM2 Web (Application Monitoring)
```bash
# Start PM2 Web
pm2 web

# Access dashboard
open http://localhost:9615
```

### PM2 Plus (Cloud Monitoring)
1. Go to https://app.pm2.io/
2. Sign up (free)
3. Get your keys
4. Run: `pm2 link <public_key> <private_key>`
5. Monitor from anywhere!

## 📱 Mobile Monitoring

PM2 Plus also has mobile apps:
- iOS: https://apps.apple.com/app/pm2-plus/id1463214126
- Android: Available on Google Play

## ✅ What You Get

### PM2 Web Dashboard Shows:
- ✅ Process status (online/offline)
- ✅ CPU usage
- ✅ Memory usage
- ✅ Restart count
- ✅ Uptime
- ✅ Logs (real-time)
- ✅ Error tracking
- ✅ Performance metrics

### System Monitoring Shows:
- ✅ CPU usage
- ✅ Memory usage
- ✅ Network activity
- ✅ Disk usage
- ✅ Battery (if laptop)
- ✅ Temperature (if available)

## 🎯 Best Choice for You

**For your important project, I recommend:**

1. **PM2 Web** (http://localhost:9615) - **FREE** ✅
   - Perfect for monitoring your Node.js app
   - Won't crash (it's PM2's own tool)
   - Real-time monitoring
   - Beautiful interface

2. **iStat Menus** - **PAID** ($11.99) ✅
   - Best macOS system monitoring
   - Beautiful, reliable
   - Menu bar integration
   - Won't crash (proven track record)

**Start with PM2 Web (it's free and already running!), then add iStat Menus if you want system-wide monitoring.**

