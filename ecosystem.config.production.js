module.exports = {
  apps: [
    {
      name: 'gis-crm-backend',
      script: './backend/server.js',
      cwd: '/Users/yuvaliko/Desktop/Choco GIS CRM',
      instances: 1,
      exec_mode: 'fork',
      
      // Auto-restart configuration
      autorestart: true,
      watch: false,
      max_memory_restart: '1G',
      min_uptime: '10s', // Minimum uptime before considering app stable
      max_restarts: 10, // Max restarts in 1 minute
      restart_delay: 4000, // Wait 4 seconds before restarting
      
      // Error handling
      error_file: './logs/backend-error.log',
      out_file: './logs/backend-out.log',
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
      merge_logs: true,
      log_type: 'json', // JSON logs for better parsing
      
      // Environment variables
      env_file: './backend/.env',
      env: {
        NODE_ENV: 'production',
        PORT: 5001, // Using 5001 for local testing, change to 8080 for Azure deployment
      },
      env_production: {
        NODE_ENV: 'production',
        PORT: 5001, // Using 5001 for local testing, change to 8080 for Azure deployment
      },
      env_development: {
        NODE_ENV: 'development',
        PORT: 5001,
      },
      
      // Graceful shutdown
      kill_timeout: 5000, // Wait 5 seconds for graceful shutdown
      wait_ready: true, // Wait for app to be ready
      listen_timeout: 10000, // Wait 10 seconds for app to listen
      
      // Health check
      health_check_grace_period: 3000, // Grace period for health checks
    },
  ],
};

