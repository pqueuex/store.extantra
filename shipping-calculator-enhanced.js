// Enhanced Shipping Calculator Service
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
            'CN': { name: 'China', region: 'asia', baseRate: 29.99 }
        };

        // Define shipping zones by state/zip code ranges (US domestic)
        this.shippingZones = {
            'west_coast': {
                states: ['CA', 'OR', 'WA', 'NV', 'AZ'],
                zipRanges: [
                    { min: 80000, max: 99999 },
                    { min: 85000, max: 86999 },
                    { min: 89000, max: 89999 },
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
                    { min: 10000, max: 19999 },
                    { min: 20000, max: 29999 },
                    { min: 30000, max: 39999 },
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
                    { min: 40000, max: 49999 },
                    { min: 50000, max: 59999 },
                    { min: 60000, max: 69999 },
                    { min: 70000, max: 79999 },
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
                    { min: 80000, max: 84999 },
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
                    { min: 96700, max: 96999 },
                    { min: 99500, max: 99999 },
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

    // Main shipping calculation method
    async calculateShipping(destination, orderTotal = 0, items = []) {
        // Check if destination is international
        if (this.isInternationalDestination(destination)) {
            return await this.calculateInternationalShipping(destination, orderTotal, items);
        }

        // US domestic shipping
        return this.calculateDomesticShipping(destination, orderTotal, items);
    }

    // Check if destination is international (country code vs ZIP code)
    isInternationalDestination(destination) {
        // If it's a 2-letter country code, it's international
        return destination.length === 2 && isNaN(parseInt(destination));
    }

    // Calculate international shipping rates
    async calculateInternationalShipping(countryCode, orderTotal, items) {
        const country = this.internationalCountries[countryCode.toUpperCase()];
        
        if (!country) {
            return {
                error: true,
                message: 'Shipping not available to this country'
            };
        }

        // Try USPS API first, fallback to base rates
        try {
            const uspsRates = await this.getUSPSInternationalRates(countryCode, items, orderTotal);
            if (uspsRates && !uspsRates.error) {
                return uspsRates;
            }
        } catch (error) {
            console.log('USPS API unavailable, using base rates');
        }

        // Fallback to base international rates
        const baseRate = country.baseRate;
        const expressRate = baseRate * 1.6; // Express is 60% more

        // Apply volume discount for larger orders
        let discountMultiplier = 1;
        if (orderTotal >= 150) discountMultiplier = 0.85; // 15% discount
        else if (orderTotal >= 100) discountMultiplier = 0.9; // 10% discount
        else if (orderTotal >= 75) discountMultiplier = 0.95; // 5% discount

        return {
            international: true,
            country: country.name,
            countryCode: countryCode.toUpperCase(),
            region: country.region,
            freeShipping: false, // No free international shipping
            options: [
                {
                    id: 'international_standard',
                    name: `Standard International to ${country.name}`,
                    cost: baseRate * discountMultiplier,
                    transit: '10-21 business days',
                    description: 'Standard international shipping via USPS'
                },
                {
                    id: 'international_express',
                    name: `Express International to ${country.name}`,
                    cost: expressRate * discountMultiplier,
                    transit: '6-10 business days',
                    description: 'Express international shipping via USPS'
                }
            ]
        };
    }

    // Calculate domestic US shipping (existing logic)
    calculateDomesticShipping(zipCode, orderTotal, items) {
        // Check for free shipping threshold
        if (orderTotal >= 75) {
            return {
                domestic: true,
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
            domestic: true,
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

    // USPS International API Integration
    async getUSPSInternationalRates(countryCode, items, orderTotal) {
        const cacheKey = `usps_intl_${countryCode}_${items.length}_${orderTotal}`;
        if (this.rateCache.has(cacheKey)) {
            return this.rateCache.get(cacheKey);
        }

        try {
            const weight = this.calculateWeight(items);
            const country = this.internationalCountries[countryCode.toUpperCase()];
            
            if (!country) {
                throw new Error('Country not supported');
            }

            // Build USPS International Rate Request XML
            const xmlRequest = `
                <IntlRateV2Request USERID="${this.uspsConfig.username}">
                    <Revision>2</Revision>
                    <Package ID="1">
                        <Pounds>${Math.floor(weight)}</Pounds>
                        <Ounces>${Math.round((weight % 1) * 16)}</Ounces>
                        <Machinable>true</Machinable>
                        <MailType>Package</MailType>
                        <GXG>
                            <POBoxFlag>N</POBoxFlag>
                            <GiftFlag>N</GiftFlag>
                        </GXG>
                        <ValueOfContents>${orderTotal}</ValueOfContents>
                        <Country>${country.name}</Country>
                        <Container>RECTANGULAR</Container>
                        <Size>REGULAR</Size>
                        <Width>6</Width>
                        <Length>8</Length>
                        <Height>2</Height>
                    </Package>
                </IntlRateV2Request>
            `;

            const response = await this.makeUSPSRequest('IntlRateV2', xmlRequest);
            const parsedRates = await this.parseUSPSInternationalResponse(response);
            
            this.rateCache.set(cacheKey, parsedRates);
            return parsedRates;

        } catch (error) {
            console.error('USPS International API error:', error);
            return null; // Fallback to base rates
        }
    }

    // Make USPS API Request
    async makeUSPSRequest(api, xmlRequest) {
        return new Promise((resolve, reject) => {
            const url = `${this.uspsConfig.baseUrl}?API=${api}&XML=${encodeURIComponent(xmlRequest)}`;
            
            https.get(url, (res) => {
                let data = '';
                res.on('data', (chunk) => data += chunk);
                res.on('end', () => resolve(data));
            }).on('error', reject);
        });
    }

    // Parse USPS International Response
    async parseUSPSInternationalResponse(xmlResponse) {
        const parser = new xml2js.Parser();
        const result = await parser.parseStringPromise(xmlResponse);
        
        if (result.Error) {
            throw new Error(result.Error.Description[0]);
        }

        const services = result.IntlRateV2Response?.Package?.[0]?.Service || [];
        const options = [];

        services.forEach(service => {
            const serviceName = service.SvcDescription[0];
            const rate = parseFloat(service.Postage[0]);
            const commitmentName = service.SvcCommitments[0];

            // Map USPS services to our options
            if (serviceName.includes('Priority Mail Express')) {
                options.push({
                    id: 'usps_express_intl',
                    name: `Express International (${serviceName})`,
                    cost: rate,
                    transit: commitmentName,
                    description: 'USPS Priority Mail Express International'
                });
            } else if (serviceName.includes('Priority Mail')) {
                options.push({
                    id: 'usps_priority_intl',
                    name: `Priority International (${serviceName})`,
                    cost: rate,
                    transit: commitmentName,
                    description: 'USPS Priority Mail International'
                });
            } else if (serviceName.includes('First-Class')) {
                options.push({
                    id: 'usps_first_class_intl',
                    name: `Standard International (${serviceName})`,
                    cost: rate,
                    transit: commitmentName,
                    description: 'USPS First-Class Mail International'
                });
            }
        });

        return {
            international: true,
            uspsRates: true,
            freeShipping: false,
            options: options.length > 0 ? options : null
        };
    }

    // Get all supported countries for frontend display
    getSupportedCountries() {
        const countries = Object.entries(this.internationalCountries).map(([code, data]) => ({
            code: code,
            name: data.name,
            region: data.region,
            baseRate: data.baseRate
        }));

        return {
            domestic: { code: 'US', name: 'United States' },
            international: countries.sort((a, b) => a.name.localeCompare(b.name))
        };
    }

    // Existing domestic methods (unchanged)
    getShippingZone(zipCode) {
        const zip = parseInt(zipCode);
        if (isNaN(zip)) return null;

        for (const [zoneName, zone] of Object.entries(this.shippingZones)) {
            for (const range of zone.zipRanges) {
                if (zip >= range.min && zip <= range.max) {
                    return zoneName;
                }
            }
        }
        return null;
    }

    getZoneByState(state) {
        for (const [zoneName, zone] of Object.entries(this.shippingZones)) {
            if (zone.states.includes(state.toUpperCase())) {
                return zoneName;
            }
        }
        return null;
    }

    validateZipCode(zipCode) {
        const zipRegex = /^\d{5}(-\d{4})?$/;
        return zipRegex.test(zipCode);
    }

    validateCountryCode(countryCode) {
        return countryCode.length === 2 && this.internationalCountries[countryCode.toUpperCase()];
    }

    calculateWeight(items) {
        const itemWeight = 3; // oz per Zippo lighter
        const packagingWeight = 2; // oz for packaging
        return (items.length * itemWeight + packagingWeight) / 16; // Convert to pounds
    }

    // Format shipping options for Stripe
    formatForStripe(shippingOptions) {
        return shippingOptions.options.map(option => ({
            shipping_rate_data: {
                type: 'fixed_amount',
                fixed_amount: {
                    amount: Math.round(option.cost * 100),
                    currency: 'usd',
                },
                display_name: option.name,
                delivery_estimate: this.parseTransitTime(option.transit),
            }
        }));
    }

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
        
        return {
            minimum: { unit: 'business_day', value: 5 },
            maximum: { unit: 'business_day', value: 7 }
        };
    }
}

module.exports = ShippingCalculator;
