# 🚀 Server Deployment Commands

## Step 1: Connect to Your Server

```bash
ssh your-username@your-server-ip
# OR if you have a specific SSH key:
ssh -i ~/.ssh/your-key.pem your-username@your-server-ip
```

---

## Step 2: Navigate to Your Project Directory

```bash
cd /path/to/store.extantra
# Example: cd /var/www/store.extantra
```

---

## Step 3: Pull Latest Changes from Git

```bash
# Stash any local changes (if needed)
git stash

# Pull latest changes from main branch
git pull origin main

# OR if you need to force pull:
git fetch --all
git reset --hard origin/main
```

---

## Step 4: Install/Update Dependencies

```bash
# Install any new npm packages
npm install

# OR use clean install for production:
npm ci
```

---

## Step 5: Update Environment Variables (if needed)

```bash
# Edit .env file if you need to update credentials
nano .env
# OR
vim .env

# Make sure these are set for production:
# - STRIPE_PUBLISHABLE_KEY (live key)
# - STRIPE_SECRET_KEY (live key)
# - STRIPE_WEBHOOK_SECRET (production webhook)
# - GMAIL_USER
# - GMAIL_APP_PASSWORD
# - NOTIFICATION_EMAIL
```

---

## Step 6: Restart the Server

### Option A: If using PM2 (Process Manager)

```bash
# Restart the app
pm2 restart store-extantra

# OR if first time with PM2:
pm2 start server.js --name store-extantra

# View logs
pm2 logs store-extantra

# Save PM2 config
pm2 save
```

### Option B: If using systemd

```bash
# Restart the service
sudo systemctl restart store-extantra

# Check status
sudo systemctl status store-extantra

# View logs
sudo journalctl -u store-extantra -f
```

### Option C: If running with screen/tmux

```bash
# Kill existing process
lsof -ti :3000 | xargs kill -9

# Start new screen session
screen -S store-extantra

# Inside screen, start server
npm start

# Detach from screen: Ctrl+A then D
```

### Option D: If using nohup (background process)

```bash
# Kill existing process
lsof -ti :3000 | xargs kill -9

# Start in background
nohup npm start > server.log 2>&1 &

# View logs
tail -f server.log
```

---

## Step 7: Verify Deployment

```bash
# Check if server is running
curl http://localhost:3000

# Check process
ps aux | grep node

# Check port
lsof -i :3000
```

---

## 🔧 Complete Deployment Script

Save this as `deploy.sh` on your server:

```bash
#!/bin/bash

echo "🚀 Starting deployment..."

# Navigate to project
cd /var/www/store.extantra || exit

# Pull latest changes
echo "📥 Pulling latest changes..."
git stash
git pull origin main

# Install dependencies
echo "📦 Installing dependencies..."
npm ci --production

# Restart with PM2
echo "🔄 Restarting server..."
pm2 restart store-extantra || pm2 start server.js --name store-extantra

# Save PM2 config
pm2 save

# Show status
echo "✅ Deployment complete!"
pm2 status store-extantra
pm2 logs store-extantra --lines 20
```

Then run:
```bash
chmod +x deploy.sh
./deploy.sh
```

---

## 📋 Quick Reference Commands

### Pull and Restart (One-liner for PM2):
```bash
cd /var/www/store.extantra && git pull origin main && npm ci && pm2 restart store-extantra
```

### Pull and Restart (systemd):
```bash
cd /var/www/store.extantra && git pull origin main && npm ci && sudo systemctl restart store-extantra
```

### Check if running:
```bash
curl http://localhost:3000
```

### View logs:
```bash
# PM2
pm2 logs store-extantra

# systemd
sudo journalctl -u store-extantra -f

# nohup
tail -f server.log
```

### Check server status:
```bash
# PM2
pm2 status

# systemd
sudo systemctl status store-extantra

# Manual
ps aux | grep node
```

---

## 🔒 Production Checklist

Before deploying to production:

- [ ] Update `.env` with production Stripe keys
- [ ] Configure production webhook in Stripe Dashboard
- [ ] Set `NODE_ENV=production` in `.env`
- [ ] Ensure SSL/HTTPS is configured
- [ ] Test email notifications work
- [ ] Verify webhook endpoint is accessible
- [ ] Check firewall allows port 3000 (or your port)
- [ ] Set up automatic backups
- [ ] Configure monitoring/alerts

---

## 🆘 Troubleshooting

### Server won't start?
```bash
# Check what's using port 3000
lsof -i :3000

# Kill the process
lsof -ti :3000 | xargs kill -9

# Try starting again
npm start
```

### Git pull conflicts?
```bash
# Stash local changes
git stash

# Pull again
git pull origin main

# OR force reset to remote
git fetch --all
git reset --hard origin/main
```

### Dependencies issues?
```bash
# Clean install
rm -rf node_modules package-lock.json
npm install
```

### Webhook not working?
```bash
# Check webhook secret matches
cat .env | grep STRIPE_WEBHOOK_SECRET

# Test webhook endpoint
curl -X POST http://localhost:3000/webhook

# Check Stripe Dashboard webhook logs
```

---

## 📝 What You Need to Know

**Server Path:** Where is your project? (e.g., `/var/www/store.extantra`)

**Process Manager:** What are you using?
- PM2 (recommended)
- systemd
- screen/tmux
- nohup

**Domain:** What's your production URL? (e.g., `https://store.extantra.net`)

Let me know these details and I can give you the exact commands! 🚀
