module.exports = {
  apps: [
    {
      name: 'gis-crm-backend',
      script: './backend/server.js',
      cwd: '/Users/yuvaliko/Desktop/Choco GIS CRM',
      instances: 1,
      exec_mode: 'fork',
      autorestart: true,
      watch: false,
      max_memory_restart: '1G',
      min_uptime: '10s',
      max_restarts: 10,
      restart_delay: 4000,
      kill_timeout: 5000,
      wait_ready: true,
      listen_timeout: 10000,
      env_file: './backend/.env',
      env: {
        NODE_ENV: 'development',
        PORT: 5001,
        MONGODB_URI: process.env.MONGODB_URI || 'mongodb://localhost:27017/fiji_carbon_db',
        JWT_SECRET: process.env.JWT_SECRET || 'dev_secret',
        FRONTEND_URL: 'http://localhost:3000',
      },
      error_file: './logs/backend-error.log',
      out_file: './logs/backend-out.log',
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
      merge_logs: true,
    },
  ],
};

