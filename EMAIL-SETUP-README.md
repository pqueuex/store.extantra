# 🎉 Email Notifications Setup - COMPLETE!

## ✅ What's Done

Your store now captures custom engraving text and emails it to you!

**Email configured:** ✅ `pqueue001@gmail.com`  
**Test email sent:** ✅ Check your Gmail!

---

## 🚀 Quick Start

### Step 1: Authenticate Stripe (One-time setup)
```bash
stripe login
```
- Follow the browser prompt
- Code: **happy-won-geeky-liked** (or get new one)
- This connects your Stripe account

### Step 2: Start Everything
```bash
./start-dev.sh
```
This starts:
- ✅ Node.js server on `localhost:3000`
- ✅ Stripe webhook listener

**OR** run manually:
```bash
# Terminal 1: Start server
npm start

# Terminal 2: Start webhook listener
stripe listen --forward-to localhost:3000/webhook
```

### Step 3: Copy Webhook Secret
When you run `stripe listen`, it outputs:
```
Ready! Your webhook signing secret is whsec_xxxxx...
```

Copy that secret and add to `.env`:
```env
STRIPE_WEBHOOK_SECRET=whsec_xxxxx...
```

### Step 4: Test It!
1. Go to http://localhost:3000
2. Add a product with custom engraving
3. Checkout with test card: `4242 4242 4242 4242`
4. Check your email! 📧

---

## 📧 What You'll Receive

Every order sends you an email like this:

```
Subject: 🔥 New Order: cs_test_a1b2c... - $38.15

🎉 NEW ORDER RECEIVED!

Order ID: cs_test_a1b2c3d4e5f6
Payment Status: paid

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

👤 CUSTOMER INFORMATION:
Name: John Doe
Email: john@example.com

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

📦 ORDER DETAILS:

1. Silent Hill 2 Zippo Lighter (Chrome)
   🔥 SIDE ENGRAVING: "In my restless dreams, I see that town"
   ⛽ BUTANE INSERT: Yes

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

💰 PAYMENT:
Subtotal: $27.00
Shipping: $8.99
Tax: $2.16
TOTAL: $38.15

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

🚚 SHIPPING ADDRESS:
John Doe
123 Main Street
New York, NY 10001
US
```

---

## 🧪 Test Commands

**Test email only:**
```bash
node test-email.js
```

**Trigger test webhook:**
```bash
stripe trigger checkout.session.completed
```

**View webhook logs:**
- Stripe Dashboard → Webhooks → Logs

---

## 🔧 Troubleshooting

### Webhook not working?
1. Make sure `stripe listen` is running
2. Copy the webhook secret to `.env`
3. Restart server: `npm start`

### Email not arriving?
1. Check Gmail spam folder
2. Verify `.env` has correct credentials
3. Run: `node test-email.js`

### Port 3000 already in use?
```bash
lsof -ti :3000 | xargs kill -9
npm start
```

---

## 📁 Key Files

- **`.env`** - Email & Stripe configuration
- **`server.js`** - Webhook endpoint at `/webhook`
- **`test-email.js`** - Email testing script
- **`start-dev.sh`** - One-command startup

---

## 🎯 Next Steps

After testing locally:

### 1. Deploy to Production
- Add Gmail credentials to production `.env`
- Configure production webhook in Stripe Dashboard
- Use webhook URL: `https://extantra.net/webhook`

### 2. Optional Enhancements
- **Notion Integration** - See `docs/custom-text-implementation-plan.md`
- **Admin Dashboard** - Build at `/admin/orders`
- **SMS Notifications** - Add Twilio

---

## ✅ Checklist

Before going live:
- [x] Email configured (pqueue001@gmail.com)
- [x] Test email sent successfully
- [ ] Stripe CLI authenticated (`stripe login`)
- [ ] Webhook secret added to `.env`
- [ ] Test order placed with custom text
- [ ] Email received with engraving text
- [ ] Production webhook configured (when deploying)

---

## 🆘 Need Help?

See detailed guides:
- `docs/email-setup-guide.md` - Full email setup
- `docs/custom-text-implementation-plan.md` - Implementation options
- `docs/implementation-summary.md` - System overview

---

**You're almost there! Just authenticate Stripe and test an order! 🚀**
