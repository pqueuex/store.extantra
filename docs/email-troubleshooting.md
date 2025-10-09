# Email Not Sending - Troubleshooting Guide

## Issue
Emails are not being sent on production server when customers make purchases.

---

## Root Causes

### 1. Missing Environment Variables on Server
The production server likely doesn't have the email credentials in its `.env` file.

**Solution: SSH into server and add email configuration**

```bash
ssh MT21-deb
cd ~/store.extantra
nano .env
```

Add these lines to `.env`:
```bash
# Email notifications
NOTIFICATION_EMAIL=pqueue001@gmail.com
GMAIL_USER=pqueue001@gmail.com
GMAIL_APP_PASSWORD=YOUR_GMAIL_APP_PASSWORD_HERE

# Stripe webhook (production)
STRIPE_WEBHOOK_SECRET=whsec_YOUR_PRODUCTION_WEBHOOK_SECRET
```

Then restart PM2:
```bash
pm2 restart extantra-store
pm2 logs extantra-store --lines 50
```

---

### 2. Production Webhook Not Configured
The webhook secret in production is different from local development.

**Check current webhook secret on server:**
```bash
ssh MT21-deb
cd ~/store.extantra
grep STRIPE_WEBHOOK_SECRET .env
```

**Get production webhook secret from Stripe Dashboard:**
1. Go to https://dashboard.stripe.com/webhooks
2. Find your production webhook endpoint (should be `https://extantra.net/webhook`)
3. Click "Reveal" on the signing secret
4. Copy the `whsec_...` value
5. Update `.env` on server with this value

---

### 3. Webhook Endpoint Not Created in Stripe Dashboard
The webhook might not be set up in production mode.

**Create production webhook:**
1. Go to https://dashboard.stripe.com/webhooks
2. Click "Add endpoint"
3. Enter endpoint URL: `https://store.extantra.net/webhook`
4. Select events to send: `checkout.session.completed`
5. Add endpoint
6. Copy the signing secret
7. Add to server's `.env` file

---

### 4. Missing nodemailer Package on Server
Server might not have the nodemailer dependency installed.

**Check and install:**
```bash
ssh MT21-deb
cd ~/store.extantra
npm list nodemailer

# If not installed:
npm install nodemailer
pm2 restart extantra-store
```

---

## Quick Diagnostic Commands

### Check if .env exists on server:
```bash
ssh MT21-deb "cd ~/store.extantra && ls -la .env"
```

### Check if email variables are set:
```bash
ssh MT21-deb "cd ~/store.extantra && grep -E 'GMAIL|NOTIFICATION' .env"
```

### Check PM2 logs for email errors:
```bash
ssh MT21-deb "pm2 logs extantra-store --lines 100 | grep -i email"
```

### Check if webhook is receiving events:
```bash
ssh MT21-deb "pm2 logs extantra-store --lines 100 | grep -i webhook"
```

---

## Test Email Functionality

### Option 1: Use test script on server
```bash
ssh MT21-deb
cd ~/store.extantra
cat > test-email.js << 'EOF'
require('dotenv').config();
const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.GMAIL_USER,
        pass: process.env.GMAIL_APP_PASSWORD
    }
});

transporter.sendMail({
    from: process.env.GMAIL_USER,
    to: process.env.NOTIFICATION_EMAIL,
    subject: 'Test Email from Production Server',
    text: 'If you receive this, email is configured correctly!'
}).then(() => {
    console.log('✅ Email sent successfully!');
    process.exit(0);
}).catch((err) => {
    console.error('❌ Email failed:', err);
    process.exit(1);
});
EOF

node test-email.js
```

### Option 2: Test webhook with Stripe CLI
```bash
# On your local machine
stripe trigger checkout.session.completed
```

Then check server logs:
```bash
ssh MT21-deb "pm2 logs extantra-store --lines 50"
```

---

## Complete Fix Procedure

### Step 1: Add .env variables
```bash
ssh MT21-deb
cd ~/store.extantra
nano .env
```

Add/verify these lines:
```env
NODE_ENV=production
PORT=3000

# Stripe (make sure these are LIVE keys)
STRIPE_PUBLISHABLE_KEY=pk_live_YOUR_PUBLISHABLE_KEY_HERE
STRIPE_SECRET_KEY=sk_live_YOUR_SECRET_KEY_HERE

# Email notifications
NOTIFICATION_EMAIL=pqueue001@gmail.com
GMAIL_USER=pqueue001@gmail.com
GMAIL_APP_PASSWORD=YOUR_GMAIL_APP_PASSWORD_HERE

# Stripe webhook (GET THIS FROM STRIPE DASHBOARD)
STRIPE_WEBHOOK_SECRET=whsec_YOUR_PRODUCTION_WEBHOOK_SECRET_HERE
```

Save and exit (Ctrl+O, Enter, Ctrl+X)

### Step 2: Verify dependencies
```bash
npm install
```

### Step 3: Restart server
```bash
pm2 restart extantra-store
pm2 logs extantra-store --lines 50
```

### Step 4: Test with real purchase
Make a test purchase and watch logs in real-time:
```bash
pm2 logs extantra-store -f
```

Look for these messages:
- ✅ `Order notification email sent for session...`
- ❌ `⚠️  Email not configured` (means env vars missing)
- ❌ `⚠️  Webhook signature verification failed` (means wrong webhook secret)

---

## Expected Log Output (Success)

When everything works, you should see:
```
✅ Order notification email sent for session cs_test_...
```

---

## Expected Log Output (Failure)

### Missing email config:
```
⚠️  Email not configured - order details: ...
```
**Fix:** Add GMAIL_USER and GMAIL_APP_PASSWORD to .env

### Wrong webhook secret:
```
⚠️  Webhook signature verification failed.
Webhook Error: ...
```
**Fix:** Update STRIPE_WEBHOOK_SECRET with production value

### Webhook not receiving events:
```
(no webhook logs at all)
```
**Fix:** Create webhook endpoint in Stripe Dashboard

---

## Customer Email Confirmation

**Note:** Customers receive emails automatically from Stripe, NOT from your server.

To enable customer receipts:
1. Go to https://dashboard.stripe.com/settings/emails
2. Enable "Successful payments" emails
3. Customize the email template

Your server only sends YOU (the merchant) notifications about orders.

---

## Security Note

The `.env` file contains sensitive credentials. Make sure:
- ✅ `.env` is in `.gitignore` (it is)
- ✅ Never commit .env to git
- ✅ Only you have SSH access to the server
- ✅ File permissions: `chmod 600 .env`

---

## Quick Reference Commands

```bash
# SSH to server
ssh MT21-deb

# Edit environment variables
nano ~/store.extantra/.env

# Restart server
pm2 restart extantra-store

# View logs
pm2 logs extantra-store

# Test email
node ~/store.extantra/test-email.js

# Check webhook endpoint
curl -I https://store.extantra.net/webhook
```

---

## Most Likely Issue

Based on your symptoms, the **#1 most likely issue** is:

**The production server's `.env` file is missing the email configuration.**

**Quick fix:**
```bash
ssh MT21-deb
cd ~/store.extantra
cat >> .env << 'EOF'

# Email notifications
NOTIFICATION_EMAIL=pqueue001@gmail.com
GMAIL_USER=pqueue001@gmail.com
GMAIL_APP_PASSWORD=YOUR_GMAIL_APP_PASSWORD_HERE
EOF

pm2 restart extantra-store
pm2 logs extantra-store
```

Then make a test purchase and watch the logs! 🎯
