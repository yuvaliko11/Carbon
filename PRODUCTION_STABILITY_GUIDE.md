# Production Stability Guide

This guide ensures your application won't crash when you have customers.

## 🛡️ Stability Features Implemented

### 1. **Process Management (PM2)**
- ✅ Auto-restart on crashes
- ✅ Memory limit protection (restarts if memory exceeds 1GB)
- ✅ Graceful shutdown handling
- ✅ Health check monitoring
- ✅ Automatic recovery from failures

### 2. **Database Resilience**
- ✅ Automatic reconnection on disconnection
- ✅ Connection retry logic
- ✅ Graceful degradation (server starts even if DB is down)
- ✅ Connection pooling (2-10 connections maintained)

### 3. **Error Handling**
- ✅ Uncaught exception handling
- ✅ Unhandled promise rejection handling
- ✅ Graceful error responses (no stack traces in production)
- ✅ Database connection checks before operations

### 4. **Health Monitoring**
- ✅ Health check endpoint: `/api/health`
- ✅ Readiness probe: `/api/ready`
- ✅ Liveness probe: `/api/live`

## 🚀 Production Setup

### Step 1: Update PM2 Configuration

For production, use the production config:

```bash
pm2 delete gis-crm-backend
pm2 start ecosystem.config.production.js --env production
pm2 save
```

### Step 2: Set Up Auto-Start on System Boot

```bash
pm2 startup
# Follow the instructions it provides
```

### Step 3: Configure Production Environment Variables

Create `backend/.env.production`:

```env
NODE_ENV=production
PORT=8080
MONGODB_URI=your_production_mongodb_uri
JWT_SECRET=your_strong_secret_at_least_32_characters_long
FRONTEND_URL=https://gis.chocoinsurance.com
```

### Step 4: Set Up Monitoring

#### Monitor PM2 Status
```bash
pm2 status          # Check status
pm2 logs            # View logs
pm2 monit           # Real-time monitoring
```

#### Set Up Log Rotation
```bash
pm2 install pm2-logrotate
pm2 set pm2-logrotate:max_size 10M
pm2 set pm2-logrotate:retain 30
pm2 set pm2-logrotate:compress true
```

## 📊 Monitoring & Alerts

### Health Check Endpoints

1. **Health Check** (`GET /api/health`)
   - Returns: Overall system health
   - Status codes: 200 (OK), 503 (Degraded)
   - Use for: General monitoring

2. **Readiness Probe** (`GET /api/ready`)
   - Returns: Whether app is ready to serve traffic
   - Status codes: 200 (Ready), 503 (Not Ready)
   - Use for: Load balancer health checks

3. **Liveness Probe** (`GET /api/live`)
   - Returns: Whether app process is alive
   - Status code: 200 (Alive)
   - Use for: Process monitoring

### Set Up External Monitoring

You can use these endpoints with monitoring services like:
- **UptimeRobot** (free)
- **Pingdom**
- **Datadog**
- **New Relic**

Example UptimeRobot setup:
- URL: `https://gis.chocoinsurance.com/api/health`
- Interval: 5 minutes
- Alert: If status code is not 200

## 🔧 Maintenance Commands

### Check System Status
```bash
pm2 status                    # Process status
pm2 logs gis-crm-backend      # View logs
curl http://localhost:8080/api/health  # Health check
```

### Restart Backend
```bash
pm2 restart gis-crm-backend
```

### View Real-Time Logs
```bash
pm2 logs gis-crm-backend --lines 100
```

### Monitor Resources
```bash
pm2 monit
```

### Check Database Connection
```bash
curl http://localhost:8080/api/ready
```

## 🚨 Troubleshooting

### Backend Keeps Crashing

1. Check logs:
   ```bash
   pm2 logs gis-crm-backend --err --lines 50
   ```

2. Check memory usage:
   ```bash
   pm2 monit
   ```

3. Check database connection:
   ```bash
   curl http://localhost:8080/api/health
   ```

### Database Connection Issues

1. Check MongoDB Atlas Network Access (IP whitelist)
2. Verify connection string in `.env`
3. Check MongoDB Atlas status page
4. Review connection logs:
   ```bash
   pm2 logs gis-crm-backend | grep -i mongo
   ```

### High Memory Usage

1. Check for memory leaks:
   ```bash
   pm2 monit
   ```

2. Restart if needed:
   ```bash
   pm2 restart gis-crm-backend
   ```

3. Consider increasing memory limit in `ecosystem.config.production.js`:
   ```javascript
   max_memory_restart: '2G', // Increase if needed
   ```

## 📈 Best Practices

### 1. Regular Monitoring
- Check PM2 status daily
- Review logs weekly
- Monitor health endpoints

### 2. Log Management
- Logs are automatically rotated
- Keep last 30 days of logs
- Compress old logs

### 3. Database
- Monitor MongoDB Atlas dashboard
- Set up alerts for connection issues
- Regular backups (MongoDB Atlas handles this)

### 4. Updates
- Test updates in development first
- Use PM2's zero-downtime restart: `pm2 reload gis-crm-backend`
- Monitor after updates

### 5. Security
- Keep environment variables secure
- Use strong JWT secrets (32+ characters)
- Regularly update dependencies: `npm audit fix`

## 🔄 Zero-Downtime Deployment

For production deployments:

```bash
# 1. Pull latest code
git pull

# 2. Install dependencies (if needed)
cd backend && npm install

# 3. Reload with zero downtime
pm2 reload gis-crm-backend

# 4. Check status
pm2 status
```

## 📞 Support

If issues persist:
1. Check PM2 logs: `pm2 logs gis-crm-backend --lines 100`
2. Check health endpoint: `curl http://localhost:8080/api/health`
3. Review MongoDB Atlas dashboard
4. Check system resources: `pm2 monit`

## 🎯 Key Metrics to Monitor

- **Uptime**: Should be 99.9%+
- **Response Time**: API should respond in < 500ms
- **Memory Usage**: Should stay under 1GB
- **Database Connection**: Should be connected (state: 1)
- **Error Rate**: Should be < 0.1%

## ✅ Production Checklist

Before going live:
- [ ] PM2 configured with production settings
- [ ] Auto-start on boot configured
- [ ] Health check endpoints working
- [ ] Log rotation configured
- [ ] Environment variables set correctly
- [ ] MongoDB connection stable
- [ ] Monitoring set up
- [ ] Backup strategy in place
- [ ] Security measures implemented
- [ ] Load testing completed

