// Shipping Calculator Service
// Handles zone-based shipping, USPS API integration, and international shipping

const https = require('https');
const xml2js = require('xml2js');

class ShippingCalculator {
    constructor() {
        // USPS API Configuration
        this.uspsConfig = {
            baseUrl: 'https://secure.shippingapis.com/ShippingAPI.dll',
            username: process.env.USPS_CONSUMER_KEY,
            password: process.env.USPS_CONSUMER_SECRET,
            originZip: '10001' // Your shipping origin ZIP code
        };

        // International shipping countries with USPS support
        this.internationalCountries = {
            'CA': { name: 'Canada', region: 'north_america', baseRate: 15.99 },
            'MX': { name: 'Mexico', region: 'north_america', baseRate: 18.99 },
            'GB': { name: 'United Kingdom', region: 'europe', baseRate: 24.99 },
            'DE': { name: 'Germany', region: 'europe', baseRate: 24.99 },
            'FR': { name: 'France', region: 'europe', baseRate: 24.99 },
            'IT': { name: 'Italy', region: 'europe', baseRate: 24.99 },
            'ES': { name: 'Spain', region: 'europe', baseRate: 24.99 },
            'NL': { name: 'Netherlands', region: 'europe', baseRate: 24.99 },
            'BE': { name: 'Belgium', region: 'europe', baseRate: 24.99 },
            'CH': { name: 'Switzerland', region: 'europe', baseRate: 27.99 },
            'AT': { name: 'Austria', region: 'europe', baseRate: 24.99 },
            'DK': { name: 'Denmark', region: 'europe', baseRate: 24.99 },
            'SE': { name: 'Sweden', region: 'europe', baseRate: 24.99 },
            'NO': { name: 'Norway', region: 'europe', baseRate: 27.99 },
            'FI': { name: 'Finland', region: 'europe', baseRate: 24.99 },
            'IE': { name: 'Ireland', region: 'europe', baseRate: 24.99 },
            'PT': { name: 'Portugal', region: 'europe', baseRate: 24.99 },
            'GR': { name: 'Greece', region: 'europe', baseRate: 27.99 },
            'PL': { name: 'Poland', region: 'europe', baseRate: 24.99 },
            'CZ': { name: 'Czech Republic', region: 'europe', baseRate: 24.99 },
            'HU': { name: 'Hungary', region: 'europe', baseRate: 24.99 },
            'AU': { name: 'Australia', region: 'oceania', baseRate: 29.99 },
            'NZ': { name: 'New Zealand', region: 'oceania', baseRate: 29.99 },
            'JP': { name: 'Japan', region: 'asia', baseRate: 27.99 },
            'KR': { name: 'South Korea', region: 'asia', baseRate: 27.99 },
            'SG': { name: 'Singapore', region: 'asia', baseRate: 27.99 },
            'HK': { name: 'Hong Kong', region: 'asia', baseRate: 27.99 },
            'TW': { name: 'Taiwan', region: 'asia', baseRate: 27.99 },
            'IN': { name: 'India', region: 'asia', baseRate: 32.99 },
            'TH': { name: 'Thailand', region: 'asia', baseRate: 29.99 },
            'MY': { name: 'Malaysia', region: 'asia', baseRate: 29.99 },
            'PH': { name: 'Philippines', region: 'asia', baseRate: 29.99 },
            'ID': { name: 'Indonesia', region: 'asia', baseRate: 32.99 },
            'VN': { name: 'Vietnam', region: 'asia', baseRate: 29.99 },
            'IL': { name: 'Israel', region: 'middle_east', baseRate: 29.99 },
            'AE': { name: 'United Arab Emirates', region: 'middle_east', baseRate: 32.99 },
            'SA': { name: 'Saudi Arabia', region: 'middle_east', baseRate: 34.99 },
            'BR': { name: 'Brazil', region: 'south_america', baseRate: 34.99 },
            'AR': { name: 'Argentina', region: 'south_america', baseRate: 34.99 },
            'CL': { name: 'Chile', region: 'south_america', baseRate: 34.99 },
            'CO': { name: 'Colombia', region: 'south_america', baseRate: 32.99 },
            'PE': { name: 'Peru', region: 'south_america', baseRate: 32.99 },
            'ZA': { name: 'South Africa', region: 'africa', baseRate: 37.99 },
            'EG': { name: 'Egypt', region: 'africa', baseRate: 34.99 },
            'MA': { name: 'Morocco', region: 'africa', baseRate: 34.99 },
            'RU': { name: 'Russia', region: 'europe', baseRate: 39.99 },
            'TR': { name: 'Turkey', region: 'europe', baseRate: 29.99 },
            'CN': { name: 'China', region: 'asia', baseRate: 29.99 },
        };

        // Define shipping zones by state/zip code ranges (US domestic)
        this.shippingZones = {
        this.shippingZones = {
            'west_coast': {
                states: ['CA', 'OR', 'WA', 'NV', 'AZ'],
                zipRanges: [
                    { min: 80000, max: 99999 }, // Western states
                    { min: 85000, max: 86999 }, // Arizona
                    { min: 89000, max: 89999 }, // Nevada
                ],
                rates: {
                    standard: 8.99,
                    express: 15.99
                },
                transit: {
                    standard: { min: 4, max: 6 },
                    express: { min: 2, max: 3 }
                }
            },
            'east_coast': {
                states: ['NY', 'NJ', 'CT', 'MA', 'RI', 'VT', 'NH', 'ME', 'PA', 'DE', 'MD', 'VA', 'NC', 'SC', 'GA', 'FL'],
                zipRanges: [
                    { min: 10000, max: 19999 }, // NY area
                    { min: 20000, max: 29999 }, // Mid-Atlantic
                    { min: 30000, max: 39999 }, // Southeast
                ],
                rates: {
                    standard: 6.99,
                    express: 12.99
                },
                transit: {
                    standard: { min: 3, max: 5 },
                    express: { min: 1, max: 2 }
                }
            },
            'central': {
                states: ['IL', 'IN', 'OH', 'MI', 'WI', 'MN', 'IA', 'MO', 'ND', 'SD', 'NE', 'KS', 'OK', 'TX', 'AR', 'LA', 'MS', 'AL', 'TN', 'KY', 'WV'],
                zipRanges: [
                    { min: 40000, max: 49999 }, // Kentucky area
                    { min: 50000, max: 59999 }, // Iowa area  
                    { min: 60000, max: 69999 }, // Illinois area
                    { min: 70000, max: 79999 }, // Texas/Louisiana area
                ],
                rates: {
                    standard: 7.99,
                    express: 13.99
                },
                transit: {
                    standard: { min: 4, max: 6 },
                    express: { min: 2, max: 3 }
                }
            },
            'mountain': {
                states: ['CO', 'UT', 'WY', 'MT', 'ID', 'NM'],
                zipRanges: [
                    { min: 80000, max: 84999 }, // Colorado area
                ],
                rates: {
                    standard: 9.99,
                    express: 16.99
                },
                transit: {
                    standard: { min: 5, max: 7 },
                    express: { min: 3, max: 4 }
                }
            },
            'alaska_hawaii': {
                states: ['AK', 'HI'],
                zipRanges: [
                    { min: 96700, max: 96999 }, // Hawaii
                    { min: 99500, max: 99999 }, // Alaska
                ],
                rates: {
                    standard: 19.99,
                    express: 29.99
                },
                transit: {
                    standard: { min: 7, max: 14 },
                    express: { min: 3, max: 7 }
                }
            }
        };

        // Default rates for unmatched addresses
        this.defaultRates = {
            standard: 9.99,
            express: 16.99,
            transit: {
                standard: { min: 5, max: 7 },
                express: { min: 3, max: 4 }
            }
        };

        // Cache for API results
        this.rateCache = new Map();
    }

    // Calculate shipping based on zip code
    calculateShipping(zipCode, orderTotal = 0, items = []) {
        // Check for free shipping threshold
        if (orderTotal >= 75) {
            return {
                freeShipping: true,
                options: [
                    {
                        id: 'free_standard',
                        name: 'Free Standard Shipping',
                        cost: 0,
                        transit: '5-7 business days',
                        description: 'Free shipping on orders $75+'
                    },
                    {
                        id: 'express_upgrade',
                        name: 'Express Shipping Upgrade',
                        cost: 7.99,
                        transit: '2-3 business days',
                        description: 'Express delivery upgrade'
                    }
                ]
            };
        }

        const zone = this.getShippingZone(zipCode);
        const rates = zone ? this.shippingZones[zone].rates : this.defaultRates;
        const transit = zone ? this.shippingZones[zone].transit : this.defaultRates.transit;

        return {
            freeShipping: false,
            zone: zone || 'default',
            options: [
                {
                    id: 'standard',
                    name: 'Standard Shipping',
                    cost: rates.standard,
                    transit: `${transit.standard.min}-${transit.standard.max} business days`,
                    description: 'Standard delivery'
                },
                {
                    id: 'express',
                    name: 'Express Shipping',
                    cost: rates.express,
                    transit: `${transit.express.min}-${transit.express.max} business days`,
                    description: 'Faster delivery'
                }
            ]
        };
    }

    // Determine shipping zone from zip code
    getShippingZone(zipCode) {
        const zip = parseInt(zipCode);
        if (isNaN(zip)) return null;

        for (const [zoneName, zone] of Object.entries(this.shippingZones)) {
            // Check zip code ranges
            for (const range of zone.zipRanges) {
                if (zip >= range.min && zip <= range.max) {
                    return zoneName;
                }
            }
        }
        return null;
    }

    // Get zone by state code
    getZoneByState(state) {
        for (const [zoneName, zone] of Object.entries(this.shippingZones)) {
            if (zone.states.includes(state.toUpperCase())) {
                return zoneName;
            }
        }
        return null;
    }

    // Validate zip code format
    validateZipCode(zipCode) {
        // US zip code validation (5 digits or 5+4 format)
        const zipRegex = /^\d{5}(-\d{4})?$/;
        return zipRegex.test(zipCode);
    }

    // Calculate package weight (for potential carrier API use)
    calculateWeight(items) {
        // Assume each Zippo lighter weighs 3 oz
        const itemWeight = 3; // oz per item
        const packagingWeight = 2; // oz for packaging
        return (items.length * itemWeight + packagingWeight) / 16; // Convert to pounds
    }

    // USPS API Integration (requires API credentials)
    async getUSPSRates(zipCode, items, orderTotal) {
        // This is a placeholder for USPS API integration
        // You would need to sign up for USPS Web Tools API
        
        const cacheKey = `usps_${zipCode}_${items.length}_${orderTotal}`;
        if (this.rateCache.has(cacheKey)) {
            return this.rateCache.get(cacheKey);
        }

        try {
            // USPS API would go here
            // For now, return zone-based rates as fallback
            const fallbackRates = this.calculateShipping(zipCode, orderTotal, items);
            this.rateCache.set(cacheKey, fallbackRates);
            return fallbackRates;
        } catch (error) {
            console.error('USPS API error:', error);
            // Fallback to zone-based shipping
            return this.calculateShipping(zipCode, orderTotal, items);
        }
    }

    // Format shipping options for Stripe
    formatForStripe(shippingOptions) {
        return shippingOptions.options.map(option => ({
            shipping_rate_data: {
                type: 'fixed_amount',
                fixed_amount: {
                    amount: Math.round(option.cost * 100), // Convert to cents
                    currency: 'usd',
                },
                display_name: option.name,
                delivery_estimate: this.parseTransitTime(option.transit),
            }
        }));
    }

    // Parse transit time for Stripe format
    parseTransitTime(transitString) {
        const match = transitString.match(/(\d+)-(\d+) business days/);
        if (match) {
            return {
                minimum: {
                    unit: 'business_day',
                    value: parseInt(match[1])
                },
                maximum: {
                    unit: 'business_day',
                    value: parseInt(match[2])
                }
            };
        }
        
        // Default fallback
        return {
            minimum: { unit: 'business_day', value: 5 },
            maximum: { unit: 'business_day', value: 7 }
        };
    }
}

module.exports = ShippingCalculator;
