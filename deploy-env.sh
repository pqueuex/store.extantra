#!/bin/bash

# Quick fix script - copies .env to server and restarts
# Usage: ./deploy-env.sh

echo "🔧 Deploying Email Configuration to Production"
echo "=============================================="
echo ""

# Check if .env exists locally
if [ ! -f .env ]; then
    echo "❌ .env file not found in current directory!"
    exit 1
fi

echo "✅ Found local .env file"
echo ""

# Verify email variables exist
echo "🔍 Checking email configuration..."
if grep -q "GMAIL_USER=" .env && grep -q "GMAIL_APP_PASSWORD=" .env; then
    echo "✅ Email credentials found"
else
    echo "❌ Email credentials missing from .env!"
    echo "   Add GMAIL_USER and GMAIL_APP_PASSWORD"
    exit 1
fi

echo ""
echo "📤 Copying .env to production server..."
scp .env MT21-deb:~/store.extantra/.env

if [ $? -eq 0 ]; then
    echo "✅ .env copied successfully"
else
    echo "❌ Failed to copy .env"
    exit 1
fi

echo ""
echo "🔄 Restarting server..."
ssh MT21-deb 'pm2 restart extantra-store'

if [ $? -eq 0 ]; then
    echo "✅ Server restarted"
else
    echo "❌ Failed to restart server"
    exit 1
fi

echo ""
echo "📋 Checking server logs..."
ssh MT21-deb 'pm2 logs extantra-store --lines 20 --nostream'

echo ""
echo "=================================="
echo "✨ Deployment Complete!"
echo ""
echo "Next steps:"
echo "1. Make a test purchase on your live site"
echo "2. Watch logs: ssh MT21-deb 'pm2 logs extantra-store -f'"
echo "3. Check your email (pqueue001@gmail.com)"
echo ""
echo "If you don't receive an email, run:"
echo "   ssh MT21-deb 'cd ~/store.extantra && ./check-email-config.sh'"
echo ""
