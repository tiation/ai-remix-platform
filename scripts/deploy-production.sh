#!/bin/bash

# Production Deployment Script for AI Remix Platform
# ChaseWhiteRabbit NGO - docker.tiation.net
# Optimized for low-overhead SaaS operation

set -e

# Configuration
DOMAIN="ai-remix.tiation.net"
PROJECT_DIR="/opt/ai-remix-platform"
BACKUP_DIR="/var/backups/ai-remix-platform"
LOG_FILE="/var/log/ai-remix-deployment.log"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

log() {
    echo -e "${GREEN}[$(date +'%Y-%m-%d %H:%M:%S')] $1${NC}" | tee -a $LOG_FILE
}

warn() {
    echo -e "${YELLOW}[$(date +'%Y-%m-%d %H:%M:%S')] WARNING: $1${NC}" | tee -a $LOG_FILE
}

error() {
    echo -e "${RED}[$(date +'%Y-%m-%d %H:%M:%S')] ERROR: $1${NC}" | tee -a $LOG_FILE
}

info() {
    echo -e "${BLUE}[$(date +'%Y-%m-%d %H:%M:%S')] INFO: $1${NC}" | tee -a $LOG_FILE
}

# Check if running as root
check_root() {
    if [ "$EUID" -ne 0 ]; then
        error "Please run this script as root (sudo)"
        exit 1
    fi
}

# System requirements check
check_requirements() {
    log "Checking system requirements..."
    
    # Check Docker
    if ! command -v docker &> /dev/null; then
        error "Docker is not installed"
        exit 1
    fi
    
    # Check Docker Compose
    if ! command -v docker-compose &> /dev/null; then
        error "Docker Compose is not installed"
        exit 1
    fi
    
    # Check available memory
    MEMORY_GB=$(free -g | awk 'NR==2{printf "%.1f", $2}')
    if (( $(echo "$MEMORY_GB < 2" | bc -l) )); then
        warn "System has less than 2GB RAM. Consider upgrading for better performance."
    fi
    
    # Check available disk space
    DISK_GB=$(df -BG /opt | awk 'NR==2 {print $4}' | sed 's/G//')
    if [ "$DISK_GB" -lt 5 ]; then
        error "Less than 5GB free space available in /opt"
        exit 1
    fi
    
    log "System requirements check passed"
}

# Generate secure passwords and keys
generate_secrets() {
    log "Generating secure secrets..."
    
    # Generate strong passwords
    POSTGRES_PASSWORD=$(openssl rand -base64 32 | tr -d "=+/" | cut -c1-32)
    JWT_SECRET=$(openssl rand -base64 64 | tr -d "=+/" | cut -c1-64)
    NEXTAUTH_SECRET=$(openssl rand -base64 32 | tr -d "=+/" | cut -c1-32)
    
    # Generate production Supabase API keys based on JWT secret
    # Create proper JWT tokens for production use
    ANON_PAYLOAD='{"iss":"supabase","ref":"ai-remix-platform","role":"anon","iat":1640995200,"exp":2147483647}'
    SERVICE_PAYLOAD='{"iss":"supabase","ref":"ai-remix-platform","role":"service_role","iat":1640995200,"exp":2147483647}'
    
    # Generate JWT tokens using the secret
    ANON_KEY=$(echo -n "$ANON_PAYLOAD" | openssl base64 -A | tr -d '=' | tr '/+' '_-')
    SERVICE_ROLE_KEY=$(echo -n "$SERVICE_PAYLOAD" | openssl base64 -A | tr -d '=' | tr '/+' '_-')
    
    # Create proper signed JWTs (simplified - in production use proper JWT library)
    ANON_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.$(echo -n '{"iss":"supabase","ref":"ai-remix-platform","role":"anon","iat":1640995200,"exp":2147483647}' | openssl base64 -A | tr -d '=' | tr '/+' '_-').$(echo -n "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.$(echo -n '{"iss":"supabase","ref":"ai-remix-platform","role":"anon","iat":1640995200,"exp":2147483647}' | openssl base64 -A | tr -d '=' | tr '/+' '_-')" | openssl dgst -sha256 -hmac "$JWT_SECRET" -binary | openssl base64 -A | tr -d '=' | tr '/+' '_-')"
    SERVICE_ROLE_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.$(echo -n '{"iss":"supabase","ref":"ai-remix-platform","role":"service_role","iat":1640995200,"exp":2147483647}' | openssl base64 -A | tr -d '=' | tr '/+' '_-').$(echo -n "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.$(echo -n '{"iss":"supabase","ref":"ai-remix-platform","role":"service_role","iat":1640995200,"exp":2147483647}' | openssl base64 -A | tr -d '=' | tr '/+' '_-')" | openssl dgst -sha256 -hmac "$JWT_SECRET" -binary | openssl base64 -A | tr -d '=' | tr '/+' '_-')"
    
    log "Production secrets and JWT tokens generated successfully"
}

# Create production environment file
create_env_file() {
    log "Creating production environment file..."
    
    cat > $PROJECT_DIR/.env << EOF
# Production Environment - Generated on $(date)
# AI Remix Platform for ChaseWhiteRabbit NGO

#############
# Domain & URLs
#############
DOMAIN=$DOMAIN
SITE_URL=https://$DOMAIN
API_EXTERNAL_URL=https://$DOMAIN
NEXTAUTH_URL=https://$DOMAIN

#############
# Database Configuration
#############
POSTGRES_HOST=postgres
POSTGRES_DB=ai_remix_platform
POSTGRES_USER=postgres
POSTGRES_PASSWORD=$POSTGRES_PASSWORD

#############
# Security Secrets
#############
JWT_SECRET=$JWT_SECRET
NEXTAUTH_SECRET=$NEXTAUTH_SECRET

#############
# Supabase API Keys
#############
ANON_KEY=$ANON_KEY
SERVICE_ROLE_KEY=$SERVICE_ROLE_KEY

#############
# API Configuration
#############
PGRST_DB_SCHEMAS=public,auth,storage
PGRST_DB_ANON_ROLE=anon

#############
# Authentication Settings
#############
JWT_EXPIRY=3600
DISABLE_SIGNUP=false
ENABLE_EMAIL_SIGNUP=true
ENABLE_EMAIL_AUTOCONFIRM=false

#############
# Email Configuration
#############
SMTP_ADMIN_EMAIL=admin@chasewhiterabbit.org
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=noreply@chasewhiterabbit.org
SMTP_PASS=
SMTP_SENDER_NAME=ChaseWhiteRabbit AI Platform

#############
# GitHub OAuth (Configure manually)
#############
ENABLE_GITHUB_SIGNUP=true
GITHUB_CLIENT_ID=
GITHUB_SECRET=

#############
# Rate Limiting & Resource Management
#############
RATE_LIMIT_MAX=100
RATE_LIMIT_WINDOW=60000
MAX_FILE_SIZE=10485760

#############
# NGO Configuration
#############
ORG_NAME=ChaseWhiteRabbit
ORG_DESCRIPTION=AI-powered tools for NGOs and social impact organizations
ORG_WEBSITE=https://chasewhiterabbit.org
CONTACT_EMAIL=support@chasewhiterabbit.org
EOF

    chmod 600 $PROJECT_DIR/.env
    log "Environment file created and secured"
}

# Set up directories and permissions
setup_directories() {
    log "Setting up directories and permissions..."
    
    mkdir -p $PROJECT_DIR/{uploads,backups,logs}
    mkdir -p $BACKUP_DIR
    mkdir -p /var/log
    
    # Set proper permissions
    chown -R www-data:www-data $PROJECT_DIR/uploads
    chmod 755 $PROJECT_DIR/{backups,logs}
    
    log "Directories set up successfully"
}

# Install and configure Traefik
setup_traefik() {
    log "Setting up Traefik reverse proxy..."
    
    mkdir -p $PROJECT_DIR/traefik
    
    cat > $PROJECT_DIR/traefik/traefik.yml << 'EOF'
# Traefik configuration for AI Remix Platform
global:
  checkNewVersion: false
  sendAnonymousUsage: false

api:
  dashboard: true
  insecure: false

entryPoints:
  web:
    address: ":80"
    http:
      redirections:
        entryPoint:
          to: websecure
          scheme: https
  websecure:
    address: ":443"

certificatesResolvers:
  letsencrypt:
    acme:
      email: admin@tiation.net
      storage: /data/acme.json
      httpChallenge:
        entryPoint: web

providers:
  docker:
    endpoint: "unix:///var/run/docker.sock"
    exposedByDefault: false
    network: ai-remix-network
  file:
    directory: /etc/traefik/dynamic
    watch: true
EOF
    
    log "Traefik configuration created"
}

# Set up monitoring
setup_monitoring() {
    log "Setting up monitoring with Prometheus..."
    
    mkdir -p $PROJECT_DIR/monitoring
    
    cat > $PROJECT_DIR/monitoring/prometheus.yml << 'EOF'
global:
  scrape_interval: 60s
  evaluation_interval: 60s

scrape_configs:
  - job_name: 'ai-remix-platform'
    static_configs:
      - targets: ['nextjs-app:3000']
    metrics_path: /api/metrics
    scrape_interval: 60s
    
  - job_name: 'postgres'
    static_configs:
      - targets: ['postgres:5432']
    scrape_interval: 60s
    
  - job_name: 'traefik'
    static_configs:
      - targets: ['traefik:8080']
    scrape_interval: 60s
EOF
    
    log "Monitoring configuration created"
}

# Create backup script
create_backup_script() {
    log "Creating backup script..."
    
    cat > /usr/local/bin/backup-ai-remix.sh << 'EOF'
#!/bin/bash

# AI Remix Platform Backup Script
BACKUP_DIR="/var/backups/ai-remix-platform"
PROJECT_DIR="/opt/ai-remix-platform"
DATE=$(date +%Y%m%d_%H%M%S)

mkdir -p $BACKUP_DIR

# Backup database
docker exec ai-remix-platform_postgres_1 pg_dumpall -c -U postgres | gzip > $BACKUP_DIR/database_$DATE.sql.gz

# Backup uploads
tar -czf $BACKUP_DIR/uploads_$DATE.tar.gz -C $PROJECT_DIR uploads/

# Backup environment and configuration
tar -czf $BACKUP_DIR/config_$DATE.tar.gz -C $PROJECT_DIR .env docker-compose.prod.yml

# Keep only last 7 days of backups
find $BACKUP_DIR -name "*.gz" -mtime +7 -delete

echo "Backup completed: $BACKUP_DIR/*_$DATE.*"
EOF
    
    chmod +x /usr/local/bin/backup-ai-remix.sh
    
    # Set up daily backups
    (crontab -l 2>/dev/null; echo "0 2 * * * /usr/local/bin/backup-ai-remix.sh") | crontab -
    
    log "Backup script created and scheduled"
}

# Configure firewall
setup_firewall() {
    log "Configuring firewall..."
    
    # Install UFW if not present
    if ! command -v ufw &> /dev/null; then
        apt update && apt install -y ufw
    fi
    
    # Reset UFW to default
    ufw --force reset
    
    # Default policies
    ufw default deny incoming
    ufw default allow outgoing
    
    # Allow SSH
    ufw allow 22/tcp
    
    # Allow HTTP/HTTPS
    ufw allow 80/tcp
    ufw allow 443/tcp
    
    # Enable UFW
    ufw --force enable
    
    log "Firewall configured"
}

# Deploy the application
deploy_application() {
    log "Deploying AI Remix Platform..."
    
    cd $PROJECT_DIR
    
    # Pull latest images
    docker-compose -f docker-compose.prod.yml pull
    
    # Build and start services
    docker-compose -f docker-compose.prod.yml up -d --build
    
    # Wait for services to be healthy
    log "Waiting for services to start..."
    sleep 30
    
    # Check if services are running
    if docker-compose -f docker-compose.prod.yml ps | grep -q "Up"; then
        log "Services started successfully"
    else
        error "Some services failed to start"
        docker-compose -f docker-compose.prod.yml logs
        exit 1
    fi
}

# Health check
health_check() {
    log "Performing health check..."
    
    # Check if main application is responding
    if curl -f -s https://$DOMAIN/api/health > /dev/null; then
        log "✅ Main application is healthy"
    else
        warn "⚠️ Main application health check failed"
    fi
    
    # Check database connectivity
    if docker exec ai-remix-platform_postgres_1 pg_isready -U postgres > /dev/null; then
        log "✅ Database is healthy"
    else
        warn "⚠️ Database health check failed"
    fi
    
    # Check disk space
    DISK_USAGE=$(df /opt | awk 'NR==2 {print $5}' | sed 's/%//')
    if [ "$DISK_USAGE" -lt 80 ]; then
        log "✅ Disk space OK ($DISK_USAGE% used)"
    else
        warn "⚠️ Disk space low ($DISK_USAGE% used)"
    fi
}

# Print deployment summary
print_summary() {
    log "🎉 AI Remix Platform deployment completed!"
    echo ""
    echo "🌐 Your platform is available at:"
    echo "   Main App:    https://$DOMAIN"
    echo "   Monitoring:  https://monitoring.tiation.net"
    echo "   Traefik:     https://traefik.tiation.net"
    echo ""
    echo "🔧 Configuration:"
    echo "   Environment: $PROJECT_DIR/.env"
    echo "   Logs:        docker-compose -f docker-compose.prod.yml logs -f"
    echo "   Backup:      /usr/local/bin/backup-ai-remix.sh"
    echo ""
    echo "🔑 Important credentials (save securely):"
    echo "   Database Password: $POSTGRES_PASSWORD"
    echo "   JWT Secret: $JWT_SECRET"
    echo "   NextAuth Secret: $NEXTAUTH_SECRET"
    echo ""
    echo "📋 Next steps:"
    echo "   1. Configure GitHub OAuth: https://github.com/settings/applications/new"
    echo "   2. Set up SMTP email credentials in .env file"
    echo "   3. Configure Stripe for billing (optional)"
    echo "   4. Monitor logs: docker-compose -f docker-compose.prod.yml logs -f"
    echo ""
    echo "💝 Supporting ChaseWhiteRabbit NGO mission!"
}

# Main deployment function
main() {
    log "Starting AI Remix Platform production deployment..."
    log "Target: docker.tiation.net ($DOMAIN)"
    
    check_root
    check_requirements
    generate_secrets
    setup_directories
    create_env_file
    setup_traefik
    setup_monitoring
    create_backup_script
    setup_firewall
    deploy_application
    health_check
    print_summary
    
    log "Deployment completed successfully! 🚀"
}

# Run main function
main "$@"