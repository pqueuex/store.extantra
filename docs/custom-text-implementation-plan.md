# Custom Engraving Text Capture Implementation Plan

## Current State
- Users can add custom engraving text on the product page
- Text is stored in cart item's `customizations` object
- When user checks out via Stripe, only the product details go to Stripe
- **Problem:** Custom text is NOT being sent anywhere you can access it

## Solutions (Ranked by Complexity)

---

## Option 1: Email Notification on Order (Recommended for MVP)
**Complexity:** Low  
**Time to implement:** 30 minutes  
**Cost:** Free (using Nodemailer with Gmail)

### How it works:
1. User completes Stripe checkout
2. Stripe webhook fires to your server
3. Server retrieves cart from session/localStorage data sent with checkout
4. Server sends you an email with:
   - Order details
   - Customer info
   - **Custom engraving text** (if any)
5. You receive email, fulfill order with custom text

### Implementation:
```javascript
// In server.js, on successful payment webhook:
const nodemailer = require('nodemailer');

// Configure email transporter
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.GMAIL_USER,
    pass: process.env.GMAIL_APP_PASSWORD
  }
});

// Send order notification email
const emailContent = `
New Order Received!

Order ID: ${session.id}
Customer: ${session.customer_details.name}
Email: ${session.customer_details.email}

Items:
${cartItems.map(item => `
  - ${item.name} (${item.variantName})
    ${item.customizations?.sideEngraving ? 
      `SIDE ENGRAVING: "${item.customizations.sideEngraving.text}"` : ''}
    ${item.customizations?.backEngraving ? 
      `BACK ENGRAVING: "${item.customizations.backEngraving.text}"` : ''}
    ${item.customizations?.butaneInsert ? 'BUTANE INSERT: Yes' : ''}
`).join('\n')}

Total: $${(session.amount_total / 100).toFixed(2)}

Shipping Address:
${session.shipping.address.line1}
${session.shipping.address.city}, ${session.shipping.address.state} ${session.shipping.address.postal_code}
${session.shipping.address.country}
`;

await transporter.sendMail({
  from: process.env.GMAIL_USER,
  to: 'store@extantra.net',
  subject: `New Order: ${session.id}`,
  text: emailContent
});
```

**Pros:**
- Simple, fast to implement
- No external dependencies beyond Nodemailer
- Works with existing checkout flow
- You get instant notifications

**Cons:**
- Relies on email delivery (could go to spam)
- Manual process (you read email, then engrave)
- No centralized order dashboard

---

## Option 2: Store Orders in Database (Better Long-Term)
**Complexity:** Medium  
**Time to implement:** 2-3 hours  
**Cost:** Free (SQLite) or $5/month (MongoDB Atlas)

### How it works:
1. User completes checkout
2. Webhook saves full order to database (SQLite or MongoDB)
3. Database stores:
   - Order ID
   - Customer info
   - Cart items with custom text
   - Fulfillment status
4. You access orders via:
   - Admin dashboard (build simple page at `/admin/orders`)
   - OR export to CSV/Notion
   - OR API endpoint to fetch pending orders

### Implementation:
**Database schema:**
```javascript
{
  orderId: "cs_123abc",
  createdAt: "2025-10-06T10:30:00Z",
  customer: {
    name: "John Doe",
    email: "john@example.com",
    shipping: { ... }
  },
  items: [
    {
      productId: "001",
      name: "Silent Hill Zippo",
      variant: "Chrome",
      customizations: {
        sideEngraving: { text: "In my restless dreams..." },
        backEngraving: null,
        butaneInsert: false
      },
      price: 27.00
    }
  ],
  total: 27.00,
  fulfillmentStatus: "pending",
  stripeSessionId: "cs_123abc"
}
```

**Simple admin page:**
```html
<!-- /admin/orders.html -->
<div class="orders-list">
  <!-- Shows all pending orders -->
  <!-- You can mark as "fulfilled" after engraving -->
</div>
```

**Pros:**
- Centralized order management
- Can track fulfillment status
- Searchable/filterable orders
- Export to CSV for Notion import
- Audit trail (never lose an order)

**Cons:**
- More setup time
- Need to build admin interface
- Requires database management

---

## Option 3: Stripe Metadata (Hybrid Approach - BEST)
**Complexity:** Low-Medium  
**Time to implement:** 1 hour  
**Cost:** Free

### How it works:
1. When creating Stripe checkout session, include cart data in `metadata`
2. Stripe stores custom text with the payment
3. You view orders in Stripe Dashboard OR via webhook
4. Bonus: Use Stripe's built-in order management

### Implementation:
```javascript
// In checkout endpoint, when creating session:
const session = await stripe.checkout.sessions.create({
  // ...existing config
  metadata: {
    cartData: JSON.stringify(cart.map(item => ({
      productId: item.productId,
      variantId: item.variantId,
      name: item.name,
      sideEngraving: item.customizations?.sideEngraving?.text || '',
      backEngraving: item.customizations?.backEngraving?.text || '',
      butaneInsert: item.customizations?.butaneInsert || false
    })))
  }
});
```

Then view in:
- **Stripe Dashboard:** Each payment shows metadata with custom text
- **Webhook:** Parse metadata and email/save to database
- **API:** Fetch recent payments with metadata programmatically

**Pros:**
- Stripe stores the data (reliable, searchable)
- No additional database needed
- Can still email yourself from webhook
- Works with existing infrastructure

**Cons:**
- Metadata has 500-character limit per key (need to be concise)
- Requires Stripe Dashboard access for manual checks

---

## Option 4: Notion Database Integration (Automated Workflow)
**Complexity:** Medium  
**Time to implement:** 2 hours  
**Cost:** Free

### How it works:
1. Webhook receives order
2. Server calls Notion API to create database entry
3. Notion database becomes your order management system
4. Use Notion views to filter by "pending", "fulfilled", etc.

### Implementation:
```javascript
const { Client } = require('@notionhq/client');

const notion = new Client({ auth: process.env.NOTION_API_KEY });

// On webhook success:
await notion.pages.create({
  parent: { database_id: process.env.NOTION_ORDERS_DB_ID },
  properties: {
    "Order ID": { title: [{ text: { content: session.id } }] },
    "Customer": { rich_text: [{ text: { content: customerName } }] },
    "Side Engraving": { rich_text: [{ text: { content: sideText || 'None' } }] },
    "Back Engraving": { rich_text: [{ text: { content: backText || 'None' } }] },
    "Status": { select: { name: "Pending" } },
    "Total": { number: session.amount_total / 100 },
    "Date": { date: { start: new Date().toISOString() } }
  }
});
```

**Pros:**
- Beautiful interface (Notion)
- Mobile access (check orders on phone)
- Collaborative (can share with future team)
- Automated (no manual entry)

**Cons:**
- Requires Notion API setup
- Need to create database first
- API rate limits (10 requests/sec)

---

## My Recommendation: Hybrid Approach

**Phase 1 (This Week): Stripe Metadata + Email**
1. Add cart data to Stripe metadata (30 min)
2. Set up email notifications on webhook (30 min)
3. Test with real order

**Phase 2 (Next Week): Notion Integration**
1. Create Notion orders database
2. Connect webhook to Notion API
3. Build simple fulfillment workflow

**Phase 3 (Month 2): Admin Dashboard**
1. Build `/admin/orders` page
2. Add SQLite database for local backup
3. Export to CSV for analytics

---

## Immediate Next Steps (Stripe Metadata + Email)

### 1. Install dependencies:
```bash
npm install nodemailer
```

### 2. Update `.env`:
```env
GMAIL_USER=your-email@gmail.com
GMAIL_APP_PASSWORD=your-app-specific-password
```

### 3. Update `server.js`:
- Modify checkout session creation to include metadata
- Add email notification to webhook handler

### 4. Test:
- Place test order with custom engraving
- Verify email arrives with custom text
- Check Stripe Dashboard shows metadata

---

## Which option do you want to implement first?

**Quick win:** Option 1 (Email) + Option 3 (Stripe Metadata) together (1 hour total)
**Long-term:** Add Option 4 (Notion) after validating the workflow

Let me know and I'll implement it now!
