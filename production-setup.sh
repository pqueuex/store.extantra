#!/bin/bash

# Quick Setup Script for Production Deployment
# Run this after completing the main deployment

echo "🚀 Extantra Store - Production Setup Script"
echo "============================================"

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

# Helper functions
success() { echo -e "${GREEN}✅ $1${NC}"; }
warning() { echo -e "${YELLOW}⚠️  $1${NC}"; }
error() { echo -e "${RED}❌ $1${NC}"; }

# Check if running on server
if [[ $HOSTNAME != *"MT21"* ]]; then
    error "This script should be run on your MT21-deb server"
    exit 1
fi

echo "Starting production setup..."

# 1. Update system packages
echo "📦 Updating system packages..."
sudo apt update && sudo apt upgrade -y
success "System updated"

# 2. Install required packages
echo "🔧 Installing required packages..."
sudo apt install -y nginx certbot python3-certbot-nginx fail2ban ufw htop

# 3. Configure firewall
echo "🔒 Configuring firewall..."
sudo ufw --force reset
sudo ufw default deny incoming
sudo ufw default allow outgoing
# Only allow web traffic - NO SSH from internet for security
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
sudo ufw --force enable
success "Firewall configured (SSH kept local-only for security)"

# 4. Configure Fail2Ban
echo "🛡️  Configuring Fail2Ban..."
sudo tee /etc/fail2ban/jail.local > /dev/null << 'EOF'
[DEFAULT]
bantime = 3600
findtime = 600
maxretry = 3

# Monitor nginx for suspicious activity
[nginx-http-auth]
enabled = true
filter = nginx-http-auth
port = http,https
logpath = /var/log/nginx/error.log

[nginx-limit-req]
enabled = true
filter = nginx-limit-req
port = http,https
logpath = /var/log/nginx/error.log
maxretry = 10
EOF

sudo systemctl enable fail2ban
sudo systemctl restart fail2ban
success "Fail2Ban configured"

# 5. Create Nginx configuration
echo "🌐 Creating Nginx configuration..."
sudo tee /etc/nginx/sites-available/store.extantra.net > /dev/null << 'EOF'
server {
    listen 80;
    listen [::]:80;
    server_name store.extantra.net www.store.extantra.net;

    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header Referrer-Policy "no-referrer-when-downgrade" always;

    gzip on;
    gzip_vary on;
    gzip_min_length 1024;
    gzip_types text/plain text/css text/xml text/javascript application/javascript application/xml+rss application/json;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}
EOF

# Remove default site and enable ours
sudo rm -f /etc/nginx/sites-enabled/default
sudo ln -sf /etc/nginx/sites-available/store.extantra.net /etc/nginx/sites-enabled/

# Test nginx configuration
if sudo nginx -t; then
    sudo systemctl restart nginx
    success "Nginx configured and restarted"
else
    error "Nginx configuration test failed"
    exit 1
fi

# 6. Create update script
echo "📝 Creating update script..."
tee ~/update-store.sh > /dev/null << 'EOF'
#!/bin/bash
echo "🔄 Updating Extantra Store..."
cd ~/store.extantra
git pull origin main
npm install
pm2 restart extantra-store
echo "✅ Update complete!"
pm2 logs extantra-store --lines 5
EOF
chmod +x ~/update-store.sh
success "Update script created"

# 7. Create backup script
echo "💾 Creating backup script..."
tee ~/backup-store.sh > /dev/null << 'EOF'
#!/bin/bash
BACKUP_DIR="$HOME/backups"
DATE=$(date +%Y%m%d_%H%M%S)

mkdir -p $BACKUP_DIR
tar -czf $BACKUP_DIR/store_backup_$DATE.tar.gz ~/store.extantra
find $BACKUP_DIR -name "store_backup_*.tar.gz" -mtime +7 -delete

echo "Backup completed: store_backup_$DATE.tar.gz"
ls -lh $BACKUP_DIR/store_backup_$DATE.tar.gz
EOF
chmod +x ~/backup-store.sh
success "Backup script created"

# 8. Create monitoring script
echo "📊 Creating monitoring script..."
tee ~/monitor-store.sh > /dev/null << 'EOF'
#!/bin/bash
echo "🖥️  Extantra Store Status"
echo "========================"
echo ""

echo "📱 Application Status:"
pm2 status

echo ""
echo "🌐 Nginx Status:"
sudo systemctl status nginx --no-pager -l

echo ""
echo "🔒 Firewall Status:"
sudo ufw status

echo ""
echo "🛡️  Fail2Ban Status:"
sudo fail2ban-client status

echo ""
echo "💾 Disk Usage:"
df -h /

echo ""
echo "🧠 Memory Usage:"
free -h

echo ""
echo "📊 Recent Logs:"
pm2 logs extantra-store --lines 5 --raw
EOF
chmod +x ~/monitor-store.sh
success "Monitoring script created"

# 9. Set up PM2 startup
echo "🔄 Setting up PM2 auto-start..."
warning "You'll need to run this command manually with sudo:"
echo "sudo env PATH=\$PATH:/usr/bin /usr/lib/node_modules/pm2/bin/pm2 startup systemd -u $USER --hp $HOME"

echo ""
echo "🎉 Production setup complete!"
echo ""
echo "📋 Next Steps:"
echo "1. Update your .env file with real Stripe keys: nano ~/store.extantra/.env"
echo "2. Restart application: pm2 restart extantra-store"
echo "3. Set up PM2 auto-start (see command above)"
echo "4. Configure DNS to point store.extantra.net to your server"
echo "5. Get SSL certificate: sudo certbot --nginx -d store.extantra.net"
echo ""
echo "📚 Useful Commands:"
echo "  ./monitor-store.sh    - Check system status"
echo "  ./update-store.sh     - Update application"
echo "  ./backup-store.sh     - Backup application"
echo ""
echo "🌍 Your store will be live at: https://store.extantra.net"
