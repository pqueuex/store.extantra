# 📧 Email Not Sending - Complete Solution

## The Problem
No emails are being sent when customers purchase on production.

---

## The Solution (Choose One)

### 🚀 Option 1: Super Quick Fix (1 Command)
```bash
cd /Users/jj/Development/Active/store.extantra
./deploy-env.sh
```

This script will:
1. Copy your `.env` file to the server
2. Restart the server
3. Show you the logs

Then make a test purchase and check your email!

---

### 🔧 Option 2: Manual Fix (Step by Step)

```bash
# 1. Copy .env to server
scp .env MT21-deb:~/store.extantra/.env

# 2. SSH to server
ssh MT21-deb

# 3. Go to project directory
cd ~/store.extantra

# 4. Verify email config
./check-email-config.sh

# 5. Restart server
pm2 restart extantra-store

# 6. Watch logs
pm2 logs extantra-store -f

# 7. Make test purchase and watch for:
# ✅ Order notification email sent for session...
```

---

## Why It's Not Working

**Root cause:** The production server doesn't have email credentials in its `.env` file.

Your local `.env` has:
```env
GMAIL_USER=pqueue001@gmail.com
GMAIL_APP_PASSWORD=your_gmail_app_password_here
NOTIFICATION_EMAIL=pqueue001@gmail.com
```

But the server's `.env` probably doesn't have these lines.

---

## What Happens After Fix

### You (merchant) will receive emails like:
```
Subject: 🔥 New Order: cs_live_xxxxx... - $45.00

🎉 NEW ORDER RECEIVED!

Order ID: cs_live_a1b2c3d4e5...
Payment Status: paid

━━━━━━━━━━━━━━━━━━━━━━━

👤 CUSTOMER INFORMATION:
Name: John Doe
Email: customer@example.com

━━━━━━━━━━━━━━━━━━━━━━━

📦 ORDER DETAILS:

1. Silent Hill 2 Zippo Flip Lighter
   🔥 SIDE ENGRAVING: "In my restless dreams"
   🔥 BACK ENGRAVING: "Silent Hill"
   ⛽ BUTANE INSERT: Yes

━━━━━━━━━━━━━━━━━━━━━━━

💰 PAYMENT:
Subtotal: $35.00
Shipping: $5.00
Tax: $3.50
TOTAL: $43.50

━━━━━━━━━━━━━━━━━━━━━━━

🚚 SHIPPING ADDRESS:
John Doe
123 Main St
New York, NY 10001
United States
```

### Customers receive emails from Stripe automatically
(No setup needed from you - Stripe handles customer receipts)

---

## Verify It's Working

### After deploying, check:

1. **Server logs show success:**
   ```bash
   ssh MT21-deb 'pm2 logs extantra-store --lines 50 | grep email'
   ```
   Should show: `✅ Order notification email sent`

2. **Make test purchase:**
   - Go to https://store.extantra.net
   - Add item to cart
   - Checkout with card: `4242 4242 4242 4242`
   - Check email: pqueue001@gmail.com

3. **Check Stripe Dashboard:**
   - Go to https://dashboard.stripe.com/payments
   - Find your test payment
   - Verify webhook fired: https://dashboard.stripe.com/webhooks

---

## Troubleshooting

### Still not getting emails?

Run diagnostics:
```bash
ssh MT21-deb 'cd ~/store.extantra && ./check-email-config.sh'
```

Look for ❌ symbols and fix those issues.

### Common issues:

| Issue | Fix |
|-------|-----|
| ❌ GMAIL_USER not set | Add to .env and restart |
| ❌ GMAIL_APP_PASSWORD not set | Add to .env and restart |
| ❌ nodemailer not installed | `npm install nodemailer` |
| ❌ Webhook secret wrong | Get from Stripe Dashboard |
| ❌ PM2 not running | `pm2 start server.js --name extantra-store` |

---

## Production Webhook Setup

**IMPORTANT:** Make sure you have a production webhook configured!

1. Go to: https://dashboard.stripe.com/webhooks
2. Click "Add endpoint"
3. Endpoint URL: `https://store.extantra.net/webhook`
4. Events to send: Select `checkout.session.completed`
5. Add endpoint
6. Click "Reveal" on signing secret
7. Copy the `whsec_...` value
8. Add to server's `.env`:
   ```bash
   ssh MT21-deb
   nano ~/store.extantra/.env
   # Add: STRIPE_WEBHOOK_SECRET=whsec_YOUR_SECRET
   # Save and restart: pm2 restart extantra-store
   ```

---

## Scripts Available

| Script | Purpose |
|--------|---------|
| `deploy-env.sh` | Copy .env to server and restart (ONE CLICK FIX) |
| `check-email-config.sh` | Check if email is configured correctly |
| `pre-deploy-check.sh` | Verify everything before deploying |
| `test-email.js` | Test email sending manually |

---

## Documentation

- 📖 `docs/EMAIL-QUICK-FIX.md` - Quick reference guide
- 📖 `docs/email-troubleshooting.md` - Detailed troubleshooting
- 📖 `docs/email-setup-guide.md` - Original setup guide

---

## Next Steps

1. **Run the quick fix:**
   ```bash
   ./deploy-env.sh
   ```

2. **Make a test purchase**

3. **Check your email** (pqueue001@gmail.com)

4. **Celebrate!** 🎉

---

That's it! The issue is almost certainly just missing email credentials on the server. The quick fix script should solve it! 🚀
