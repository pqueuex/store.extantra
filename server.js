const express = require('express');
const cors = require('cors');
const path = require('path');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const ShippingCalculator = require('./shipping-calculator-enhanced');

// Load environment variables
require('dotenv').config();

// Use environment variable for Stripe secret key
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

// Initialize shipping calculator
const shippingCalculator = new ShippingCalculator();

const app = express();
const PORT = process.env.PORT || 3000;

// Security middleware with working CSP configuration
app.use(helmet({
    contentSecurityPolicy: {
        directives: {
            defaultSrc: ["'self'"],
            scriptSrc: ["'self'", "'unsafe-inline'", "'unsafe-eval'"], // Required for cart functionality
            scriptSrcAttr: ["'unsafe-inline'"], // Allow inline event handlers (onclick, etc.)
            styleSrc: ["'self'", "'unsafe-inline'"], // Required for inline styles
            imgSrc: ["'self'", "data:", "https:", "blob:"], // Allow images from various sources
            connectSrc: ["'self'", "https://api.stripe.com", "https://checkout.stripe.com"],
            frameSrc: ["https://checkout.stripe.com", "https://js.stripe.com"],
            objectSrc: ["'none'"], // Disable object/embed for security
            baseUri: ["'self'"],
            formAction: ["'self'"],
        },
    },
    crossOriginEmbedderPolicy: false, // Disable to avoid iframe issues
    hsts: false, // Disable HSTS for localhost development
}));

// Rate limiting
const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 1000, // limit each IP to 1000 requests per windowMs (increased for development)
    message: 'Too many requests from this IP, please try again later.'
});
app.use(limiter);

// Stripe-specific rate limiting
const checkoutLimiter = rateLimit({
    windowMs: 1 * 60 * 1000, // 1 minute
    max: 20, // limit each IP to 20 checkout attempts per minute (increased for development)
    message: 'Too many checkout attempts, please try again later.'
});

// Middleware
app.use(cors({
    origin: ['http://localhost:3000', 'http://127.0.0.1:5500', 'http://localhost:5500'], // Allow multiple origins
    credentials: true
}));
app.use(express.json({ limit: '10mb' })); // Limit JSON payload size
app.use(express.static('.')); // Serve static files from current directory

// Serve your website
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

// Calculate shipping rates
// Calculate shipping rates (domestic and international)
app.post('/calculate-shipping', async (req, res) => {
    try {
        const { destination, items = [], orderTotal = 0 } = req.body;
        
        // Support both zipCode and destination for backward compatibility
        const shippingDestination = destination || req.body.zipCode;
        
        if (!shippingDestination) {
            return res.status(400).json({ error: 'Destination (ZIP code or country code) is required' });
        }

        // Validate destination format
        const isInternational = shippingCalculator.isInternationalDestination(shippingDestination);
        
        if (!isInternational && !shippingCalculator.validateZipCode(shippingDestination)) {
            return res.status(400).json({ error: 'Invalid ZIP code format' });
        }

        if (isInternational && !shippingCalculator.validateCountryCode(shippingDestination)) {
            return res.status(400).json({ error: 'Country not supported for shipping' });
        }
        
        // Calculate shipping options (now handles both domestic and international)
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

// Create Stripe checkout session
app.post('/create-checkout-session', checkoutLimiter, async (req, res) => {
    try {
        const { items, destination } = req.body;
        
        // Support legacy zipCode parameter for backward compatibility
        const shippingDestination = destination || req.body.zipCode;
        
        // Input validation
        if (!items || !Array.isArray(items) || items.length === 0) {
            return res.status(400).json({ error: 'Invalid items array' });
        }
        
        // Validate each item
        const validatedItems = items.map(item => {
            if (!item.name || !item.price || typeof item.price !== 'number' || item.price <= 0) {
                throw new Error('Invalid item data');
            }
            
            // Sanitize and validate item properties
            return {
                name: String(item.name).substring(0, 100), // Limit name length
                description: String(item.description || '').substring(0, 200), // Limit description
                price: Math.max(0, Math.min(999999, Number(item.price))), // Price limits
                images: Array.isArray(item.images) ? item.images.slice(0, 1) : [] // Max 1 image
            };
        });
        
        // Convert cart items to Stripe line items
        const lineItems = validatedItems.map(item => ({
            price_data: {
                currency: 'usd',
                product_data: {
                    name: item.name,
                    ...(item.description && item.description.trim() ? { description: item.description } : {}),
                    images: item.images.length > 0 ? [item.images[0]] : [],
                },
                unit_amount: Math.round(item.price * 100), // Convert to cents
            },
            quantity: 1,
        }));

        // Calculate order total and shipping
        const orderTotal = validatedItems.reduce((sum, item) => sum + item.price, 0);
        
        let shippingOptions;
        if (shippingDestination) {
            try {
                // Use enhanced shipping calculator for both domestic and international
                const shippingData = await shippingCalculator.calculateShipping(shippingDestination, orderTotal, validatedItems);
                
                if (!shippingData.error) {
                    shippingOptions = shippingCalculator.formatForStripe(shippingData);
                } else {
                    // If shipping calculation fails, use fallback rates
                    throw new Error(shippingData.message || 'Shipping calculation failed');
                }
            } catch (error) {
                console.error('Shipping calculation error:', error);
                // Fallback to default US domestic rates
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

        // Create Stripe checkout session
        const baseUrl = req.headers.origin || 'http://localhost:3000';
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
        });

        res.json({ url: session.url });
    } catch (error) {
        console.error('Error creating checkout session:', error);
        
        // Don't expose detailed error information to client
        if (error.message === 'Invalid item data') {
            res.status(400).json({ error: 'Invalid product information' });
        } else {
            res.status(500).json({ error: 'Unable to process checkout. Please try again.' });
        }
    }
});

app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});
