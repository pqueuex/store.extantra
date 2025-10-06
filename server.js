const express = require('express');
const cors = require('cors');
const path = require('path');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const ShippingCalculator = require('./shipping-calculator');
const nodemailer = require('nodemailer');

require('dotenv').config();
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const shippingCalculator = new ShippingCalculator();

// Email transporter setup
const emailTransporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.GMAIL_USER,
        pass: process.env.GMAIL_APP_PASSWORD
    }
});

const app = express();
const PORT = process.env.PORT || 3000;

// security middleware
app.use(helmet({
    contentSecurityPolicy: {
        directives: {
            defaultSrc: ["'self'"],
            scriptSrc: [
                "'self'", 
                "'unsafe-inline'", 
                "'unsafe-eval'",
                "https://widget.trustpilot.com",
                "https://invitejs.trustpilot.com"
            ],
            scriptSrcAttr: ["'unsafe-inline'"],
            styleSrc: [
                "'self'", 
                "'unsafe-inline'", 
                "https://widget.trustpilot.com"
            ],
            imgSrc: [
                "'self'", 
                "data:", 
                "https:", 
                "blob:",
                "https://logo.trustpilot.com"
            ],
            connectSrc: [
                "'self'", 
                "https://api.stripe.com", 
                "https://checkout.stripe.com",
                "https://api.trustpilot.com"
            ],
            frameSrc: [
                "https://checkout.stripe.com", 
                "https://js.stripe.com",
                "https://widget.trustpilot.com"
            ],
            objectSrc: ["'none'"],
            baseUri: ["'self'"],
            formAction: ["'self'"],
        },
    },
    crossOriginEmbedderPolicy: false,
    hsts: false,
}));

// rate limiting
const limiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 1000,
    message: 'Too many requests from this IP, please try again later.'
});
app.use(limiter);

// stripe rate limiting
const checkoutLimiter = rateLimit({
    windowMs: 1 * 60 * 1000,
    max: 20,
    message: 'Too many checkout attempts, please try again later.'
});

// middleware
app.use(cors({
    origin: ['http://localhost:3000', 'http://127.0.0.1:5500', 'http://localhost:5500'],
    credentials: true
}));

// Webhook endpoint MUST come before express.json() to get raw body
app.post('/webhook', express.raw({type: 'application/json'}), async (req, res) => {
    const sig = req.headers['stripe-signature'];
    const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

    let event;

    try {
        if (webhookSecret) {
            event = stripe.webhooks.constructEvent(req.body, sig, webhookSecret);
        } else {
            event = JSON.parse(req.body);
        }
    } catch (err) {
        console.log(`⚠️  Webhook signature verification failed.`, err.message);
        return res.status(400).send(`Webhook Error: ${err.message}`);
    }

    // Handle the checkout.session.completed event
    if (event.type === 'checkout.session.completed') {
        const session = event.data.object;

        try {
            // Parse cart metadata
            const cartData = session.metadata?.cartData ? JSON.parse(session.metadata.cartData) : [];
            
            // Build email content
            let itemsText = '';
            cartData.forEach((item, index) => {
                itemsText += `\n${index + 1}. ${item.name}`;
                if (item.variantId) itemsText += ` (Variant: ${item.variantId})`;
                
                if (item.sideEngraving) {
                    itemsText += `\n   🔥 SIDE ENGRAVING: "${item.sideEngraving}"`;
                }
                if (item.backEngraving) {
                    itemsText += `\n   🔥 BACK ENGRAVING: "${item.backEngraving}"`;
                }
                if (item.butaneInsert === 'Yes') {
                    itemsText += `\n   ⛽ BUTANE INSERT: Yes`;
                }
                itemsText += '\n';
            });

            const emailContent = `
🎉 NEW ORDER RECEIVED!

Order ID: ${session.id}
Payment Status: ${session.payment_status}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

👤 CUSTOMER INFORMATION:
Name: ${session.customer_details?.name || 'N/A'}
Email: ${session.customer_details?.email || 'N/A'}
Phone: ${session.customer_details?.phone || 'N/A'}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

📦 ORDER DETAILS:
${itemsText}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

💰 PAYMENT:
Subtotal: $${((session.amount_subtotal || 0) / 100).toFixed(2)}
Shipping: $${((session.total_details?.amount_shipping || 0) / 100).toFixed(2)}
Tax: $${((session.total_details?.amount_tax || 0) / 100).toFixed(2)}
TOTAL: $${((session.amount_total || 0) / 100).toFixed(2)}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

🚚 SHIPPING ADDRESS:
${session.shipping?.name || session.customer_details?.name || 'N/A'}
${session.shipping?.address?.line1 || 'N/A'}
${session.shipping?.address?.line2 ? session.shipping.address.line2 + '\n' : ''}${session.shipping?.address?.city || ''}, ${session.shipping?.address?.state || ''} ${session.shipping?.address?.postal_code || ''}
${session.shipping?.address?.country || 'N/A'}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

View full details in Stripe Dashboard:
https://dashboard.stripe.com/payments/${session.payment_intent}
            `.trim();

            // Send email notification
            if (process.env.GMAIL_USER && process.env.GMAIL_APP_PASSWORD) {
                await emailTransporter.sendMail({
                    from: process.env.GMAIL_USER,
                    to: process.env.NOTIFICATION_EMAIL || 'pqueue001@gmail.com',
                    subject: `🔥 New Order: ${session.id.substring(0, 15)}... - $${((session.amount_total || 0) / 100).toFixed(2)}`,
                    text: emailContent
                });
                console.log(`✅ Order notification email sent for session ${session.id}`);
            } else {
                console.log('⚠️  Email not configured - order details:', emailContent);
            }

        } catch (error) {
            console.error('Error processing webhook:', error);
        }
    }

    res.json({received: true});
});

// Apply JSON parser to all other routes
app.use(express.json({ limit: '10mb' }));
app.use(express.static('.'));

// serve website
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

// calculate shipping
app.post('/calculate-shipping', async (req, res) => {
    try {
        const { destination, items = [], orderTotal = 0 } = req.body;
        const shippingDestination = destination || req.body.zipCode;
        
        if (!shippingDestination) {
            return res.status(400).json({ error: 'Destination required' });
        }

        const isInternational = shippingCalculator.isInternationalDestination(shippingDestination);
        
        if (!isInternational && !shippingCalculator.validateZipCode(shippingDestination)) {
            return res.status(400).json({ error: 'Invalid ZIP code' });
        }

        if (isInternational && !shippingCalculator.validateCountryCode(shippingDestination)) {
            return res.status(400).json({ error: 'Country not supported' });
        }
        
        const shippingOptions = await shippingCalculator.calculateShipping(shippingDestination, orderTotal, items);
        
        if (shippingOptions.error) {
            return res.status(400).json(shippingOptions);
        }
        
        res.json(shippingOptions);
    } catch (error) {
        console.error('Shipping calculation error:', error);
        res.status(500).json({ error: 'Unable to calculate shipping rates' });
    }
});

// Get supported countries endpoint
app.get('/shipping-countries', (req, res) => {
    try {
        const countries = shippingCalculator.getSupportedCountries();
        res.json(countries);
    } catch (error) {
        console.error('Error fetching shipping countries:', error);
        res.status(500).json({ error: 'Unable to fetch shipping countries' });
    }
});

// create stripe checkout session
app.post('/create-checkout-session', checkoutLimiter, async (req, res) => {
    try {
        const { items, destination } = req.body;
        const shippingDestination = destination || req.body.zipCode;
        
        if (!items || !Array.isArray(items) || items.length === 0) {
            return res.status(400).json({ error: 'Invalid items array' });
        }
        
        const validatedItems = items.map(item => {
            if (!item.name || !item.price || typeof item.price !== 'number' || item.price <= 0) {
                throw new Error('Invalid item data');
            }
            
            return {
                name: String(item.name).substring(0, 100),
                description: String(item.description || '').substring(0, 200),
                price: Math.max(0, Math.min(999999, Number(item.price))),
                images: Array.isArray(item.images) ? item.images.slice(0, 1) : []
            };
        });
        
        // convert to stripe line items
        const lineItems = validatedItems.map(item => ({
            price_data: {
                currency: 'usd',
                product_data: {
                    name: item.name,
                    ...(item.description && item.description.trim() ? { description: item.description } : {}),
                    images: item.images.length > 0 ? [item.images[0]] : [],
                },
                unit_amount: Math.round(item.price * 100),
            },
            quantity: 1,
        }));

        const orderTotal = validatedItems.reduce((sum, item) => sum + item.price, 0);
        
        let shippingOptions;
        if (shippingDestination) {
            try {
                // Use enhanced shipping calculator for both domestic and international
                const shippingData = await shippingCalculator.calculateShipping(shippingDestination, orderTotal, validatedItems);
                
                if (!shippingData.error) {
                    shippingOptions = shippingCalculator.formatForStripe(shippingData);
                } else {
                    throw new Error(shippingData.message || 'Shipping calculation failed');
                }
            } catch (error) {
                console.error('Shipping calculation error:', error);
                // fallback to default rates
                const qualifiesForFreeShipping = orderTotal >= 75;
                shippingOptions = qualifiesForFreeShipping ? [
                    {
                        shipping_rate_data: {
                            type: 'fixed_amount',
                            fixed_amount: { amount: 0, currency: 'usd' },
                            display_name: 'Free Standard Shipping (Order $75+)',
                            delivery_estimate: {
                                minimum: { unit: 'business_day', value: 5 },
                                maximum: { unit: 'business_day', value: 7 },
                            },
                        },
                    },
                    {
                        shipping_rate_data: {
                            type: 'fixed_amount',
                            fixed_amount: { amount: 799, currency: 'usd' },
                            display_name: 'Express Shipping Upgrade',
                            delivery_estimate: {
                                minimum: { unit: 'business_day', value: 2 },
                                maximum: { unit: 'business_day', value: 3 },
                            },
                        },
                    },
                ] : [
                    {
                        shipping_rate_data: {
                            type: 'fixed_amount',
                            fixed_amount: { amount: 899, currency: 'usd' },
                            display_name: 'Standard Shipping',
                            delivery_estimate: {
                                minimum: { unit: 'business_day', value: 5 },
                                maximum: { unit: 'business_day', value: 7 },
                            },
                        },
                    },
                    {
                        shipping_rate_data: {
                            type: 'fixed_amount',
                            fixed_amount: { amount: 1499, currency: 'usd' },
                            display_name: 'Express Shipping',
                            delivery_estimate: {
                                minimum: { unit: 'business_day', value: 2 },
                                maximum: { unit: 'business_day', value: 3 },
                            },
                        },
                    },
                ];
            }
        } else {
            // No destination provided - use default US rates
            const qualifiesForFreeShipping = orderTotal >= 75;
            shippingOptions = qualifiesForFreeShipping ? [
                {
                    shipping_rate_data: {
                        type: 'fixed_amount',
                        fixed_amount: { amount: 0, currency: 'usd' },
                        display_name: 'Free Standard Shipping (Order $75+)',
                        delivery_estimate: {
                            minimum: { unit: 'business_day', value: 5 },
                            maximum: { unit: 'business_day', value: 7 },
                        },
                    },
                },
                {
                    shipping_rate_data: {
                        type: 'fixed_amount',
                        fixed_amount: { amount: 799, currency: 'usd' },
                        display_name: 'Express Shipping Upgrade',
                        delivery_estimate: {
                            minimum: { unit: 'business_day', value: 2 },
                            maximum: { unit: 'business_day', value: 3 },
                        },
                    },
                },
            ] : [
                {
                    shipping_rate_data: {
                        type: 'fixed_amount',
                        fixed_amount: { amount: 899, currency: 'usd' },
                        display_name: 'Standard Shipping',
                        delivery_estimate: {
                            minimum: { unit: 'business_day', value: 5 },
                            maximum: { unit: 'business_day', value: 7 },
                        },
                    },
                },
                {
                    shipping_rate_data: {
                        type: 'fixed_amount',
                        fixed_amount: { amount: 1499, currency: 'usd' },
                        display_name: 'Express Shipping',
                        delivery_estimate: {
                            minimum: { unit: 'business_day', value: 2 },
                            maximum: { unit: 'business_day', value: 3 },
                        },
                    },
                },
            ];
        }

        // create stripe checkout session
        const baseUrl = req.headers.origin || 'http://localhost:3000';
        
        // Prepare metadata with cart customizations
        const cartMetadata = validatedItems.map((item, index) => {
            const customizations = items[index].customizations || {};
            return {
                productId: items[index].productId || '',
                variantId: items[index].variantId || '',
                name: item.name,
                sideEngraving: customizations.sideEngraving?.text || '',
                backEngraving: customizations.backEngraving?.text || '',
                butaneInsert: customizations.butaneInsert ? 'Yes' : 'No'
            };
        });
        
        const session = await stripe.checkout.sessions.create({
            payment_method_types: ['card'],
            line_items: lineItems,
            mode: 'payment',
            success_url: `${baseUrl}/success.html?session_id={CHECKOUT_SESSION_ID}`,
            cancel_url: `${baseUrl}/`,
            automatic_tax: { enabled: true },
            billing_address_collection: 'required',
            shipping_address_collection: {
                allowed_countries: [
                    'US', 'CA', 'MX', 'GB', 'DE', 'FR', 'IT', 'ES', 'NL', 'BE', 'CH', 'AT', 
                    'DK', 'SE', 'NO', 'FI', 'IE', 'PT', 'GR', 'PL', 'CZ', 'HU', 'AU', 'NZ', 
                    'JP', 'KR', 'SG', 'HK', 'TW', 'IN', 'TH', 'MY', 'PH', 'ID', 'VN', 'IL', 
                    'AE', 'SA', 'BR', 'AR', 'CL', 'CO', 'PE', 'ZA', 'EG', 'MA', 'RU', 'TR', 'CN'
                ],
            },
            shipping_options: shippingOptions,
            metadata: {
                cartData: JSON.stringify(cartMetadata)
            }
        });

        res.json({ url: session.url });
    } catch (error) {
        console.error('Error creating checkout session:', error);
        console.error('Error details:', {
            message: error.message,
            stack: error.stack,
            code: error.code,
            type: error.type,
            request_log_url: error.request_log_url
        });
        
        if (error.message === 'Invalid item data') {
            res.status(400).json({ error: 'Invalid product information' });
        } else if (error.type === 'StripeCardError') {
            res.status(400).json({ error: 'Payment error: ' + error.message });
        } else if (error.type === 'StripeInvalidRequestError') {
            res.status(400).json({ error: 'Invalid request: ' + error.message });
        } else {
            res.status(500).json({ error: 'Unable to process checkout. Please try again.' });
        }
    }
});

// Products API endpoint
app.get('/api/products', (req, res) => {
    try {
        const fs = require('fs');
        const productsData = JSON.parse(fs.readFileSync('./products.json', 'utf8'));

        const normalizedProducts = (productsData.products || []).map(product => {
            const variants = Array.isArray(product.variants) ? product.variants : [];
            const availableVariants = variants.filter(variant => variant && typeof variant === 'object');
            const defaultVariant = availableVariants.find(variant => variant.inStock) || availableVariants[0] || null;
            const variantPrices = availableVariants
                .map(variant => Number(variant.price))
                .filter(price => !Number.isNaN(price));
            const minPrice = variantPrices.length > 0 ? Math.min(...variantPrices) : Number(product.currentPrice || product.originalPrice || product.price || 0);
            const maxPrice = variantPrices.length > 0 ? Math.max(...variantPrices) : minPrice;
            const consolidatedImages = Array.isArray(product.images) && product.images.length > 0
                ? product.images
                : (defaultVariant && Array.isArray(defaultVariant.images) ? defaultVariant.images : []);
            const colors = availableVariants
                .map(variant => variant.color)
                .filter(Boolean);
            const uniqueColors = [...new Set(colors)];

            return {
                ...product,
                images: consolidatedImages,
                colors: uniqueColors,
                color: defaultVariant?.color || product.color || uniqueColors[0] || null,
                defaultVariantId: defaultVariant?.id || null,
                basePrice: typeof product.basePrice === 'number' ? product.basePrice : minPrice,
                highestVariantPrice: typeof product.highestVariantPrice === 'number' ? product.highestVariantPrice : maxPrice,
                originalPrice: typeof product.originalPrice === 'number' ? product.originalPrice : minPrice,
                currentPrice: typeof product.currentPrice === 'number' ? product.currentPrice : minPrice,
                onSale: Boolean(product.onSale),
                salePercentage: Number(product.salePercentage || 0)
            };
        });

        res.json({
            ...productsData,
            products: normalizedProducts
        });
    } catch (error) {
        console.error('Error loading products:', error);
        res.status(500).json({ error: 'Unable to load products' });
    }
});

// Review endpoints
app.get('/api/reviews', (req, res) => {
    try {
        const fs = require('fs');
        const reviewsData = JSON.parse(fs.readFileSync('./reviews.json', 'utf8'));
        res.json(reviewsData);
    } catch (error) {
        console.error('Error loading reviews:', error);
        res.status(500).json({ error: 'Unable to load reviews' });
    }
});

app.get('/api/reviews/product/:productId', (req, res) => {
    try {
        const fs = require('fs');
        const reviewsData = JSON.parse(fs.readFileSync('./reviews.json', 'utf8'));
        const productId = parseInt(req.params.productId);
        
        const productReviews = reviewsData.reviews.filter(review => review.productId === productId);
        const productSummary = {
            totalReviews: productReviews.length,
            averageRating: productReviews.length > 0 ? 
                productReviews.reduce((sum, review) => sum + review.rating, 0) / productReviews.length : 0,
            reviews: productReviews
        };
        
        res.json(productSummary);
    } catch (error) {
        console.error('Error loading product reviews:', error);
        res.status(500).json({ error: 'Unable to load product reviews' });
    }
});

// Submit new review
const reviewLimiter = rateLimit({
    windowMs: 60 * 60 * 1000, // 1 hour
    max: 3, // 3 reviews per hour per IP
    message: 'Too many review submissions, please try again later.'
});

app.post('/api/reviews', reviewLimiter, (req, res) => {
    try {
        const fs = require('fs');
        const { productId, customerName, email, rating, title, review } = req.body;
        
        // Validate input
        if (!productId || !customerName || !email || !rating || !title || !review) {
            return res.status(400).json({ error: 'All fields are required' });
        }
        
        if (rating < 1 || rating > 5) {
            return res.status(400).json({ error: 'Rating must be between 1 and 5' });
        }
        
        // Basic email validation
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            return res.status(400).json({ error: 'Invalid email address' });
        }
        
        const reviewsData = JSON.parse(fs.readFileSync('./reviews.json', 'utf8'));
        
        const newReview = {
            id: Math.max(...reviewsData.reviews.map(r => r.id), 0) + 1,
            productId: parseInt(productId),
            customerName: customerName.trim(),
            rating: parseInt(rating),
            title: title.trim(),
            review: review.trim(),
            date: new Date().toISOString().split('T')[0],
            verified: false, // Manual verification needed
            source: 'website',
            images: []
        };
        
        reviewsData.reviews.push(newReview);
        
        // Update summary
        reviewsData.summary.totalReviews = reviewsData.reviews.length;
        const totalRating = reviewsData.reviews.reduce((sum, r) => sum + r.rating, 0);
        reviewsData.summary.averageRating = totalRating / reviewsData.reviews.length;
        
        // Update rating distribution
        reviewsData.summary.ratingDistribution = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
        reviewsData.reviews.forEach(r => {
            reviewsData.summary.ratingDistribution[r.rating]++;
        });
        
        fs.writeFileSync('./reviews.json', JSON.stringify(reviewsData, null, 2));
        
        res.json({ 
            success: true, 
            message: 'Review submitted successfully and is pending approval',
            reviewId: newReview.id 
        });
    } catch (error) {
        console.error('Error submitting review:', error);
        res.status(500).json({ error: 'Unable to submit review' });
    }
});

app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});
