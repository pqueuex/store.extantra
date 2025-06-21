# 🕷️ EXTANTRA Etsy Review Scraper

Automatically extract customer reviews and images from your Etsy shop and format them for your EXTANTRA website.

## 🚀 Quick Start

1. **Setup** (one time only):
   ```bash
   chmod +x setup-scraper.sh
   ./setup-scraper.sh
   ```

2. **Run the scraper**:
   ```bash
   npm run scrape-reviews
   ```

## ✨ Features

- 📝 **Extracts all review data**: ratings, text, dates, customer names
- 🖼️ **Downloads customer images**: saves to `images/reviews/`
- 🎯 **Smart product matching**: automatically assigns reviews to correct products
- 🔄 **Merge with existing**: adds new reviews without duplicates
- 🎭 **Privacy protection**: anonymizes customer names (John Smith → John S.)
- 📊 **Auto-generates titles**: creates engaging review titles
- 🏷️ **Source tagging**: marks reviews as from Etsy
- ✅ **Verified badges**: marks as verified purchases

## 🔧 Configuration

Edit `scraper-config.json` to customize:

```json
{
  "shopUrl": "https://www.etsy.com/shop/Monoangel/reviews",
  "productMappings": {
    "silent hill 2": 1,
    "pyramid head": 1,
    "aphex twin": 2
  },
  "settings": {
    "downloadImages": true,
    "headless": false,
    "anonymizeNames": true
  }
}
```

### Product Mappings

The scraper uses keywords to match reviews to your products:

- **Key**: Text to search for in review content
- **Value**: Your product ID (from products.json)

Example:
```json
"silent hill 2": 1,     // Reviews mentioning "silent hill 2" → Product ID 1
"pyramid head": 1,      // Reviews mentioning "pyramid head" → Product ID 1
"aphex twin": 2         // Reviews mentioning "aphex twin" → Product ID 2
```

## 📁 Output

### Reviews Data (`reviews.json`)
```json
{
  "reviews": [
    {
      "id": 1,
      "productId": 1,
      "customerName": "Sarah M.",
      "rating": 5,
      "title": "Amazing Silent Hill Zippo!",
      "review": "This lighter is absolutely incredible!",
      "date": "2024-12-15",
      "verified": true,
      "source": "etsy",
      "images": ["images/reviews/review_1_123456.jpg"]
    }
  ],
  "summary": {
    "totalReviews": 25,
    "averageRating": 4.8
  }
}
```

### Customer Images
- Saved to: `images/reviews/`
- Format: `review_{id}_{timestamp}.jpg`
- Automatically displayed in your product reviews

## 🔄 Regular Usage

Run the scraper weekly or after getting new Etsy reviews:

```bash
npm run scrape-reviews
```

The scraper will:
1. 🌐 Open your Etsy shop
2. 📜 Scroll through all reviews  
3. 💾 Extract and save new data
4. 🔄 Merge with existing reviews
5. 🖼️ Download any new customer images

## 🛠️ Troubleshooting

### "No reviews found"
- Check your Etsy shop URL in `scraper-config.json`
- Make sure your shop has public reviews
- Try setting `"headless": false` to see what's happening

### "Scraping failed"
- Check internet connection
- Etsy may have changed their layout (contact for updates)
- Try running again (sometimes temporary)

### "Images not downloading"
- Set `"downloadImages": false` to skip images
- Check disk space in `images/reviews/` folder

## 🎯 Tips

- **First run**: May take 2-3 minutes to download all images
- **Regular runs**: Much faster, only processes new reviews  
- **Product matching**: Add more keywords to improve matching accuracy
- **Privacy**: Customer names are automatically anonymized

## 📊 Integration

The scraper automatically integrates with your existing review system:

- ✅ Updates your website's `reviews.json`
- ✅ Images appear in product reviews
- ✅ SEO structured data includes review count/ratings
- ✅ Trustpilot tab still works alongside

## 🆘 Support

If the scraper breaks due to Etsy changes, the review system will continue working with existing data. Contact for scraper updates.

---

**Happy scraping!** 🕷️✨
