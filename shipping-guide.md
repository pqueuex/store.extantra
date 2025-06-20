# Address-Based Shipping Configuration Guide

## Overview
Your ecommerce site now includes comprehensive address-based shipping functionality with zip code calculator integrated with Stripe Checkout.

## Shipping System Features

### 🌍 Zone-Based Shipping Calculator
- **Smart zone detection** from ZIP codes
- **Regional pricing** based on shipping distance
- **Real-time calculation** in cart dropdown
- **Stripe integration** with dynamic rates

### 📦 Shipping Zones & Rates

#### West Coast (CA, OR, WA, NV, AZ)
- **Standard**: $8.99 (4-6 business days)
- **Express**: $15.99 (2-3 business days)
- **ZIP Ranges**: 80000-99999, 85000-86999, 89000-89999

#### East Coast (NY, NJ, CT, MA, RI, VT, NH, ME, PA, DE, MD, VA, NC, SC, GA, FL)
- **Standard**: $6.99 (3-5 business days)
- **Express**: $12.99 (1-2 business days)
- **ZIP Ranges**: 10000-19999, 20000-29999, 30000-39999

#### Central (IL, IN, OH, MI, WI, MN, IA, MO, ND, SD, NE, KS, OK, TX, AR, LA, MS, AL, TN, KY, WV)
- **Standard**: $7.99 (4-6 business days)
- **Express**: $13.99 (2-3 business days)
- **ZIP Ranges**: 40000-49999, 50000-59999, 60000-69999, 70000-79999

#### Mountain (CO, UT, WY, MT, ID, NM)
- **Standard**: $9.99 (5-7 business days)
- **Express**: $16.99 (3-4 business days)
- **ZIP Ranges**: 80000-84999

#### Alaska & Hawaii (AK, HI)
- **Standard**: $19.99 (7-14 business days)
- **Express**: $29.99 (3-7 business days)
- **ZIP Ranges**: 96700-96999, 99500-99999

### Free Shipping Override
**$75+ Orders**: Free standard shipping (overrides calculated rates)
- **Free Standard**: $0.00 (5-7 business days)
- **Express Upgrade**: $7.99 (2-3 business days)

## How It Works

### Customer Experience
1. **Add items to cart** - See current total
2. **Enter ZIP code** - Click "Calculate" button
3. **View shipping options** - See zone-based rates
4. **Proceed to checkout** - Stripe shows calculated rates

### Technical Flow
1. **Frontend**: Collects ZIP code from customer
2. **API Call**: `/calculate-shipping` endpoint
3. **Zone Detection**: Determines shipping zone from ZIP
4. **Rate Calculation**: Returns appropriate shipping options
5. **Stripe Integration**: Dynamic rates passed to checkout

## Configuration Files

### Core Components
- **`shipping-calculator.js`**: Zone definitions and rate calculations
- **`server.js`**: API endpoints and Stripe integration
- **`index.html`** & **`product.html`**: Frontend shipping calculator
- **`styles.css`**: Shipping UI styling

### Free Shipping Threshold
Currently set to **$75** in:
- `server.js`: Order total check
- Frontend: Display logic for free shipping messages

### Shipping Countries
Currently shipping to:
- **United States (US)** - Zone-based rates
- **Canada (CA)** - Default rates

## Testing the System

### Test ZIP Codes
- **90210** (West Coast) - Should show $8.99/$15.99
- **10001** (East Coast) - Should show $6.99/$12.99  
- **60601** (Central) - Should show $7.99/$13.99
- **80302** (Mountain) - Should show $9.99/$16.99
- **96815** (Hawaii) - Should show $19.99/$29.99

### Test Scenarios
1. **Empty Cart**: Shows "Free shipping on orders $75+"
2. **Under $75**: Shows calculated rates by zone
3. **$75+**: Shows free shipping message
4. **Invalid ZIP**: Shows validation error
5. **No ZIP**: Uses fallback rates at checkout

## How It Works

### Frontend Features
1. **Dynamic Shipping Messages**: Cart dropdown shows shipping progress
2. **Real-time Updates**: Shipping info updates as items are added/removed
3. **Visual Indicators**: Different colors for shipping status

### Backend Logic
1. **Order Calculation**: Server calculates total before creating Stripe session
2. **Conditional Shipping**: Different options based on order value
3. **Stripe Integration**: Shipping rates created dynamically

## Configuration

### Free Shipping Threshold
Currently set to **$75** in both:
- `server.js` (line ~77): `const qualifiesForFreeShipping = orderTotal >= 75;`
- `index.html` & `product.html`: `const freeShippingThreshold = 75;`

### Shipping Countries
Currently shipping to:
- United States (US)
- Canada (CA)

To add more countries, update `allowed_countries` in `server.js`.

### Shipping Rates
All rates are defined in `server.js` as `shipping_rate_data` objects:

```javascript
{
    type: 'fixed_amount',
    fixed_amount: {
        amount: 599, // $5.99 in cents
        currency: 'usd',
    },
    display_name: 'Standard Shipping',
    delivery_estimate: {
        minimum: { unit: 'business_day', value: 5 },
        maximum: { unit: 'business_day', value: 7 },
    },
}
```

## Customer Experience

### Cart Messages
- **Empty Cart**: "Free shipping on orders $75+"
- **Under $75**: "Add $X.XX more for free shipping"
- **$75+**: "🚚 Free shipping included!"

### Stripe Checkout
Customers will see:
1. Shipping address collection
2. Shipping method selection
3. Live shipping cost calculation
4. Final total with shipping

## Testing

### Test Scenarios
1. **Single Item ($30)**: Should show standard shipping options
2. **Two Items ($60)**: Should show "Add $15.00 more for free shipping"
3. **Three Items ($90)**: Should show free shipping + express upgrade

### Test Cards (Stripe Test Mode)
- **Success**: 4242 4242 4242 4242
- **Decline**: 4000 0000 0000 0002

## Customization

### Change Free Shipping Threshold
1. Update `server.js` line ~77
2. Update frontend `freeShippingThreshold` variables
3. Restart server

### Add New Shipping Methods
Add new objects to the `shipping_options` array in `server.js`:

```javascript
{
    shipping_rate_data: {
        type: 'fixed_amount',
        fixed_amount: { amount: 2499, currency: 'usd' },
        display_name: 'Overnight Shipping',
        delivery_estimate: {
            minimum: { unit: 'business_day', value: 1 },
            maximum: { unit: 'business_day', value: 1 },
        },
    },
}
```

## Security Notes
- All shipping rates are server-side controlled
- Customer cannot manipulate shipping costs
- Input validation on all order totals
- Rate limiting on checkout attempts

Your shipping system is now fully functional and production-ready!
