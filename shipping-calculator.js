// shipping calculator with usps api and zone fallback
const https = require('https');
const xml2js = require('xml2js');

class ShippingCalculator {
    constructor() {
        this.uspsConfig = {
            baseUrl: 'https://secure.shippingapis.com/ShippingAPI.dll',
            username: process.env.USPS_CONSUMER_KEY,
            originZip: '33101' // miami, fl
        };

        // zone-based fallback rates
        this.zones = {
            1: { name: 'zone 1 (local)', states: ['FL'], rate: 4.99 },
            2: { name: 'zone 2 (southeast)', states: ['GA', 'AL', 'SC', 'NC', 'TN', 'MS', 'LA'], rate: 6.99 },
            3: { name: 'zone 3 (east)', states: ['VA', 'WV', 'KY', 'MD', 'DE', 'NJ', 'PA', 'NY', 'CT', 'RI', 'MA', 'VT', 'NH', 'ME'], rate: 8.99 },
            4: { name: 'zone 4 (midwest)', states: ['OH', 'IN', 'IL', 'MI', 'WI', 'MN', 'IA', 'MO', 'AR', 'OK', 'KS', 'NE', 'SD', 'ND'], rate: 9.99 },
            5: { name: 'zone 5 (west)', states: ['TX', 'NM', 'CO', 'WY', 'MT', 'UT', 'ID', 'NV', 'AZ', 'CA', 'OR', 'WA'], rate: 11.99 },
            6: { name: 'zone 6 (alaska/hawaii)', states: ['AK', 'HI'], rate: 19.99 }
        };

        // international countries
        this.countries = {
            'CA': { name: 'Canada', rate: 15.99 },
            'MX': { name: 'Mexico', rate: 18.99 },
            'GB': { name: 'United Kingdom', rate: 24.99 },
            'DE': { name: 'Germany', rate: 24.99 },
            'FR': { name: 'France', rate: 24.99 },
            'IT': { name: 'Italy', rate: 24.99 },
            'ES': { name: 'Spain', rate: 24.99 },
            'AU': { name: 'Australia', rate: 29.99 },
            'JP': { name: 'Japan', rate: 27.99 }
        };

        // zip to state mapping (first 3 digits)
        this.zipToState = {
            '100': 'NY', '101': 'NY', '102': 'NY', '103': 'NY', '104': 'NY', '105': 'NY', '106': 'NY', '107': 'NY', '108': 'NY', '109': 'NY',
            '110': 'NY', '111': 'NY', '112': 'NY', '113': 'NY', '114': 'NY', '115': 'NY', '116': 'NY', '117': 'NY', '118': 'NY', '119': 'NY',
            '200': 'DC', '201': 'VA', '202': 'DC', '203': 'DC', '204': 'DC', '205': 'DC',
            '206': 'MD', '207': 'MD', '208': 'MD', '209': 'MD',
            '210': 'MD', '211': 'MD', '212': 'MD',
            '220': 'VA', '221': 'VA', '222': 'VA', '223': 'VA', '224': 'VA', '225': 'VA', '226': 'VA', '227': 'VA', '228': 'VA', '229': 'VA',
            '230': 'VA', '231': 'VA', '232': 'VA', '233': 'VA', '234': 'VA', '235': 'VA', '236': 'VA', '237': 'VA', '238': 'VA', '239': 'VA',
            '240': 'WV', '241': 'WV', '242': 'WV', '243': 'WV', '244': 'WV', '245': 'WV', '246': 'WV', '247': 'WV', '248': 'WV', '249': 'WV',
            '250': 'WV', '251': 'WV', '252': 'WV', '253': 'WV', '254': 'WV', '255': 'WV', '256': 'WV', '257': 'WV', '258': 'WV', '259': 'WV',
            '260': 'WV', '261': 'WV', '262': 'WV', '263': 'WV', '264': 'WV', '265': 'WV', '266': 'WV', '267': 'WV', '268': 'WV', '269': 'WV',
            '270': 'KY', '271': 'KY', '272': 'KY', '273': 'KY', '274': 'KY', '275': 'KY', '276': 'KY', '277': 'KY', '278': 'KY', '279': 'KY',
            '280': 'NC', '281': 'NC', '282': 'NC', '283': 'NC', '284': 'NC', '285': 'NC', '286': 'NC', '287': 'NC', '288': 'NC', '289': 'NC',
            '290': 'SC', '291': 'SC', '292': 'SC', '293': 'SC', '294': 'SC', '295': 'SC', '296': 'SC', '297': 'SC', '298': 'SC', '299': 'SC',
            '300': 'GA', '301': 'GA', '302': 'GA', '303': 'GA', '304': 'GA', '305': 'GA', '306': 'GA', '307': 'GA', '308': 'GA', '309': 'GA',
            '310': 'GA', '311': 'GA', '312': 'GA', '313': 'GA', '314': 'GA', '315': 'GA', '316': 'GA', '317': 'GA', '318': 'GA', '319': 'GA',
            '320': 'FL', '321': 'FL', '322': 'FL', '323': 'FL', '324': 'FL', '325': 'FL', '326': 'FL', '327': 'FL', '328': 'FL', '329': 'FL',
            '330': 'FL', '331': 'FL', '332': 'FL', '333': 'FL', '334': 'FL', '335': 'FL', '336': 'FL', '337': 'FL', '338': 'FL', '339': 'FL',
            '340': 'FL', '341': 'FL', '342': 'FL', '343': 'FL', '344': 'FL', '345': 'FL', '346': 'FL', '347': 'FL', '348': 'FL', '349': 'FL',
            '350': 'AL', '351': 'AL', '352': 'AL', '353': 'AL', '354': 'AL', '355': 'AL', '356': 'AL', '357': 'AL', '358': 'AL', '359': 'AL',
            '360': 'AL', '361': 'AL', '362': 'AL', '363': 'AL', '364': 'AL', '365': 'AL', '366': 'AL', '367': 'AL', '368': 'AL', '369': 'AL',
            '370': 'TN', '371': 'TN', '372': 'TN', '373': 'TN', '374': 'TN', '375': 'TN', '376': 'TN', '377': 'TN', '378': 'TN', '379': 'TN',
            '380': 'TN', '381': 'TN', '382': 'TN', '383': 'TN', '384': 'TN', '385': 'TN'
        };
    }

    // validate zip code
    validateZipCode(zip) {
        const cleaned = zip.replace(/\D/g, '');
        return cleaned.length >= 5;
    }

    // validate country code
    validateCountryCode(code) {
        return this.countries.hasOwnProperty(code.toUpperCase());
    }

    // check if destination is international
    isInternationalDestination(destination) {
        return destination.length === 2 && this.validateCountryCode(destination);
    }

    // get state from zip code
    getStateFromZip(zip) {
        const zip3 = zip.substring(0, 3);
        return this.zipToState[zip3] || null;
    }

    // get zone from state
    getZoneFromState(state) {
        for (const [zoneNum, zone] of Object.entries(this.zones)) {
            if (zone.states.includes(state)) {
                return parseInt(zoneNum);
            }
        }
        return 5; // default to zone 5
    }

    // calculate zone-based shipping
    calculateZoneShipping(zip, orderTotal = 0) {
        const state = this.getStateFromZip(zip);
        const zone = this.getZoneFromState(state);
        const zoneInfo = this.zones[zone];
        
        const freeShipping = orderTotal >= 75;
        
        const options = [
            {
                id: 'standard',
                name: 'Standard Shipping',
                description: '5-7 business days',
                cost: freeShipping ? 0 : zoneInfo.rate,
                transit: '5-7 business days'
            },
            {
                id: 'expedited',
                name: 'Expedited Shipping',
                description: '2-3 business days',
                cost: freeShipping ? 6.99 : zoneInfo.rate + 6.99,
                transit: '2-3 business days'
            }
        ];

        return {
            zone: zoneInfo.name,
            freeShipping,
            options
        };
    }

    // calculate international shipping
    calculateInternationalShipping(countryCode, orderTotal = 0) {
        const country = this.countries[countryCode.toUpperCase()];
        if (!country) {
            return { error: 'Country not supported' };
        }

        const freeShipping = orderTotal >= 150; // higher threshold for international

        const options = [
            {
                id: 'international_standard',
                name: 'International Standard',
                description: '7-21 business days',
                cost: freeShipping ? 0 : country.rate,
                transit: '7-21 business days'
            }
        ];

        return {
            country: country.name,
            freeShipping,
            options
        };
    }

    // usps api call (simplified)
    async callUSPSAPI(fromZip, toZip, weight = 1) {
        if (!this.uspsConfig.username) {
            throw new Error('USPS API not configured');
        }

        const xml = `
        <RateV4Request USERID="${this.uspsConfig.username}">
            <Revision>2</Revision>
            <Package ID="1">
                <Service>PRIORITY</Service>
                <ZipOrigination>${fromZip}</ZipOrigination>
                <ZipDestination>${toZip}</ZipDestination>
                <Pounds>0</Pounds>
                <Ounces>${Math.ceil(weight * 16)}</Ounces>
                <Container>VARIABLE</Container>
                <Size>REGULAR</Size>
                <Machinable>true</Machinable>
            </Package>
        </RateV4Request>`;

        return new Promise((resolve, reject) => {
            const postData = `API=RateV4&XML=${encodeURIComponent(xml)}`;
            
            const options = {
                hostname: 'secure.shippingapis.com',
                path: '/ShippingAPI.dll',
                method: 'POST',
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded',
                    'Content-Length': Buffer.byteLength(postData)
                }
            };

            const req = https.request(options, (res) => {
                let data = '';
                res.on('data', (chunk) => data += chunk);
                res.on('end', () => {
                    xml2js.parseString(data, (err, result) => {
                        if (err) reject(err);
                        else resolve(result);
                    });
                });
            });

            req.on('error', reject);
            req.write(postData);
            req.end();
        });
    }

    // main calculate shipping method
    async calculateShipping(destination, orderTotal = 0, items = []) {
        try {
            if (this.isInternationalDestination(destination)) {
                return this.calculateInternationalShipping(destination, orderTotal);
            }

            if (!this.validateZipCode(destination)) {
                return { error: 'Invalid ZIP code' };
            }

            // try usps api first
            if (this.uspsConfig.username) {
                try {
                    const weight = items.length * 0.5; // estimate weight
                    const uspsResult = await this.callUSPSAPI(this.uspsConfig.originZip, destination, weight);
                    
                    // parse usps response and return if successful
                    if (uspsResult && !uspsResult.Error) {
                        const freeShipping = orderTotal >= 75;
                        return {
                            source: 'usps',
                            freeShipping,
                            options: [{
                                id: 'usps_priority',
                                name: 'USPS Priority Mail',
                                description: '1-3 business days',
                                cost: freeShipping ? 0 : 8.99,
                                transit: '1-3 business days'
                            }]
                        };
                    }
                } catch (uspsError) {
                    console.log('USPS API failed, using zone fallback:', uspsError.message);
                }
            }

            // fallback to zone-based calculation
            return this.calculateZoneShipping(destination, orderTotal);
            
        } catch (error) {
            console.error('Shipping calculation error:', error);
            return { error: 'Unable to calculate shipping' };
        }
    }

    // format for stripe
    formatForStripe(shippingData) {
        if (shippingData.error) return [];
        
        return shippingData.options.map(option => ({
            shipping_rate_data: {
                type: 'fixed_amount',
                fixed_amount: { 
                    amount: Math.round(option.cost * 100), 
                    currency: 'usd' 
                },
                display_name: option.name,
                delivery_estimate: {
                    minimum: { unit: 'business_day', value: 1 },
                    maximum: { unit: 'business_day', value: 7 }
                }
            }
        }));
    }

    // get supported countries
    getSupportedCountries() {
        return {
            international: Object.entries(this.countries).map(([code, country]) => ({
                code,
                name: country.name,
                baseRate: country.rate
            }))
        };
    }

    // get supported countries (alternative method name)
    getInternationalCountries() {
        return Object.entries(this.countries).map(([code, country]) => ({
            code,
            name: country.name,
            baseRate: country.rate
        }));
    }
}

module.exports = ShippingCalculator;
