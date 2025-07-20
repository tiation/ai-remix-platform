#!/bin/bash

# Self-hosted Supabase Setup Script for Docker
# Run this script on your Ubuntu VPS with Docker installed

set -e

echo "🐳 Setting up Self-hosted Supabase with Docker..."

# Check if Docker is installed
if ! command -v docker &> /dev/null; then
    echo "❌ Docker is not installed. Installing Docker..."
    
    # Update package index
    sudo apt update
    
    # Install required packages
    sudo apt install -y apt-transport-https ca-certificates curl software-properties-common
    
    # Add Docker's official GPG key
    curl -fsSL https://download.docker.com/linux/ubuntu/gpg | sudo gpg --dearmor -o /usr/share/keyrings/docker-archive-keyring.gpg
    
    # Set up stable repository
    echo "deb [arch=$(dpkg --print-architecture) signed-by=/usr/share/keyrings/docker-archive-keyring.gpg] https://download.docker.com/linux/ubuntu $(lsb_release -cs) stable" | sudo tee /etc/apt/sources.list.d/docker.list > /dev/null
    
    # Install Docker Engine
    sudo apt update
    sudo apt install -y docker-ce docker-ce-cli containerd.io
    
    # Add current user to docker group
    sudo usermod -aG docker $USER
    
    echo "✅ Docker installed successfully"
fi

# Check if Docker Compose is installed
if ! command -v docker-compose &> /dev/null; then
    echo "❌ Docker Compose is not installed. Installing Docker Compose..."
    
    # Download Docker Compose
    sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
    
    # Make it executable
    sudo chmod +x /usr/local/bin/docker-compose
    
    echo "✅ Docker Compose installed successfully"
fi

# Create project directory
PROJECT_DIR="/opt/ai-remix-platform"
echo "📁 Creating project directory at $PROJECT_DIR..."
sudo mkdir -p $PROJECT_DIR
sudo chown $USER:$USER $PROJECT_DIR

# Navigate to project directory
cd $PROJECT_DIR

# Generate secure passwords and secrets
echo "🔐 Generating secure passwords and secrets..."

# Generate random passwords
POSTGRES_PASSWORD=$(openssl rand -base64 32 | tr -d "=+/" | cut -c1-25)
JWT_SECRET=$(openssl rand -base64 64 | tr -d "=+/" | cut -c1-64)
LOGFLARE_API_KEY=$(openssl rand -base64 32 | tr -d "=+/" | cut -c1-32)
NEXTAUTH_SECRET=$(openssl rand -base64 32 | tr -d "=+/" | cut -c1-32)

# Create .env file with generated secrets
cat > .env << EOF
# Self-hosted Supabase Configuration
# Generated on $(date)

#############
# Database
#############

POSTGRES_HOST=localhost
POSTGRES_DB=postgres
POSTGRES_USER=postgres
POSTGRES_PASSWORD=$POSTGRES_PASSWORD
POSTGRES_PORT=5432

#############
# API Proxy
#############

KONG_HTTP_PORT=8000
KONG_HTTPS_PORT=8443

#############
# Auth
#############

## General
SITE_URL=https://$(hostname -f)
ADDITIONAL_REDIRECT_URLS=
JWT_EXPIRY=3600
DISABLE_SIGNUP=false
API_EXTERNAL_URL=https://$(hostname -f):8000

## Mailer Config
ENABLE_EMAIL_SIGNUP=true
ENABLE_EMAIL_AUTOCONFIRM=true
SMTP_ADMIN_EMAIL=admin@$(hostname -f)
SMTP_HOST=
SMTP_PORT=587
SMTP_USER=
SMTP_PASS=
SMTP_SENDER_NAME=AI Remix Platform

## GitHub OAuth (configure these manually)
ENABLE_GITHUB_SIGNUP=false
GITHUB_CLIENT_ID=your_github_client_id
GITHUB_SECRET=your_github_secret

#############
# API
#############

POSTGREST_PORT=3001
PGRST_DB_SCHEMAS=public,auth,storage
PGRST_DB_ANON_ROLE=anon

#############
# Services
#############

GOTRUE_PORT=9999
STORAGE_PORT=8001
REALTIME_PORT=4000
LOGFLARE_PORT=4000
VECTOR_PORT=9001

#############
# Secrets
#############

JWT_SECRET=$JWT_SECRET
LOGFLARE_API_KEY=$LOGFLARE_API_KEY
ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0
SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImV4cCI6MTk4MzgxMjk5Nn0.EGIM96RAZx35lJzdJsyH-qQwv8Hdp7fsn3W0YpN81IU

#############
# Next.js App
#############

NEXT_PUBLIC_SUPABASE_URL=https://$(hostname -f):8000
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImV4cCI6MTk4MzgxMjk5Nn0.EGIM96RAZx35lJzdJsyH-qQwv8Hdp7fsn3W0YpN81IU

NEXTAUTH_SECRET=$NEXTAUTH_SECRET
NEXTAUTH_URL=https://$(hostname -f):3000
EOF

echo "✅ Environment configuration created"

# Create docker-compose.override.yml for production settings
cat > docker-compose.override.yml << 'EOF'
version: '3.8'
services:
  postgres:
    restart: unless-stopped
    logging:
      driver: "json-file"
      options:
        max-size: "10m"
        max-file: "3"

  postgrest:
    restart: unless-stopped
    logging:
      driver: "json-file"
      options:
        max-size: "10m"
        max-file: "3"

  gotrue:
    restart: unless-stopped
    logging:
      driver: "json-file"
      options:
        max-size: "10m"
        max-file: "3"

  kong:
    restart: unless-stopped
    logging:
      driver: "json-file"
      options:
        max-size: "10m"
        max-file: "3"
EOF

# Set up firewall rules
echo "🔒 Configuring firewall..."
sudo ufw allow 22/tcp  # SSH
sudo ufw allow 80/tcp  # HTTP
sudo ufw allow 443/tcp # HTTPS
sudo ufw allow 8000/tcp # Supabase API
sudo ufw allow 3000/tcp # Next.js app
sudo ufw --force enable

# Create backup script
echo "💾 Creating backup script..."
sudo tee /usr/local/bin/backup-supabase.sh > /dev/null << 'EOF'
#!/bin/bash

# Backup script for Self-hosted Supabase

BACKUP_DIR="/var/backups/supabase"
DATE=$(date +%Y%m%d_%H%M%S)

mkdir -p $BACKUP_DIR

cd /opt/ai-remix-platform

# Backup database
docker-compose exec -T postgres pg_dumpall -c -U postgres | gzip > $BACKUP_DIR/database_$DATE.sql.gz

# Backup storage files
docker run --rm -v ai-remix-platform_storage_data:/volume -v $BACKUP_DIR:/backup alpine tar -czf /backup/storage_$DATE.tar.gz -C /volume .

# Keep only last 7 days of backups
find $BACKUP_DIR -name "database_*.sql.gz" -mtime +7 -delete
find $BACKUP_DIR -name "storage_*.tar.gz" -mtime +7 -delete

echo "Backup completed: $BACKUP_DIR/{database,storage}_$DATE.{sql.gz,tar.gz}"
EOF

sudo chmod +x /usr/local/bin/backup-supabase.sh

# Set up daily backups
echo "⏰ Setting up daily backups..."
(crontab -l 2>/dev/null; echo "0 2 * * * /usr/local/bin/backup-supabase.sh") | crontab -

echo "✅ Self-hosted Supabase setup completed!"
echo ""
echo "📋 Next steps:"
echo "1. Clone your AI Remix Platform repository to this directory"
echo "2. Edit .env file to configure:"
echo "   - SMTP settings for email authentication"
echo "   - GitHub OAuth credentials (optional)"
echo "   - Your domain name instead of hostname"
echo "3. Run: docker-compose up -d"
echo "4. Wait for services to start (check with: docker-compose ps)"
echo "5. Your Supabase will be available at: https://$(hostname -f):8000"
echo ""
echo "🔑 Important credentials (save these securely):"
echo "Database Password: $POSTGRES_PASSWORD"
echo "JWT Secret: $JWT_SECRET"
echo "NextAuth Secret: $NEXTAUTH_SECRET"
echo ""
echo "📊 Monitoring:"
echo "- Check logs: docker-compose logs -f [service-name]"
echo "- View status: docker-compose ps"
echo "- Backup manually: /usr/local/bin/backup-supabase.sh"