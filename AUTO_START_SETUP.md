# Automatic Backend Server Startup

The backend server is now configured to start automatically using PM2 (Process Manager).

## Current Status

✅ **Backend is running** with PM2
- Process name: `gis-crm-backend`
- Port: `5001`
- Auto-restart: Enabled

## Commands

### Check Backend Status
```bash
pm2 status
```

### View Backend Logs
```bash
pm2 logs gis-crm-backend
```

### Stop Backend
```bash
pm2 stop gis-crm-backend
```

### Start Backend
```bash
pm2 start gis-crm-backend
```

### Restart Backend
```bash
pm2 restart gis-crm-backend
```

### Delete Backend from PM2
```bash
pm2 delete gis-crm-backend
```

## Auto-Start on System Boot

To make the backend start automatically when your computer boots up, run this command in your terminal:

```bash
sudo env PATH=$PATH:/opt/homebrew/Cellar/node/25.1.0_1/bin /opt/homebrew/lib/node_modules/pm2/bin/pm2 startup launchd -u yuvaliko --hp /Users/yuvaliko
```

**Note:** You'll need to enter your password. This only needs to be done once.

After running this command, the backend will automatically start whenever you restart your computer.

## Starting Everything

To start both backend and frontend:

```bash
./start.sh
```

Or manually:
1. Backend (already running with PM2):
   ```bash
   pm2 start ecosystem.config.js
   ```

2. Frontend:
   ```bash
   cd frontend
   npm start
   ```

## Troubleshooting

If the backend isn't starting:

1. Check PM2 status:
   ```bash
   pm2 status
   ```

2. Check logs:
   ```bash
   pm2 logs gis-crm-backend --lines 50
   ```

3. Restart the backend:
   ```bash
   pm2 restart gis-crm-backend
   ```

4. If needed, delete and recreate:
   ```bash
   pm2 delete gis-crm-backend
   pm2 start ecosystem.config.js
   pm2 save
   ```

## Configuration

The PM2 configuration is in `ecosystem.config.js`. Environment variables are loaded from `backend/.env` and also defined in the config file.

