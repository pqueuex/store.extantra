# 🚨 Email Not Sending - Quick Fix

## Problem
No emails are being sent on production when customers make purchases.

---

## Most Likely Cause
**The production server's `.env` file doesn't have email credentials.**

---

## Quick Fix (Copy & Paste)

### Step 1: SSH to your server
```bash
ssh MT21-deb
cd ~/store.extantra
```

### Step 2: Check if email config exists
```bash
./check-email-config.sh
```

### Step 3: Add email configuration to .env
```bash
nano .env
```

Add these lines (if they're missing):
```env
# Email notifications
NOTIFICATION_EMAIL=pqueue001@gmail.com
GMAIL_USER=pqueue001@gmail.com
GMAIL_APP_PASSWORD=YOUR_GMAIL_APP_PASSWORD_HERE
```

Save: `Ctrl+O`, `Enter`, `Ctrl+X`

### Step 4: Restart the server
```bash
pm2 restart extantra-store
```

### Step 5: Watch logs in real-time
```bash
pm2 logs extantra-store -f
```

### Step 6: Make a test purchase
- Go to your live site
- Add item to cart
- Complete checkout with test card: `4242 4242 4242 4242`
- Watch the logs - you should see: `✅ Order notification email sent for session...`

---

## Webhook Issue?

If emails still don't send, you might need to set up the production webhook:

### Get Production Webhook Secret:
1. Go to: https://dashboard.stripe.com/webhooks
2. Look for endpoint: `https://store.extantra.net/webhook`
3. If it doesn't exist, click "Add endpoint":
   - URL: `https://store.extantra.net/webhook`
   - Events: `checkout.session.completed`
4. Click "Reveal" on signing secret
5. Copy the `whsec_...` value

### Add to server .env:
```bash
ssh MT21-deb
cd ~/store.extantra
nano .env
```

Add/update:
```env
STRIPE_WEBHOOK_SECRET=whsec_YOUR_PRODUCTION_SECRET_HERE
```

Restart:
```bash
pm2 restart extantra-store
```

---

## Customer Emails

**Important:** Customers receive emails from **Stripe**, not your server.

To enable customer receipts:
1. Go to: https://dashboard.stripe.com/settings/emails
2. Toggle ON: "Successful payments"
3. Customize template (optional)

Your server only emails **you** (the merchant) about new orders.

---

## Test Commands

### Run check script:
```bash
ssh MT21-deb "cd ~/store.extantra && ./check-email-config.sh"
```

### View recent logs:
```bash
ssh MT21-deb "pm2 logs extantra-store --lines 50"
```

### Test email manually:
```bash
ssh MT21-deb "cd ~/store.extantra && node test-email.js"
```

---

## What You Should See (Success)

In PM2 logs after purchase:
```
✅ Order notification email sent for session cs_live_...
```

In your Gmail inbox:
```
Subject: 🔥 New Order: cs_live_xxxxx... - $45.00

🎉 NEW ORDER RECEIVED!

Order ID: cs_live_...
Payment Status: paid

━━━━━━━━━━━━━━━━━━━━━━━

👤 CUSTOMER INFORMATION:
Name: John Doe
Email: customer@example.com
...
```

---

## Still Not Working?

Check these:
1. ✅ `.env` has `GMAIL_USER=pqueue001@gmail.com`
2. ✅ `.env` has `GMAIL_APP_PASSWORD` set correctly
3. ✅ `.env` has `NOTIFICATION_EMAIL=pqueue001@gmail.com`
4. ✅ nodemailer is installed: `npm list nodemailer`
5. ✅ Server restarted: `pm2 restart extantra-store`
6. ✅ Webhook secret is correct for production
7. ✅ Using LIVE Stripe keys (not test keys)

---

## Files to Upload/Sync

Make sure these are on your server:
- ✅ `check-email-config.sh` (diagnostic script)
- ✅ `.env` (with email credentials)
- ✅ `server.js` (has email code)
- ✅ `package.json` (has nodemailer dependency)

---

Need more help? Check `docs/email-troubleshooting.md` for detailed guide! 🎯
