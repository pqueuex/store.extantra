#!/usr/bin/env node
/*
Transforms products.json into channel-agnostic listing objects and writes JSON under ./dist/listings.
Safe: read-only against source data.
*/
const fs = require('fs');
const path = require('path');

function readJson(p) {
  return JSON.parse(fs.readFileSync(p, 'utf8'));
}

function ensureDir(p) {
  fs.mkdirSync(p, { recursive: true });
}

function slugify(s) {
  return s
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)+/g, '')
    .slice(0, 80);
}

function buildTags(item, defaults, boosts = []) {
  const type = item.type || item.attributes?.type;
  const category = item.category || item.attributes?.category;
  const theme = item.theme || item.attributes?.theme;
  const color = item.color || item.attributes?.color;
  const title = (item.name || item.title || '').toString();

  const tags = new Set([
    ...(defaults || []),
    type,
    category,
    theme,
    color,
    ...title.toLowerCase().split(/[^a-z0-9]+/g).filter(Boolean).slice(0, 6)
  ].filter(Boolean));
  boosts.forEach(t => tags.add(t));
  return Array.from(tags).slice(0, 13);
}

function toStandardListing(product, cfg) {
  const price = product.salePrice || product.currentPrice || product.originalPrice;
  return {
    id: product.id,
    sku: `EXT-${String(product.id).padStart(3, '0')}`,
    title: product.name,
    description: product.longDescription || product.description || '',
    price: Number(price),
    currency: cfg.defaultCurrency,
    quantity: product.inStock ? cfg.defaultQuantity : 0,
    images: product.images || [],
    barcodeImage: product.barcode || null,
    attributes: {
      category: product.category,
      color: product.color,
      theme: product.theme,
      type: product.type,
      onSale: !!product.onSale,
      salePercentage: product.salePercentage || 0
    },
    shipping: {
      freeThreshold: 75,
      domesticStd: 8.99,
      domesticExp: 14.99
    },
    meta: {
      slug: `${product.id}-${slugify(product.name)}`
    }
  };
}

function main() {
  const root = process.cwd();
  const productsPath = path.join(root, 'products.json');
  const configPath = path.join(root, 'config', 'listing-config.json');
  const etsyPath = path.join(root, 'config', 'channel-etsy.json');
  const distDir = path.join(root, 'dist', 'listings');

  const data = readJson(productsPath);
  const cfg = readJson(configPath);
  const etsyCfg = readJson(etsyPath);

  const standard = data.products.map(p => toStandardListing(p, cfg));

  // Channel specific transforms (Etsy)
  const etsyListings = standard.map(listing => {
    const tags = buildTags(listing, cfg.defaultTags, etsyCfg.tagBoost);
    const title = listing.title.slice(0, 140);
    return {
      channel: 'etsy',
      id: listing.id,
      sku: listing.sku,
      title,
      description: listing.description,
      quantity: listing.quantity,
      price: listing.price,
      who_made: etsyCfg.policy.who_made,
      when_made: etsyCfg.policy.when_made,
      is_supply: etsyCfg.policy.is_supply,
      taxonomy_id: etsyCfg.taxonomyHints[listing.attributes.type] || 6921,
      shipping_profile_id: etsyCfg.shippingProfileId,
      section_id: etsyCfg.sectionId,
      tags,
      materials: ['Metal','Refillable'],
      images: listing.images,
      state: listing.quantity > 0 ? 'draft' : 'inactive'
    };
  });

  ensureDir(distDir);
  fs.writeFileSync(path.join(distDir, 'standard.json'), JSON.stringify(standard, null, 2));
  fs.writeFileSync(path.join(distDir, 'etsy.json'), JSON.stringify(etsyListings, null, 2));
  console.log(`Wrote ${standard.length} listings to dist/listings (standard and etsy).`);
}

if (require.main === module) {
  main();
}
