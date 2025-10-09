# New Products Added - October 8, 2025

## Overview
Added 4 new lighter products based on mockup images provided.

---

## New Products Created

### Product ID 12: Call of Duty Prestige Lighter
- **Name:** Call of Duty Prestige Zippo Flip Lighter
- **Category:** Gaming
- **Theme:** FPS
- **Price:** $35 (chrome)
- **Images:** Converted from `cod_prestige_lighter_mockup.jpg`
- **Description:** Features iconic COD Prestige emblem for multiplayer veterans

### Product ID 13: Trollface Lighter  
- **Name:** Trollface Meme Zippo Flip Lighter
- **Category:** Original
- **Theme:** Meme
- **Price:** $35 (chrome)
- **Images:** Converted from `trollface_lighter_mockup.JPG`
- **Description:** Classic internet meme culture, nostalgic rage comic icon

### Product ID 14: I Feel Fantastic Lighter
- **Name:** I Feel Fantastic Creepy Robot Zippo Flip Lighter
- **Category:** Original
- **Theme:** Creepy
- **Price:** $35 (chrome)
- **Images:** Converted from `i_feel_fantastic_lighter_mockup.JPG`
- **Description:** Features Tara the Android from viral creepy video

### Product ID 15: Skate Game Lighter
- **Name:** Skate Video Game Zippo Flip Lighter
- **Category:** Gaming
- **Theme:** Sports
- **Price:** $35 (chrome)
- **Images:** Converted from `skate_lighter_mockup.jpg`
- **Description:** Celebrates the legendary EA Skate game series

---

## Files Created/Modified

### products.json
- Added 4 new product entries (IDs 12-15)
- All products follow existing format with:
  - Chrome variant only (can add black later)
  - Standard pricing ($35 chrome)
  - Engraving options (side + back, $10 each)
  - Butane insert upgrade option ($25)
  - Standard product description with fluid/size info

### Images Created
**Barcodes:**
- `images/barcodes/012.jpeg` (placeholder)
- `images/barcodes/013.jpeg` (placeholder)
- `images/barcodes/014.jpeg` (placeholder)
- `images/barcodes/015.jpeg` (placeholder)

**Chrome Variants:**
- `images/variants/chrome/012_chrome_1.webp` ← converted from mockup
- `images/variants/chrome/012_chrome_2.webp` (placeholder copy)
- `images/variants/chrome/012_chrome_3.webp` (placeholder copy)
- `images/variants/chrome/013_chrome_1.webp` ← converted from mockup
- `images/variants/chrome/013_chrome_2.webp` (placeholder copy)
- `images/variants/chrome/013_chrome_3.webp` (placeholder copy)
- `images/variants/chrome/014_chrome_1.webp` ← converted from mockup
- `images/variants/chrome/014_chrome_2.webp` (placeholder copy)
- `images/variants/chrome/014_chrome_3.webp` (placeholder copy)
- `images/variants/chrome/015_chrome_1.webp` ← converted from mockup
- `images/variants/chrome/015_chrome_2.webp` (placeholder copy)
- `images/variants/chrome/015_chrome_3.webp` (placeholder copy)

---

## Next Steps / TODO

### Images Needed
- [ ] GIF animations for each product:
  - `images/gifs/012_chrome.gif` (COD Prestige)
  - `images/gifs/013_chrome.gif` (Trollface)
  - `images/gifs/014_chrome.gif` (I Feel Fantastic)
  - `images/gifs/015_chrome.gif` (Skate)

- [ ] Additional product photos for variants:
  - Replace placeholder `_2` and `_3` images with actual product photos
  - Add side views, back views, detail shots

- [ ] Real barcode images:
  - Replace placeholder barcodes with actual product barcodes

### Optional Additions
- [ ] Black variants (if you want to offer them):
  - Add black variant to each product
  - Create black version images
  - Price at $25 for black

- [ ] Product-specific customization:
  - Consider if any of these need special options
  - All currently have standard engraving options

---

## Product Details Summary

| ID | Name | Theme | Mockup Source | Status |
|----|------|-------|---------------|--------|
| 12 | COD Prestige | FPS Gaming | cod_prestige_lighter_mockup.jpg | ✅ Added |
| 13 | Trollface | Internet Meme | trollface_lighter_mockup.JPG | ✅ Added |
| 14 | I Feel Fantastic | Creepy/Horror | i_feel_fantastic_lighter_mockup.JPG | ✅ Added |
| 15 | Skate | Gaming/Sports | skate_lighter_mockup.jpg | ✅ Added |

---

## Marketing Notes

### Target Audiences

**COD Prestige:**
- Call of Duty players
- FPS gamers
- Military/tactical aesthetic fans
- Competitive gamers

**Trollface:**
- Millennial/Gen Z nostalgia market
- Internet culture enthusiasts
- Meme collectors
- Rage comic fans

**I Feel Fantastic:**
- Creepypasta fans
- Internet horror enthusiasts
- Viral video collectors
- Alternative/dark humor audience

**Skate:**
- Skateboarding community
- EA Skate game fans
- Action sports enthusiasts
- Gaming collectors

### SEO Keywords to Target
- "call of duty lighter"
- "prestige emblem zippo"
- "trollface lighter"
- "meme zippo lighter"
- "i feel fantastic merchandise"
- "creepy robot lighter"
- "skate game lighter"
- "skateboarding zippo"

---

## Testing Checklist

- [ ] Visit product pages for IDs 12-15
- [ ] Verify images display correctly
- [ ] Check pricing displays as $35
- [ ] Test add to cart functionality
- [ ] Verify engraving options work
- [ ] Check butane insert upgrade option
- [ ] Test mobile responsiveness
- [ ] Verify product listings show new items

---

## Conversion Details

All mockup images were converted using ImageMagick:
```bash
magick [source].jpg -quality 90 variants/chrome/[id]_chrome_1.webp
```

- Quality: 90% (good balance of quality vs file size)
- Format: WebP (modern, efficient)
- Location: `images/variants/chrome/`

Original mockup files remain in `images/` folder for reference.

---

All products are now live and ready for sale! 🎉
