# Multi-channel Listings

This adds a safe generator to turn `products.json` into standardized listings and channel-specific payloads (Etsy first).

- Config: `config/listing-config.json` (shared defaults), `config/channel-etsy.json` (channel mapping)
- Generator: `tools/listing-generator.js` -> writes JSON to `dist/listings/`
- Publisher: `tools/etsy-publisher.js` -> DRY RUN by default; requires Etsy API credentials for live mode

Usage

1) Generate listings from products.json

npm run generate:listings

Outputs:
- dist/listings/standard.json
- dist/listings/etsy.json

2) Publish to Etsy (dry run)

# DRY_RUN is true by default. Set DRY_RUN=false to publish.
DRY_RUN=true npm run publish:etsy

Environment required for live mode:
- ETSY_API_KEY
- ETSY_ACCESS_TOKEN (OAuth token)
- ETSY_SHOP_ID

Notes
- Titles are truncated to 140 chars for Etsy.
- Tags are auto-generated from product name + attributes + boosts.
- Quantity uses inStock and defaultQuantity.
- Images reference your local paths; the publisher scaffold does not upload images yet. We'll add media upload next if you want.
