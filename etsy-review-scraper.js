const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');
const https = require('https');

class EtsyReviewScraper {
    constructor(config = null) {
        this.browser = null;
        this.page = null;
        this.config = config;
        this.reviewsData = {
            reviews: [],
            summary: {
                totalReviews: 0,
                averageRating: 0,
                ratingDistribution: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 }
            }
        };
    }

    async initialize() {
        console.log('🚀 Starting Etsy Review Scraper...');
        
        const headless = this.config?.settings?.headless !== false;
        console.log(`🖥️  Running in ${headless ? 'headless' : 'visible'} mode`);
        
        try {
            this.browser = await puppeteer.launch({
                headless: headless,
                args: [
                    '--no-sandbox',
                    '--disable-setuid-sandbox',
                    '--disable-blink-features=AutomationControlled',
                    '--disable-features=VizDisplayCompositor',
                    '--disable-web-security',
                    '--disable-features=VizDisplayCompositor',
                    '--window-size=1200,800'
                ],
                defaultViewport: null
            });
            
            this.page = await this.browser.newPage();
            
            // Set a realistic user agent
            await this.page.setUserAgent('Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36');
            
            // Set viewport
            await this.page.setViewport({ width: 1200, height: 800 });
            
            // Add extra stealth measures
            await this.page.evaluateOnNewDocument(() => {
                Object.defineProperty(navigator, 'webdriver', {
                    get: () => undefined,
                });
            });
            
            console.log('✅ Browser initialized successfully');
            
        } catch (error) {
            console.error('❌ Failed to initialize browser:', error.message);
            throw new Error('Browser initialization failed. Try installing Chrome or setting headless: true');
        }
    }

    async scrapeShopReviews(shopUrl, productMappings = {}) {
        try {
            console.log(`📖 Navigating to: ${shopUrl}`);
            
            // Navigate with retry logic
            let retries = 3;
            while (retries > 0) {
                try {
                    await this.page.goto(shopUrl, { 
                        waitUntil: 'domcontentloaded', 
                        timeout: 30000 
                    });
                    break;
                } catch (error) {
                    retries--;
                    if (retries === 0) throw error;
                    console.log(`⚠️  Navigation failed, retrying... (${retries} attempts left)`);
                    await this.page.waitForTimeout(2000);
                }
            }

            console.log('✅ Page loaded successfully');

            // Wait for content to load
            await this.page.waitForTimeout(3000);

            // Try different selectors for reviews
            console.log('🔍 Looking for reviews...');
            
            let reviewElements = [];
            const selectors = [
                '.shop2-review-review',
                '.review',
                '[data-testid="review"]',
                '.shop-review',
                '[class*="review"]'
            ];
            
            for (const selector of selectors) {
                reviewElements = await this.page.$$(selector);
                if (reviewElements.length > 0) {
                    console.log(`✅ Found ${reviewElements.length} reviews using selector: ${selector}`);
                    break;
                }
            }

            if (reviewElements.length === 0) {
                console.log('⚠️  No reviews found with standard selectors, trying alternative approach...');
                
                // Try to find and click reviews tab
                const reviewsTabs = [
                    '[data-test-id="reviews-tab"]',
                    'a[href*="reviews"]',
                    'button[aria-label*="review" i]',
                    'span:contains("Reviews")'
                ];
                
                for (const tabSelector of reviewsTabs) {
                    try {
                        await this.page.click(tabSelector);
                        await this.page.waitForTimeout(2000);
                        break;
                    } catch (e) {
                        // Continue to next selector
                    }
                }
            }

            // Scroll to load more reviews
            await this.autoScroll();

            // Extract review data with more robust approach
            const reviews = await this.page.evaluate(() => {
                // Try multiple approaches to find reviews
                const possibleReviewSelectors = [
                    '.shop2-review-review',
                    '.review',
                    '[data-testid="review"]',
                    '.shop-review',
                    '[class*="review-item"]',
                    '[class*="review-card"]'
                ];
                
                let reviewElements = [];
                for (const selector of possibleReviewSelectors) {
                    reviewElements = document.querySelectorAll(selector);
                    if (reviewElements.length > 0) break;
                }
                
                if (reviewElements.length === 0) {
                    console.log('No reviews found in DOM');
                    return [];
                }
                
                const extractedReviews = [];

                reviewElements.forEach((reviewEl, index) => {
                    try {
                        // More flexible rating extraction
                        let rating = 5; // Default to 5
                        const ratingSelectors = [
                            '.rating-stars',
                            '.stars',
                            '[class*="star"]',
                            '[aria-label*="star"]',
                            '[title*="star"]'
                        ];
                        
                        for (const ratingSelector of ratingSelectors) {
                            const ratingEl = reviewEl.querySelector(ratingSelector);
                            if (ratingEl) {
                                const ratingText = ratingEl.getAttribute('aria-label') || 
                                                ratingEl.getAttribute('title') || 
                                                ratingEl.innerText || '';
                                const ratingMatch = ratingText.match(/(\d+\.?\d*)/);
                                if (ratingMatch) {
                                    rating = Math.min(5, Math.max(1, parseFloat(ratingMatch[1])));
                                    break;
                                }
                                
                                // Count filled stars
                                const filledStars = ratingEl.querySelectorAll('[class*="filled"], [class*="active"]');
                                if (filledStars.length > 0) {
                                    rating = Math.min(5, filledStars.length);
                                    break;
                                }
                            }
                        }

                        // More flexible name extraction
                        const nameSelectors = [
                            '.shop2-review-username',
                            '.reviewer-name',
                            '[class*="username"]',
                            '[class*="reviewer"]',
                            '[class*="name"]'
                        ];
                        
                        let reviewerName = `Customer ${index + 1}`;
                        for (const nameSelector of nameSelectors) {
                            const nameEl = reviewEl.querySelector(nameSelector);
                            if (nameEl && nameEl.innerText.trim()) {
                                reviewerName = nameEl.innerText.trim();
                                break;
                            }
                        }

                        // More flexible review text extraction
                        const textSelectors = [
                            '.shop2-review-body',
                            '.review-text',
                            '.review-body',
                            '[class*="review-content"]',
                            '[class*="review-body"]',
                            '[class*="body"]',
                            'p:not([class*="date"]):not([class*="name"]):not([class*="rating"])',
                            'div p',
                            'span'
                        ];
                        
                        let reviewText = '';
                        for (const textSelector of textSelectors) {
                            const textEl = reviewEl.querySelector(textSelector);
                            if (textEl && textEl.innerText.trim().length > 10) {
                                reviewText = textEl.innerText.trim();
                                // Skip if it looks like a date or name
                                if (!reviewText.includes(' on ') || reviewText.length > 50) {
                                    break;
                                }
                            }
                        }
                        
                        // If no text found with specific selectors, get all text and filter
                        if (!reviewText) {
                            const allText = reviewEl.innerText || '';
                            console.log(`Debug - All text for review ${index}:`, allText);
                            const lines = allText.split('\n').map(line => line.trim()).filter(line => line.length > 10);
                            console.log(`Debug - Filtered lines:`, lines);
                            for (const line of lines) {
                                // Skip lines that look like dates, names, or ratings
                                if (!line.match(/^\w+ on \w+ \d+, \d+$/) && 
                                    !line.match(/^\d+ out of \d+ stars$/) &&
                                    !line.includes('★') &&
                                    line.length > 20) {
                                    reviewText = line;
                                    console.log(`Debug - Selected text:`, reviewText);
                                    break;
                                }
                            }
                        }

                        // Date extraction
                        const dateSelectors = [
                            '.shop2-review-date',
                            '.review-date',
                            '[class*="date"]',
                            'time'
                        ];
                        
                        let reviewDate = new Date().toISOString().split('T')[0];
                        for (const dateSelector of dateSelectors) {
                            const dateEl = reviewEl.querySelector(dateSelector);
                            if (dateEl) {
                                const dateText = dateEl.innerText.trim() || dateEl.getAttribute('datetime');
                                const parsedDate = new Date(dateText);
                                if (!isNaN(parsedDate.getTime())) {
                                    reviewDate = parsedDate.toISOString().split('T')[0];
                                    break;
                                }
                            }
                        }

                        // Product name extraction
                        const productSelectors = [
                            '.shop2-review-product-title',
                            '.product-title',
                            '[class*="product"]',
                            'h3',
                            'h4'
                        ];
                        
                        let productName = '';
                        for (const productSelector of productSelectors) {
                            const productEl = reviewEl.querySelector(productSelector);
                            if (productEl && productEl.innerText.trim()) {
                                productName = productEl.innerText.trim();
                                break;
                            }
                        }

                        // Image extraction
                        const imageElements = reviewEl.querySelectorAll('img');
                        const reviewImages = Array.from(imageElements)
                            .map(img => img.src)
                            .filter(src => src && 
                                !src.includes('avatar') && 
                                !src.includes('profile') &&
                                !src.includes('icon') &&
                                src.includes('http')
                            );

                        if (reviewText && reviewText.length > 5) {
                            extractedReviews.push({
                                reviewerName,
                                rating,
                                reviewText,
                                reviewDate,
                                productName,
                                reviewImages
                            });
                        }
                    } catch (error) {
                        console.error(`Error processing review ${index}:`, error);
                    }
                });

                return extractedReviews;
            });

            console.log(`✅ Extracted ${reviews.length} reviews`);

            if (reviews.length === 0) {
                console.log('⚠️  No reviews were extracted. This could mean:');
                console.log('   • The shop has no reviews');
                console.log('   • Etsy changed their page structure');
                console.log('   • The page didn\'t load properly');
                return this.reviewsData;
            }

            // Process and format reviews
            await this.processReviews(reviews, productMappings);

            return this.reviewsData;

        } catch (error) {
            console.error('❌ Error scraping reviews:', error);
            throw error;
        }
    }

    async autoScroll() {
        console.log('📜 Auto-scrolling to load more reviews...');
        
        await this.page.evaluate(async () => {
            await new Promise((resolve) => {
                let totalHeight = 0;
                const distance = 100;
                const timer = setInterval(() => {
                    const scrollHeight = document.body.scrollHeight;
                    window.scrollBy(0, distance);
                    totalHeight += distance;

                    if (totalHeight >= scrollHeight || totalHeight > 5000) { // Limit scroll to prevent infinite loading
                        clearInterval(timer);
                        resolve();
                    }
                }, 100);
            });
        });

        await this.page.waitForTimeout(2000);
    }

    async processReviews(rawReviews, productMappings) {
        console.log('🔄 Processing and formatting reviews...');
        
        let reviewId = 1;
        
        for (const rawReview of rawReviews) {
            // Try to match product - be more conservative
            let productId = 1; // Default to first product
            let bestMatch = '';
            let matchCount = 0;
            
            // Use product mappings to match review to product
            for (const [keyword, id] of Object.entries(productMappings)) {
                const keywordInProduct = rawReview.productName.toLowerCase().includes(keyword.toLowerCase());
                const keywordInReview = rawReview.reviewText.toLowerCase().includes(keyword.toLowerCase());
                
                if (keywordInProduct || keywordInReview) {
                    // Count how many words match to find the best match
                    const matches = keyword.split(' ').filter(word => 
                        rawReview.productName.toLowerCase().includes(word.toLowerCase()) ||
                        rawReview.reviewText.toLowerCase().includes(word.toLowerCase())
                    ).length;
                    
                    if (matches > matchCount) {
                        matchCount = matches;
                        productId = id;
                        bestMatch = keyword;
                    }
                }
            }
            
            // Log the matching for debugging
            if (bestMatch) {
                console.log(`📍 Matched review to product ${productId} using keyword: "${bestMatch}"`);
            } else {
                console.log(`📍 No specific match found, assigning to default product ${productId}`);
            }

            // Download and save review images
            const savedImages = [];
            for (const imageUrl of rawReview.reviewImages) {
                try {
                    const savedImagePath = await this.downloadImage(imageUrl, reviewId);
                    if (savedImagePath) {
                        savedImages.push(savedImagePath);
                    }
                } catch (error) {
                    console.error(`Failed to download image: ${imageUrl}`, error);
                }
            }

            // Create formatted review
            const formattedReview = {
                id: reviewId++,
                productId: productId,
                customerName: this.anonymizeName(rawReview.reviewerName),
                rating: Math.round(rawReview.rating),
                title: this.config.settings.generateTitles ? this.generateTitle(rawReview.reviewText, rawReview.rating) : '',
                review: rawReview.reviewText,
                date: rawReview.reviewDate,
                verified: true,
                source: 'etsy',
                images: savedImages,
                productName: rawReview.productName // For reference
            };

            this.reviewsData.reviews.push(formattedReview);
        }

        // Calculate summary
        this.calculateSummary();
    }

    anonymizeName(fullName) {
        // Convert "John Smith" to "John S."
        const parts = fullName.split(' ');
        if (parts.length > 1) {
            return `${parts[0]} ${parts[parts.length - 1].charAt(0)}.`;
        }
        return fullName;
    }

    generateTitle(reviewText, rating) {
        // Since Etsy doesn't have review titles, we'll leave them empty
        // or generate very simple ones based on rating only
        return ''; // Return empty string for no title
    }

    async downloadImage(imageUrl, reviewId) {
        try {
            // Create images directory if it doesn't exist
            const imagesDir = path.join(__dirname, 'images', 'reviews');
            if (!fs.existsSync(imagesDir)) {
                fs.mkdirSync(imagesDir, { recursive: true });
            }

            // Generate filename
            const extension = path.extname(new URL(imageUrl).pathname) || '.jpg';
            const filename = `review_${reviewId}_${Date.now()}${extension}`;
            const filepath = path.join(imagesDir, filename);

            // Download image
            await new Promise((resolve, reject) => {
                const file = fs.createWriteStream(filepath);
                https.get(imageUrl, (response) => {
                    response.pipe(file);
                    file.on('finish', () => {
                        file.close();
                        resolve();
                    });
                }).on('error', (error) => {
                    fs.unlink(filepath, () => {}); // Delete partial file
                    reject(error);
                });
            });

            return `images/reviews/${filename}`;
        } catch (error) {
            console.error('Failed to download image:', error);
            return null;
        }
    }

    calculateSummary() {
        const totalReviews = this.reviewsData.reviews.length;
        const totalRating = this.reviewsData.reviews.reduce((sum, review) => sum + review.rating, 0);
        const averageRating = totalReviews > 0 ? totalRating / totalReviews : 0;

        // Reset distribution
        this.reviewsData.summary.ratingDistribution = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
        
        // Calculate distribution
        this.reviewsData.reviews.forEach(review => {
            this.reviewsData.summary.ratingDistribution[review.rating]++;
        });

        this.reviewsData.summary.totalReviews = totalReviews;
        this.reviewsData.summary.averageRating = Math.round(averageRating * 10) / 10;
    }

    async saveReviews(filename = 'etsy_reviews.json') {
        const filepath = path.join(__dirname, filename);
        fs.writeFileSync(filepath, JSON.stringify(this.reviewsData, null, 2));
        console.log(`💾 Reviews saved to: ${filepath}`);
        console.log(`📊 Summary: ${this.reviewsData.summary.totalReviews} reviews, ${this.reviewsData.summary.averageRating} average rating`);
    }

    async mergeWithExistingReviews(existingFile = 'reviews.json') {
        try {
            const existingData = JSON.parse(fs.readFileSync(existingFile, 'utf8'));
            
            // Merge reviews (avoid duplicates)
            const combinedReviews = [...existingData.reviews];
            let nextId = Math.max(...existingData.reviews.map(r => r.id), 0) + 1;
            
            for (const newReview of this.reviewsData.reviews) {
                const isDuplicate = existingData.reviews.some(existing => 
                    existing.customerName === newReview.customerName &&
                    existing.review === newReview.review &&
                    existing.date === newReview.date
                );
                
                if (!isDuplicate) {
                    newReview.id = nextId++;
                    combinedReviews.push(newReview);
                }
            }
            
            // Update summary
            const totalReviews = combinedReviews.length;
            const totalRating = combinedReviews.reduce((sum, review) => sum + review.rating, 0);
            const averageRating = totalReviews > 0 ? totalRating / totalReviews : 0;
            
            const ratingDistribution = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
            combinedReviews.forEach(review => {
                ratingDistribution[review.rating]++;
            });
            
            const mergedData = {
                reviews: combinedReviews,
                summary: {
                    totalReviews,
                    averageRating: Math.round(averageRating * 10) / 10,
                    ratingDistribution
                }
            };
            
            fs.writeFileSync(existingFile, JSON.stringify(mergedData, null, 2));
            console.log(`🔄 Merged ${this.reviewsData.reviews.length} new reviews with existing ${existingData.reviews.length} reviews`);
            console.log(`📊 Total: ${totalReviews} reviews, ${mergedData.summary.averageRating} average rating`);
            
        } catch (error) {
            console.error('Error merging reviews:', error);
            await this.saveReviews('etsy_reviews_backup.json');
        }
    }

    async close() {
        if (this.browser) {
            await this.browser.close();
        }
    }
}

// Usage example
async function scrapeEtsyReviews() {
    let scraper;
    
    try {
        // Load configuration
        const config = JSON.parse(fs.readFileSync('scraper-config.json', 'utf8'));
        
        scraper = new EtsyReviewScraper(config);
        await scraper.initialize();
        
        console.log(`🎯 Scraping: ${config.shopUrl}`);
        console.log(`📋 Product mappings: ${Object.keys(config.productMappings).length} keywords`);
        
        // Scrape your Etsy shop
        await scraper.scrapeShopReviews(config.shopUrl, config.productMappings);
        
        // Merge with existing reviews
        await scraper.mergeWithExistingReviews('reviews.json');
        
        console.log('🎉 Scraping completed successfully!');
        console.log('📁 Check images/reviews/ for downloaded customer photos');
        console.log('📄 Updated reviews.json with new data');
        
    } catch (error) {
        console.error('❌ Scraping failed:', error.message);
        console.log('\n💡 Troubleshooting Tips:');
        console.log('  1. Make sure Chrome is installed');
        console.log('  2. Try setting "headless": true in scraper-config.json');
        console.log('  3. Check your internet connection');
        console.log('  4. Verify your Etsy shop URL is correct');
        console.log('  5. Some reviews might still have been saved');
        
        // Try to save any partial data
        if (scraper && scraper.reviewsData.reviews.length > 0) {
            console.log(`\n📦 Saving ${scraper.reviewsData.reviews.length} partial results...`);
            await scraper.saveReviews('partial_reviews.json');
        }
        
    } finally {
        if (scraper) {
            try {
                await scraper.close();
            } catch (e) {
                // Browser might already be closed
            }
        }
    }
}

// Export for use
module.exports = EtsyReviewScraper;

// Run if called directly
if (require.main === module) {
    scrapeEtsyReviews();
}
