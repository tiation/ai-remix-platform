#!/bin/bash

# AI Remix Platform VPS Setup Script
# Run this script on a fresh Ubuntu 20.04/22.04 server

set -e

echo "🚀 Setting up AI Remix Platform on Ubuntu VPS..."

# Update system
echo "📦 Updating system packages..."
sudo apt update && sudo apt upgrade -y

# Install essential tools
echo "🛠️ Installing essential tools..."
sudo apt install -y curl wget git build-essential software-properties-common ufw nginx certbot python3-certbot-nginx

# Install Node.js via NVM
echo "📦 Installing Node.js via NVM..."
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.0/install.sh | bash
export NVM_DIR="$HOME/.nvm"
[ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh"
[ -s "$NVM_DIR/bash_completion" ] && \. "$NVM_DIR/bash_completion"

# Install latest LTS Node.js
nvm install --lts
nvm use --lts
nvm alias default node

# Install PM2 globally
echo "🔄 Installing PM2 process manager..."
npm install -g pm2

# Create application user
echo "👤 Creating application user..."
sudo useradd -m -s /bin/bash airemix || echo "User already exists"
sudo usermod -aG sudo airemix

# Create application directory
echo "📁 Setting up application directory..."
sudo mkdir -p /var/www/ai-remix-platform
sudo chown airemix:airemix /var/www/ai-remix-platform

# Configure firewall
echo "🔒 Configuring firewall..."
sudo ufw allow ssh
sudo ufw allow http
sudo ufw allow https
sudo ufw --force enable

# Configure Nginx
echo "🌐 Configuring Nginx..."
sudo tee /etc/nginx/sites-available/ai-remix-platform > /dev/null <<EOF
server {
    listen 80;
    server_name your-domain.com www.your-domain.com;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        proxy_cache_bypass \$http_upgrade;
        proxy_buffering off;
    }

    # Security headers
    add_header X-Frame-Options DENY;
    add_header X-Content-Type-Options nosniff;
    add_header X-XSS-Protection "1; mode=block";
    add_header Referrer-Policy strict-origin-when-cross-origin;

    # Gzip compression
    gzip on;
    gzip_vary on;
    gzip_types
        text/plain
        text/css
        text/xml
        text/javascript
        application/javascript
        application/xml+rss
        application/json;
}
EOF

# Enable the site
sudo ln -sf /etc/nginx/sites-available/ai-remix-platform /etc/nginx/sites-enabled/
sudo rm -f /etc/nginx/sites-enabled/default
sudo nginx -t
sudo systemctl restart nginx

# Create PM2 ecosystem file
echo "📋 Creating PM2 ecosystem configuration..."
sudo tee /var/www/ai-remix-platform/ecosystem.config.js > /dev/null <<EOF
module.exports = {
  apps: [{
    name: 'ai-remix-platform',
    script: 'node_modules/.bin/next',
    args: 'start',
    cwd: '/var/www/ai-remix-platform',
    instances: 'max',
    exec_mode: 'cluster',
    watch: false,
    max_memory_restart: '1G',
    env: {
      NODE_ENV: 'production',
      PORT: 3000
    },
    error_file: '/var/log/pm2/ai-remix-platform-error.log',
    out_file: '/var/log/pm2/ai-remix-platform-out.log',
    log_file: '/var/log/pm2/ai-remix-platform.log'
  }]
};
EOF

# Create log directory
sudo mkdir -p /var/log/pm2
sudo chown airemix:airemix /var/log/pm2

# Create deployment script
echo "🚀 Creating deployment script..."
sudo tee /var/www/ai-remix-platform/deploy.sh > /dev/null <<'EOF'
#!/bin/bash

# Deployment script for AI Remix Platform

set -e

echo "🚀 Deploying AI Remix Platform..."

# Pull latest changes
git pull origin main

# Install/update dependencies
npm ci --production

# Build application
npm run build

# Restart PM2 process
pm2 restart ecosystem.config.js

echo "✅ Deployment completed!"
EOF

sudo chmod +x /var/www/ai-remix-platform/deploy.sh
sudo chown airemix:airemix /var/www/ai-remix-platform/deploy.sh

# Create environment file template
echo "📄 Creating environment template..."
sudo tee /var/www/ai-remix-platform/.env.production > /dev/null <<EOF
# Production Environment Configuration
NODE_ENV=production

# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key

# Next.js Configuration
NEXTAUTH_SECRET=your_production_nextauth_secret
NEXTAUTH_URL=https://your-domain.com
EOF

sudo chown airemix:airemix /var/www/ai-remix-platform/.env.production

# Setup PM2 startup
echo "🔄 Configuring PM2 startup..."
sudo -u airemix pm2 startup systemd -u airemix --hp /home/airemix

# Create backup script
echo "💾 Creating backup script..."
sudo tee /usr/local/bin/backup-airemix.sh > /dev/null <<'EOF'
#!/bin/bash

# Backup script for AI Remix Platform

BACKUP_DIR="/var/backups/ai-remix-platform"
DATE=$(date +%Y%m%d_%H%M%S)

mkdir -p $BACKUP_DIR

# Backup application files
tar -czf $BACKUP_DIR/app_$DATE.tar.gz -C /var/www ai-remix-platform

# Keep only last 7 days of backups
find $BACKUP_DIR -name "app_*.tar.gz" -mtime +7 -delete

echo "Backup completed: $BACKUP_DIR/app_$DATE.tar.gz"
EOF

sudo chmod +x /usr/local/bin/backup-airemix.sh

# Setup daily backups
echo "⏰ Setting up daily backups..."
echo "0 2 * * * /usr/local/bin/backup-airemix.sh" | sudo crontab -

echo "✅ VPS setup completed!"
echo ""
echo "📋 Next steps:"
echo "1. Clone your repository to /var/www/ai-remix-platform"
echo "2. Edit /var/www/ai-remix-platform/.env.production with your actual values"
echo "3. Update the Nginx configuration with your actual domain"
echo "4. Run: sudo certbot --nginx -d your-domain.com -d www.your-domain.com"
echo "5. Start the application: cd /var/www/ai-remix-platform && pm2 start ecosystem.config.js"
echo "6. Save PM2 configuration: pm2 save"
echo ""
echo "🌐 Your AI Remix Platform will be available at https://your-domain.com"
EOF