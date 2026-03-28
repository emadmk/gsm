/**
 * PM2 Configuration
 * GSM News - جی‌اس‌ام
 *
 * Usage:
 * pm2 start ecosystem.config.js
 * pm2 start ecosystem.config.js --env production
 */

module.exports = {
  apps: [
    {
      name: 'gsm-news',
      script: 'node_modules/next/dist/bin/next',
      args: 'start',
      cwd: '/var/www/gsm/app',
      instances: 'max',
      exec_mode: 'cluster',
      autorestart: true,
      watch: false,
      max_memory_restart: '1G',
      env: {
        NODE_ENV: 'development',
        PORT: 3000,
      },
      env_production: {
        NODE_ENV: 'production',
        PORT: 3000,
      },
      error_file: '/var/www/gsm/logs/pm2-error.log',
      out_file: '/var/www/gsm/logs/pm2-out.log',
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
      merge_logs: true,
    },
  ],
}
