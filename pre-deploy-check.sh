#!/bin/bash

# Complete deployment script with email configuration
# Run this BEFORE deploying to production

echo "🚀 Pre-Deployment Checklist"
echo "============================"
echo ""

# 1. Check .env file
echo "1️⃣  Checking .env configuration..."
if [ -f .env ]; then
    echo "   ✅ .env file exists"
    
    # Check required variables
    missing=0
    
    if ! grep -q "GMAIL_USER=" .env; then
        echo "   ❌ Missing GMAIL_USER"
        missing=1
    fi
    
    if ! grep -q "GMAIL_APP_PASSWORD=" .env; then
        echo "   ❌ Missing GMAIL_APP_PASSWORD"
        missing=1
    fi
    
    if ! grep -q "NOTIFICATION_EMAIL=" .env; then
        echo "   ❌ Missing NOTIFICATION_EMAIL"
        missing=1
    fi
    
    if ! grep -q "STRIPE_WEBHOOK_SECRET=" .env; then
        echo "   ❌ Missing STRIPE_WEBHOOK_SECRET"
        missing=1
    fi
    
    if [ $missing -eq 0 ]; then
        echo "   ✅ All required env variables present"
    else
        echo ""
        echo "   ⚠️  Add missing variables to .env before deploying!"
        echo ""
    fi
else
    echo "   ❌ .env file NOT FOUND!"
    echo "   Create .env with required variables before deploying"
    exit 1
fi

echo ""

# 2. Check dependencies
echo "2️⃣  Checking dependencies..."
if [ -f package.json ]; then
    echo "   ✅ package.json exists"
    
    if grep -q "nodemailer" package.json; then
        echo "   ✅ nodemailer in package.json"
    else
        echo "   ❌ nodemailer NOT in package.json"
        echo "   Run: npm install nodemailer"
    fi
else
    echo "   ❌ package.json NOT FOUND!"
    exit 1
fi

echo ""

# 3. Check server.js has email code
echo "3️⃣  Checking server.js..."
if [ -f server.js ]; then
    echo "   ✅ server.js exists"
    
    if grep -q "nodemailer" server.js; then
        echo "   ✅ Email code present in server.js"
    else
        echo "   ❌ Email code NOT found in server.js"
    fi
    
    if grep -q "checkout.session.completed" server.js; then
        echo "   ✅ Webhook handler present"
    else
        echo "   ❌ Webhook handler NOT found"
    fi
else
    echo "   ❌ server.js NOT FOUND!"
    exit 1
fi

echo ""

# 4. Git status
echo "4️⃣  Checking git status..."
if [ -d .git ]; then
    if git diff --quiet; then
        echo "   ✅ No uncommitted changes"
    else
        echo "   ⚠️  You have uncommitted changes"
        git status --short
    fi
else
    echo "   ⚠️  Not a git repository"
fi

echo ""

# 5. Print deployment instructions
echo "✅ Pre-deployment check complete!"
echo ""
echo "📋 Deployment Steps:"
echo "-------------------"
echo ""
echo "1. Commit and push your changes:"
echo "   git add ."
echo "   git commit -m 'Update with email functionality'"
echo "   git push origin main"
echo ""
echo "2. SSH to server and pull updates:"
echo "   ssh MT21-deb"
echo "   cd ~/store.extantra"
echo "   git pull origin main"
echo ""
echo "3. Copy .env to server (MANUALLY - don't commit .env!):"
echo "   scp .env MT21-deb:~/store.extantra/.env"
echo ""
echo "4. Install dependencies on server:"
echo "   ssh MT21-deb 'cd ~/store.extantra && npm install'"
echo ""
echo "5. Restart PM2:"
echo "   ssh MT21-deb 'pm2 restart extantra-store'"
echo ""
echo "6. Check logs:"
echo "   ssh MT21-deb 'pm2 logs extantra-store --lines 50'"
echo ""
echo "7. Test with a purchase and check email!"
echo ""
echo "🔐 IMPORTANT: Set up production webhook in Stripe Dashboard:"
echo "   URL: https://store.extantra.net/webhook"
echo "   Event: checkout.session.completed"
echo "   Then update STRIPE_WEBHOOK_SECRET in server's .env"
echo ""
