# 🚀 Automated Deployment Guide

## One-Command Deployment

Just run this from the project root:

```bash
./deploy.sh
```

That's it! The script will:
- ✅ Automatically retrieve environment variables from the server
- ✅ Deploy the backend with all fixes
- ✅ Check application status
- ✅ Restart if needed
- ✅ Verify health checks
- ✅ Check for errors
- ✅ Provide a complete status report

## What Gets Deployed

### Backend Fixes Included:
1. ✅ Fixed routing order (uploads before frontend)
2. ✅ Enhanced error logging with error IDs
3. ✅ Fixed frontend path detection (checks multiple locations)
4. ✅ Improved error handling (no crashes on missing files)
5. ✅ Fixed elevation field handling in asset updates
6. ✅ Removed debug console.logs from production
7. ✅ Added 404 handler for API routes

### All Automated:
- Environment variable retrieval
- File transfer
- Dependency installation
- PM2 restart
- Health checks
- Error verification

## Manual Commands (If Needed)

### Check Logs
```bash
./azure-deployment/check-logs.sh all
```

### Check Status Only
```bash
./azure-deployment/check-logs.sh status
```

### Check Errors Only
```bash
./azure-deployment/check-logs.sh errors
```

### Restart Application
```bash
ssh -i ~/.ssh/azure_vm_key azureuser@20.217.208.150 "sudo -u appuser pm2 restart choco-gis-backend"
```

## Troubleshooting

If deployment fails:
1. Check logs: `./azure-deployment/check-logs.sh errors`
2. Check status: `./azure-deployment/check-logs.sh status`
3. Verify SSH access: `./azure-deployment/ssh-vm.sh`

## Production URLs

- **Frontend**: https://gis.chocoinsurance.com
- **API**: https://gis.chocoinsurance.com/api
- **Health Check**: https://gis.chocoinsurance.com/api/health

