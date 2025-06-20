# Debian Server Deployment Guide for Extantra Store

## Prerequisites on Debian Server (mt21-deb)

### 1. Install Node.js and npm
```bash
# Update system
sudo apt update && sudo apt upgrade -y

# Install Node.js (LTS version)
curl -fsSL https://deb.nodesource.com/setup_lts.x | sudo -E bash -
sudo apt-get install -y nodejs

# Verify installation
node --version
npm --version
```

### 2. Install PM2 (Process Manager)
```bash
sudo npm install -g pm2
```

### 3. Install Nginx (Reverse Proxy)
```bash
sudo apt install nginx -y
sudo systemctl enable nginx
sudo systemctl start nginx
```

### 4. Setup Firewall
```bash
sudo ufw allow 22      # SSH
sudo ufw allow 80      # HTTP
sudo ufw allow 443     # HTTPS
sudo ufw enable
```

## Step 2: Deploy Application

### 1. Clone Repository on Server
```bash
# SSH into your server
ssh mt21-deb

# Clone your repository
git clone https://github.com/pqueuex/store.extantra.git
cd store.extantra

# Install dependencies
npm install
```

### 2. Configure Environment Variables
```bash
# Create .env file
nano .env
```

Add these variables to `.env`:
```
NODE_ENV=production
PORT=3000
STRIPE_PUBLISHABLE_KEY=pk_live_your_publishable_key_here
STRIPE_SECRET_KEY=sk_live_your_secret_key_here
USPS_CONSUMER_KEY=your_usps_key_here
USPS_CONSUMER_SECRET=your_usps_secret_here
```

### 3. Start Application with PM2
```bash
# Start the application
pm2 start server.js --name "extantra-store"

# Save PM2 configuration
pm2 save

# Setup PM2 to start on boot
pm2 startup
# Follow the generated command
```

## Step 3: Configure Nginx Reverse Proxy

### 1. Create Nginx Configuration
```bash
sudo nano /etc/nginx/sites-available/store.extantra.net
```

Add this configuration:
```nginx
server {
    listen 80;
    server_name store.extantra.net;

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
```

### 2. Enable Site
```bash
sudo ln -s /etc/nginx/sites-available/store.extantra.net /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

## Step 4: SSL Certificate (Let's Encrypt)

```bash
# Install Certbot
sudo apt install certbot python3-certbot-nginx -y

# Get SSL certificate
sudo certbot --nginx -d store.extantra.net

# Auto-renewal is set up automatically
```

## Step 5: DNS Configuration

Update your domain's DNS settings:
- Point `store.extantra.net` A record to your Debian server's IP address
- Wait for DNS propagation (up to 24 hours)

## Step 6: Monitoring Commands

```bash
# Check application status
pm2 status

# View logs
pm2 logs extantra-store

# Restart application
pm2 restart extantra-store

# Check Nginx status
sudo systemctl status nginx

# Check Nginx logs
sudo tail -f /var/log/nginx/access.log
sudo tail -f /var/log/nginx/error.log
```

## Step 7: Updates and Maintenance

```bash
# Pull latest changes
cd /path/to/store.extantra
git pull origin main

# Install new dependencies (if any)
npm install

# Restart application
pm2 restart extantra-store
```

## Security Notes

1. **Firewall**: Only allow necessary ports (22, 80, 443)
2. **Regular Updates**: Keep system and packages updated
3. **Backup**: Regular backups of your application and database
4. **Monitoring**: Set up monitoring for your application
5. **SSL**: Always use HTTPS in production

## Troubleshooting

### Application won't start:
```bash
pm2 logs extantra-store
```

### Nginx issues:
```bash
sudo nginx -t
sudo systemctl status nginx
```

### Port conflicts:
```bash
sudo netstat -tulpn | grep :3000
```
