# Self-Hosted Supabase Deployment Guide

This guide will help you deploy the AI Remix Platform with a completely self-hosted Supabase backend using Docker on your Ubuntu VPS.

## 🎯 Overview

Instead of relying on Supabase Cloud, this setup gives you:
- **Complete control** over your data and infrastructure
- **No external dependencies** for core functionality
- **Cost savings** for high-traffic applications
- **Custom configurations** and unlimited scaling

## 📋 Prerequisites

- Ubuntu 20.04+ VPS with at least 4GB RAM and 20GB storage
- Domain name pointing to your server
- Basic command line knowledge
- (Optional) SMTP credentials for email auth

## 🚀 Quick Deployment

### 1. Initial Server Setup

```bash
# Update system
sudo apt update && sudo apt upgrade -y

# Install essential tools
sudo apt install -y curl wget git htop

# Clone the repository
git clone https://github.com/your-username/ai-remix-platform
cd ai-remix-platform
```

### 2. Run Automated Setup

```bash
# Make setup script executable
chmod +x scripts/setup-docker-supabase.sh

# Run the automated setup
sudo ./scripts/setup-docker-supabase.sh
```

This script will:
- Install Docker and Docker Compose
- Generate secure passwords and JWT secrets
- Create environment configuration
- Set up firewall rules
- Configure automatic backups
- Create necessary directories and permissions

### 3. Configure Your Environment

Edit the generated `.env` file:

```bash
nano /opt/ai-remix-platform/.env
```

**Important settings to customize:**

```env
# Replace with your actual domain
SITE_URL=https://yourdomain.com
API_EXTERNAL_URL=https://yourdomain.com:8000
NEXTAUTH_URL=https://yourdomain.com

# Configure SMTP for email auth (optional but recommended)
SMTP_HOST=smtp.your-email-provider.com
SMTP_USER=your-email@yourdomain.com
SMTP_PASS=your-email-password
SMTP_ADMIN_EMAIL=admin@yourdomain.com

# GitHub OAuth (optional)
ENABLE_GITHUB_SIGNUP=true
GITHUB_CLIENT_ID=your_github_app_client_id
GITHUB_SECRET=your_github_app_secret
```

### 4. Start Services

```bash
cd /opt/ai-remix-platform

# Start all services
docker-compose up -d

# Check status
docker-compose ps

# View logs
docker-compose logs -f
```

### 5. Set Up Nginx Reverse Proxy

```bash
# Copy nginx configuration
sudo cp nginx/ai-remix-platform.conf /etc/nginx/sites-available/

# Edit the configuration with your domain
sudo nano /etc/nginx/sites-available/ai-remix-platform.conf
# Replace 'your-domain.com' with your actual domain

# Enable the site
sudo ln -s /etc/nginx/sites-available/ai-remix-platform.conf /etc/nginx/sites-enabled/

# Remove default site
sudo rm -f /etc/nginx/sites-enabled/default

# Test nginx configuration
sudo nginx -t

# Restart nginx
sudo systemctl restart nginx
```

### 6. Set Up SSL Certificates

```bash
# Install Certbot
sudo apt install -y certbot python3-certbot-nginx

# Get SSL certificate
sudo certbot --nginx -d yourdomain.com -d www.yourdomain.com

# Auto-renewal is already set up by certbot
```

### 7. Deploy the Next.js Application

```bash
cd /opt/ai-remix-platform

# Install Node.js via NVM
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.0/install.sh | bash
source ~/.bashrc
nvm install --lts
nvm use --lts

# Install PM2
npm install -g pm2

# Install dependencies
npm ci --production

# Build the application
npm run build

# Create PM2 ecosystem file
cat > ecosystem.config.js << 'EOF'
module.exports = {
  apps: [{
    name: 'ai-remix-platform',
    script: 'node_modules/.bin/next',
    args: 'start',
    cwd: '/opt/ai-remix-platform',
    instances: 'max',
    exec_mode: 'cluster',
    watch: false,
    max_memory_restart: '1G',
    env: {
      NODE_ENV: 'production',
      PORT: 3000
    }
  }]
};
EOF

# Start with PM2
pm2 start ecosystem.config.js
pm2 startup
pm2 save
```

## 🔧 Architecture Overview

```
┌─────────────────┐    ┌──────────────┐    ┌─────────────────┐
│     Nginx       │    │   Next.js    │    │   Self-hosted   │
│ (Reverse Proxy) │◄──►│     App      │◄──►│    Supabase     │
│   SSL/Security  │    │  (Port 3000) │    │  (Port 8000)    │
└─────────────────┘    └──────────────┘    └─────────────────┘
         │                                          │
         │                                          ▼
         │                              ┌─────────────────┐
         │                              │    PostgreSQL   │
         │                              │   Kong Gateway  │
         │                              │     GoTrue      │
         │                              │   PostgREST     │
         │                              │   Storage API   │
         │                              │    Realtime     │
         │                              └─────────────────┘
         ▼
┌─────────────────┐
│   Users/Web     │
│   (Port 443)    │
└─────────────────┘
```

## 🐳 Docker Services

| Service | Purpose | Port |
|---------|---------|------|
| **postgres** | PostgreSQL database | 5432 |
| **postgrest** | Auto-generated REST API | 3001 |
| **gotrue** | Authentication service | 9999 |
| **realtime** | WebSocket connections | 4000 |
| **storage** | File upload/download | 8001 |
| **kong** | API Gateway & routing | 8000 |
| **imgproxy** | Image transformations | 5001 |
| **analytics** | Usage analytics | 4000 |

## 📊 Monitoring & Maintenance

### Check Service Status
```bash
cd /opt/ai-remix-platform

# View all services
docker-compose ps

# Check specific service logs
docker-compose logs -f postgres
docker-compose logs -f gotrue
docker-compose logs -f postgrest

# Check Next.js app
pm2 status
pm2 logs
```

### Database Access
```bash
# Connect to PostgreSQL
docker-compose exec postgres psql -U postgres -d postgres

# Run migrations manually
docker-compose exec postgres psql -U postgres -d postgres -f /docker-entrypoint-initdb.d/001_auth_schema.sql
```

### Backup & Restore
```bash
# Manual backup
/usr/local/bin/backup-supabase.sh

# Restore from backup
cd /opt/ai-remix-platform
gunzip -c /var/backups/supabase/database_YYYYMMDD_HHMMSS.sql.gz | docker-compose exec -T postgres psql -U postgres -d postgres
```

## 🔐 Security Features

- **JWT Authentication** with rotating secrets
- **Row Level Security** (RLS) in PostgreSQL
- **Rate limiting** on API endpoints
- **CORS protection** with configurable origins
- **SSL/TLS encryption** via Let's Encrypt
- **Firewall rules** (UFW) blocking unnecessary ports
- **Container isolation** via Docker networks
- **Encrypted API key storage** for Claude AI

## 🚨 Troubleshooting

### Common Issues

**Services won't start:**
```bash
# Check Docker logs
docker-compose logs

# Restart all services
docker-compose down
docker-compose up -d
```

**Database connection errors:**
```bash
# Check PostgreSQL status
docker-compose exec postgres pg_isready -U postgres

# Reset database (⚠️ destroys data)
docker-compose down -v
docker-compose up -d
```

**Authentication not working:**
```bash
# Check GoTrue logs
docker-compose logs gotrue

# Verify environment variables
docker-compose exec gotrue env | grep GOTRUE
```

**API Gateway errors:**
```bash
# Check Kong configuration
docker-compose exec kong kong config -c /var/lib/kong/kong.yml

# Restart Kong
docker-compose restart kong
```

### Performance Tuning

**Database optimization:**
```sql
-- Connect to database
docker-compose exec postgres psql -U postgres -d postgres

-- Check database size
SELECT pg_size_pretty(pg_database_size('postgres'));

-- Analyze query performance
EXPLAIN ANALYZE SELECT * FROM projects WHERE is_public = true;

-- Create additional indexes if needed
CREATE INDEX idx_projects_updated_at ON projects(updated_at DESC);
```

**Resource monitoring:**
```bash
# Check Docker resource usage
docker stats

# Check system resources
htop
df -h
free -h
```

## 🔄 Updates & Maintenance

### Update Supabase Services
```bash
cd /opt/ai-remix-platform

# Pull latest images
docker-compose pull

# Restart services
docker-compose up -d

# Clean up old images
docker image prune -f
```

### Update Next.js Application
```bash
cd /opt/ai-remix-platform

# Pull latest code
git pull origin main

# Install new dependencies
npm ci --production

# Build updated app
npm run build

# Restart PM2
pm2 restart ai-remix-platform
```

## 📱 Mobile & API Access

Your self-hosted Supabase is now accessible via:

- **Web App**: `https://yourdomain.com`
- **API Base**: `https://yourdomain.com:8000`
- **Auth**: `https://yourdomain.com:8000/auth/v1`
- **Database**: `https://yourdomain.com:8000/rest/v1`
- **Storage**: `https://yourdomain.com:8000/storage/v1`
- **Realtime**: `wss://yourdomain.com:8000/realtime/v1`

Use the same client libraries as Supabase Cloud - just change the URL!

## 💰 Cost Analysis

**Estimated monthly costs** (compared to Supabase Pro):

| Resource | Self-hosted | Supabase Pro |
|----------|-------------|--------------|
| VPS (4GB RAM) | $20-40 | - |
| Domain + SSL | $10-15 | - |
| Supabase Pro | $0 | $25 |
| Database | Unlimited | 8GB |
| API Requests | Unlimited | 5M |
| Storage | Unlimited | 100GB |
| **Total** | **$30-55** | **$25 + overages** |

**Break-even point**: High-traffic applications or those needing >8GB database storage.

## 🎉 Success!

Your AI Remix Platform is now running with a fully self-hosted Supabase backend! 

Users can now:
- ✅ Create accounts and authenticate
- ✅ Build and edit projects with Claude AI
- ✅ Share projects in the public gallery
- ✅ Remix and fork existing projects
- ✅ Upload files and images
- ✅ Collaborate in real-time

**Next steps:**
1. Create your first project at `https://yourdomain.com`
2. Add your Claude API key in user settings
3. Start building with AI assistance!
4. Share your gallery with the world

---

**Need help?** Check the troubleshooting section or create an issue in the repository.