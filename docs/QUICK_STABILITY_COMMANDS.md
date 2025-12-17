# Quick Stability Commands

## 🔍 Check System Status

```bash
# Check PM2 status
pm2 status

# Check health
curl http://localhost:5001/api/health

# Check if ready
curl http://localhost:5001/api/ready

# View logs
pm2 logs gis-crm-backend --lines 50
```

## 🔄 Restart Backend

```bash
pm2 restart gis-crm-backend
```

## 📊 Monitor in Real-Time

```bash
pm2 monit
```

## 🚨 If Backend Crashes

PM2 will automatically restart it. But if you need to manually restart:

```bash
pm2 restart gis-crm-backend
pm2 logs gis-crm-backend --err
```

## ✅ Production Checklist

- [x] Auto-restart on crashes
- [x] Graceful shutdown handling
- [x] Database auto-reconnection
- [x] Health check endpoints
- [x] Error handling
- [x] Memory limit protection
- [x] Log rotation (set up with: `pm2 install pm2-logrotate`)

## 📈 Key Features

1. **Auto-Restart**: Backend restarts automatically if it crashes
2. **Memory Protection**: Restarts if memory exceeds 1GB
3. **Database Resilience**: Auto-reconnects if DB disconnects
4. **Graceful Shutdown**: Properly closes connections on restart
5. **Health Monitoring**: Endpoints to check system status

## 🎯 What This Means

Your backend will:
- ✅ Automatically recover from crashes
- ✅ Handle database disconnections gracefully
- ✅ Restart if memory gets too high
- ✅ Provide health status for monitoring
- ✅ Shut down gracefully (no data loss)

**Your customers won't experience downtime from crashes!**

