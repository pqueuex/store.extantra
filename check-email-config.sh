#!/bin/bash

# Email Configuration Verification Script
# Run this on the production server to check email setup

echo "🔍 Checking Email Configuration..."
echo "=================================="
echo ""

# Check if .env file exists
if [ -f .env ]; then
    echo "✅ .env file exists"
else
    echo "❌ .env file NOT FOUND!"
    exit 1
fi

echo ""
echo "📧 Email Configuration:"
echo "----------------------"

# Check for email variables
if grep -q "GMAIL_USER=" .env; then
    GMAIL_USER=$(grep "GMAIL_USER=" .env | cut -d'=' -f2)
    echo "✅ GMAIL_USER: $GMAIL_USER"
else
    echo "❌ GMAIL_USER: NOT SET"
fi

if grep -q "GMAIL_APP_PASSWORD=" .env; then
    echo "✅ GMAIL_APP_PASSWORD: [SET]"
else
    echo "❌ GMAIL_APP_PASSWORD: NOT SET"
fi

if grep -q "NOTIFICATION_EMAIL=" .env; then
    NOTIFICATION_EMAIL=$(grep "NOTIFICATION_EMAIL=" .env | cut -d'=' -f2)
    echo "✅ NOTIFICATION_EMAIL: $NOTIFICATION_EMAIL"
else
    echo "❌ NOTIFICATION_EMAIL: NOT SET"
fi

echo ""
echo "🔐 Stripe Webhook Configuration:"
echo "--------------------------------"

if grep -q "STRIPE_WEBHOOK_SECRET=" .env; then
    SECRET=$(grep "STRIPE_WEBHOOK_SECRET=" .env | cut -d'=' -f2)
    if [[ $SECRET == whsec_* ]]; then
        echo "✅ STRIPE_WEBHOOK_SECRET: ${SECRET:0:15}... (valid format)"
    else
        echo "⚠️  STRIPE_WEBHOOK_SECRET: SET but may not be valid (should start with 'whsec_')"
    fi
else
    echo "❌ STRIPE_WEBHOOK_SECRET: NOT SET"
fi

echo ""
echo "📦 Dependencies:"
echo "----------------"

if npm list nodemailer &> /dev/null; then
    echo "✅ nodemailer is installed"
else
    echo "❌ nodemailer is NOT installed"
    echo "   Run: npm install nodemailer"
fi

echo ""
echo "🚀 PM2 Status:"
echo "--------------"

if pm2 status extantra-store | grep -q "online"; then
    echo "✅ extantra-store is running"
else
    echo "⚠️  extantra-store is not running or not found"
fi

echo ""
echo "📝 Recent Logs (last 20 lines):"
echo "--------------------------------"
pm2 logs extantra-store --lines 20 --nostream

echo ""
echo "=================================="
echo "✨ Configuration Check Complete!"
echo ""
echo "Next steps:"
echo "1. If any items show ❌, add them to .env file"
echo "2. Run: pm2 restart extantra-store"
echo "3. Make a test purchase"
echo "4. Run: pm2 logs extantra-store -f"
