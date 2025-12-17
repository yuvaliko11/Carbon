# Commands to Run on Azure VM (You're Already Connected!)

Since you're already SSH'd into the Azure VM, run these commands:

## Step 1: Stop the current server (if running)
```bash
sudo systemctl stop choco-gis-backend
```
OR if systemctl doesn't work:
```bash
pkill -f "node server.js"
```

## Step 2: Navigate to backend directory
```bash
cd /opt/choco-gis-backend
```

## Step 3: Pull latest code changes (if using git)
```bash
sudo -u appuser git pull
```

## Step 4: Restart the server
```bash
sudo systemctl start choco-gis-backend
sudo systemctl status choco-gis-backend
```

OR if systemctl doesn't work:
```bash
sudo -u appuser /usr/bin/node server.js > /tmp/app.log 2>&1 &
```

## Step 5: Check if server is running
```bash
curl http://localhost:8080/api/health
```

OR check the process:
```bash
ps aux | grep "node server.js" | grep -v grep
```

## Step 6: Check logs (if needed)
```bash
sudo tail -f /tmp/app.log
```

---

**After restarting, refresh your browser - your assets should appear!**



