#!/usr/bin/env node
/*
Scaffold for publishing listings to Etsy via Open API v3.
This runs in dry-run mode by default to avoid accidental publishes.
Requires environment variables for OAuth: ETSY_API_KEY, ETSY_SHOP_ID, ETSY_ACCESS_TOKEN
*/
const fs = require('fs');
const path = require('path');
const https = require('https');

function readJson(p) { return JSON.parse(fs.readFileSync(p, 'utf8')); }

function request(options, body) {
  return new Promise((resolve, reject) => {
    const req = https.request(options, res => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try { resolve({ status: res.statusCode, data: data ? JSON.parse(data) : {} }); }
        catch (e) { resolve({ status: res.statusCode, data }); }
      });
    });
    req.on('error', reject);
    if (body) req.write(JSON.stringify(body));
    req.end();
  });
}

async function createOrUpdateDraft(listing, dryRun = true) {
  const shopId = process.env.ETSY_SHOP_ID;
  const token = process.env.ETSY_ACCESS_TOKEN;
  const key = process.env.ETSY_API_KEY;
  if (!shopId || !token || !key) {
    throw new Error('Missing Etsy API credentials (ETSY_SHOP_ID, ETSY_ACCESS_TOKEN, ETSY_API_KEY)');
  }

  const body = {
    title: listing.title,
    description: listing.description,
    who_made: listing.who_made,
    when_made: listing.when_made,
    is_supply: listing.is_supply,
    taxonomy_id: listing.taxonomy_id,
    should_auto_renew: false,
    price: String(listing.price),
    quantity: listing.quantity,
    shipping_profile_id: listing.shipping_profile_id || undefined,
    shop_section_id: listing.section_id || undefined,
    tags: listing.tags,
    materials: listing.materials
  };

  if (dryRun) {
    return { status: 'dry-run', body };
  }

  const options = {
    method: 'POST',
    hostname: 'openapi.etsy.com',
    path: `/v3/application/shops/${shopId}/listings`,
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': key,
      'Authorization': `Bearer ${token}`
    }
  };

  return await request(options, body);
}

async function main() {
  const root = process.cwd();
  const etsyListingsPath = path.join(root, 'dist', 'listings', 'etsy.json');
  if (!fs.existsSync(etsyListingsPath)) {
    console.error('dist/listings/etsy.json not found. Run: npm run generate:listings');
    process.exit(1);
  }
  const dryRun = process.env.DRY_RUN !== 'false';
  const listings = readJson(etsyListingsPath);
  let ok = 0, fail = 0;
  for (const listing of listings) {
    try {
      const res = await createOrUpdateDraft(listing, dryRun);
      if (res.status === 'dry-run' || (res.status >= 200 && res.status < 300)) {
        ok++;
      } else {
        fail++;
        console.error('Etsy response:', res);
      }
    } catch (e) {
      fail++;
      console.error('Error publishing listing:', listing.title, e.message);
    }
  }
  console.log(`Publish complete. Success: ${ok}, Failed: ${fail}. Mode: ${dryRun ? 'DRY RUN' : 'LIVE'}`);
}

if (require.main === module) {
  main();
}
