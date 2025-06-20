# Stripe Integration Setup Guide

## Overview
This setup allows your website to send dynamic cart data (including sale prices) to Stripe checkout, so customers pay exactly what they see on your website.

## Setup Steps

### 1. Install Dependencies
```bash
cd /Users/jj/extantra_net
npm install
```

### 2. Get Your Stripe Keys
1. Go to [Stripe Dashboard](https://dashboard.stripe.com/apikeys)
2. Copy your **Secret Key** (starts with `sk_test_` for test mode)
3. Copy your **Publishable Key** (starts with `pk_test_` for test mode)

### 3. Configure Server
1. Open `server.js`
2. Replace `'sk_test_your_secret_key_here'` with your actual Stripe secret key
3. Update allowed countries in `shipping_address_collection` if needed

### 4. Run Your Website
```bash
npm start
```
Your website will be available at: http://localhost:3000

### 5. Test the Integration
1. Add items to cart (notice sale prices are applied)
2. Click "Checkout" 
3. Should redirect to Stripe's checkout with correct prices
4. Use test card: `4242 4242 4242 4242` (any future date, any CVC)
5. After payment, redirects to success page

## How It Works

1. **Frontend**: Cart calculates prices including sales
2. **Backend**: Creates Stripe checkout session with exact cart prices
3. **Stripe**: Handles secure payment processing
4. **Success**: Customer redirected back to your site

## Benefits

✅ **Dynamic pricing** - Supports sale prices, discounts, any price changes  
✅ **Secure** - Stripe handles all payment data  
✅ **Professional** - Real checkout experience  
✅ **Mobile-friendly** - Stripe's checkout works on all devices  
✅ **Inventory sync** - Can integrate with your product database  

## File Structure
```
extantra_net/
├── server.js          # Backend server
├── package.json       # Dependencies
├── index.html         # Your website (updated)
├── success.html       # Post-payment success page
├── products.json      # Your product database
└── styles.css         # Your styling
```

## Production Deployment

For production:
1. Replace test keys with live Stripe keys
2. Deploy server to hosting platform (Heroku, Vercel, etc.)
3. Update success/cancel URLs to your domain
4. Enable webhooks for order fulfillment

## Alternative: Client-Only Solution

If you prefer no backend, you could:
1. Create multiple Payment Links for common price points
2. Use JavaScript to select the closest price match
3. Redirect to appropriate Payment Link

But this is less flexible and doesn't support exact pricing for sales.
