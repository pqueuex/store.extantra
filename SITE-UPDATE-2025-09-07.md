# Site Update Plan - September 7, 2025

## Overview
Major product enhancement update adding visual improveme#### JavaScript Updates
- [ ] Variant selection handling
- [ ] Dynamic price calculation (variant base + engravings + insert)
- [ ] Image/GIF switching
- [ ] **Butane insert option logic** (chrome variants only)
- [ ] **Disclaimer display logic** when black variant selected
- [ ] Cart item structure updates
- [ ] Form validation for both engraving optionsolor variants, and customization options to all lighter listings.

## Update Requirements

### 1. Product Media Enhancement
- **400x450 GIF for every lighter**
  - Create animated GIFs showing 360° rotation or key angles
  - Standardize dimensions: 400px width × 450px height
  - Optimize for web (target <500KB per GIF)
  - Place in `/images/gifs/` directory
  - Update products.json to include gif field

### 2. Color Variant System
- **Dual color options for all lighters**
  - Street Chrome version ($30 base price)
  - Black version ($25 base price)
  - Update product data structure to support variants
  - Maintain existing product IDs as parent products
  - Add variant selection UI on product pages
  - **Disable all existing sales** - clean pricing structure
  - **Add disclaimer**: Black variants are not official Zippo brand products

### 3. Product Page Enhancements
- **Color Selection Menu**
  - Radio buttons or dropdown for Chrome/Black selection
  - Live price updates based on selection
  - **Automatic image/GIF switching to focused color variant**
    - Main product image switches to selected color
    - GIF switches to appropriate color variant animation
    - Thumbnail gallery updates to show selected color images
    - Smooth visual transitions between variants
  - Update cart system to handle color variants

- **Optional Additional Engraving**
  - Toggle option for side engraving (+$10)
  - Toggle option for back engraving (+$10)
  - Can select one, both, or neither
  - Text input for each custom engraving option
  - Character limits and validation
  - Preview or description of engraving placement

- **Premium Insert Option (Chrome Only)**
  - Toggle option for butane insert (+$25)
  - Available only on Street Chrome variants
  - Replaces standard wick/flint system with torch flame
  - Premium upgrade for chrome customers only

## Implementation Plan

### Phase 1: Data Structure Updates
```json
// New product structure in products.json
{
  "id": 1,
  "name": "Silent Hill 2 Zippo Flip Lighter",
  "variants": [
    {
      "id": "001-chrome",
      "color": "chrome",
      "colorName": "Street Chrome",
      "price": 30,
      "images": ["001_chrome_1.webp", "001_chrome_2.webp", "001_chrome_3.webp"],
      "gif": "001_chrome.gif",
      "inStock": true,
      "premiumOptions": {
        "butaneInsert": {
          "available": true,
          "price": 25,
          "description": "Upgrade to butane torch insert for reliable wind-resistant flame"
        }
      }
    },
    {
      "id": "001-black",
      "color": "black", 
      "colorName": "Matte Black",
      "price": 25,
      "images": ["001_black_1.webp", "001_black_2.webp", "001_black_3.webp"],
      "gif": "001_black.gif",
      "inStock": true,
      "disclaimer": "Black color variant is not an official Zippo brand product but nonetheless high quality"
    }
  ],
  "customization": {
    "sideEngraving": {
      "available": true,
      "price": 10,
      "maxCharacters": 50,
      "description": "Add custom text to the side"
    },
    "backEngraving": {
      "available": true,
      "price": 10,
      "maxCharacters": 50,
      "description": "Add custom text to the back"
    }
  }
}
```

### Phase 2: Asset Creation
- [ ] Create 400x450 GIFs for all existing products (12 total: 6 chrome + 6 black)
- [ ] Organize in `/images/gifs/` directory
- [ ] Naming convention: `{productId}_{color}.gif`

### Phase 3: Frontend Updates

#### Product Page Updates (`product.html`)
- [ ] Add color variant selector
- [ ] Add GIF display area
- [ ] Add optional engraving sections (side and back)
- [ ] **Add butane insert option** for chrome variants only
- [ ] **Add disclaimer display** for black variants
- [ ] Update pricing display logic (variant + engravings + insert)
- [ ] Modify add-to-cart functionality

#### CSS Updates (`styles.css`)
- [ ] Style color selector (radio buttons/swatches)
- [ ] Style engraving options sections (side and back)
- [ ] **Style butane insert option** for chrome variants
- [ ] **Style disclaimer text** (subtle but visible)
- [ ] GIF display styling
- [ ] Mobile responsive updates

#### JavaScript Updates
- [ ] Variant selection handling
- [ ] Dynamic price calculation (variant base + engravings + insert)
- [ ] **Image/GIF switching based on color variant selection**
  - Switch main product images when color variant is selected
  - Update GIF to match selected color variant
  - Update thumbnails to show appropriate color images
  - Smooth transitions between variant image sets
- [ ] **Butane insert option logic** (chrome variants only)
- [ ] **Disclaimer display logic** when black variant selected
- [ ] Cart item structure updates
- [ ] Form validation for both engraving options

### Phase 4: Backend Updates

#### Products Data Migration
- [ ] Convert existing single products to variant structure
- [ ] **Disable all active sales** in products.json
- [ ] Maintain backward compatibility
- [ ] Update product loading logic

#### Cart & Checkout Updates
- [ ] Support variant-based cart items
- [ ] Include customization options in cart
- [ ] Update Stripe integration for variants
- [ ] Order fulfillment notes for engraving

## File Structure Changes

```
images/
├── gifs/
│   ├── 001_chrome.gif
│   ├── 001_black.gif
│   ├── 002_chrome.gif
│   ├── 002_black.gif
│   └── ...
├── variants/
│   ├── chrome/
│   │   ├── 001_chrome_1.webp
│   │   ├── 001_chrome_2.webp
│   │   └── 001_chrome_3.webp
│   └── black/
│       ├── 001_black_1.webp
│       ├── 001_black_2.webp
│       └── 001_black_3.webp
```

## Technical Considerations

### Performance
- Lazy load GIFs to prevent slow page loads
- Optimize GIF file sizes
- Preload variant images on color selection

### SEO
- Update structured data for variants
- Maintain URL structure for existing products
- Add variant-specific meta descriptions
- Include disclaimer in product descriptions for compliance

### Legal & Compliance
- Clear distinction between official Zippo (chrome) and alternative products (black)
- Disclaimer visibility and placement
- Product description accuracy
- Avoid trademark infringement

### Cart Complexity
- Unique cart item identification (productId + variantId + customizations + insert)
- Display all customization details in cart (side text, back text, insert type)
- Pricing calculations: variant base ($25-30) + side engraving ($10) + back engraving ($10) + butane insert ($25, chrome only)
- Support for partial customization (side only, back only, or both)
- Chrome exclusive options (butane insert)
- Price range: $25 (black basic) to $75 (chrome + both engravings + butane insert)

### Inventory Management
- Track inventory per variant
- Handle out-of-stock variants gracefully
- Update listing generation for multi-channel

## Testing Checklist

### Functionality
- [ ] Color variant selection works
- [ ] GIF displays correctly
- [ ] Pricing updates dynamically (variant base + both engraving options + insert)
- [ ] Side engraving option functions
- [ ] Back engraving option functions
- [ ] **Butane insert option functions** (chrome only)
- [ ] Both engraving options can be selected together
- [ ] **Disclaimer displays correctly** for black variants
- [ ] Cart handles variants and multiple customizations correctly
- [ ] Checkout processes all options
- [ ] Mobile responsiveness

### Edge Cases
- [ ] Out of stock variants
- [ ] Invalid engraving text (both side and back)
- [ ] **Butane insert option visibility** (chrome variants only)
- [ ] Cart with mixed variants and customizations
- [ ] Maximum combinations (variant + side + back + insert)
- [ ] Engraving character limits
- [ ] Browser compatibility

## Rollout Strategy

### Development
1. Create feature branch: `feature/product-variants`
2. Implement data structure changes
3. Update frontend components
4. Test thoroughly

### Content Creation
1. Create GIFs for existing products
2. Organize image assets
3. Update product descriptions

### Deployment
1. Deploy backend changes
2. Update products.json with new structure
3. Deploy frontend updates
4. Monitor for issues

## Next Steps
1. Confirm update requirements and scope
2. Create GIF assets for existing products
3. Begin data structure implementation
4. Design UI mockups for variant selection
5. Plan detailed implementation schedule
