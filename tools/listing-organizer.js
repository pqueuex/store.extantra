#!/usr/bin/env node
/*
Organize listings into per-listing folders and copy images:
- Reads products.json
- Creates images/listings/<id>-<slug>/
- Copies referenced images there (+ optional barcode)
- Writes metadata.json in each folder
- Optional --rewrite to update products.json image paths to folderized versions
*/
const fs = require('fs');
const path = require('path');

function readJson(p) { return JSON.parse(fs.readFileSync(p, 'utf8')); }
function writeJson(p, obj) { fs.writeFileSync(p, JSON.stringify(obj, null, 2) + '\n'); }
function ensureDir(p) { fs.mkdirSync(p, { recursive: true }); }
function slugify(s) { return String(s || '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, ''); }
function copyIfExists(src, dest) {
  if (!fs.existsSync(src)) return false;
  ensureDir(path.dirname(dest));
  fs.copyFileSync(src, dest);
  return true;
}

function main() {
  const root = process.cwd();
  const productsPath = path.join(root, 'products.json');
  if (!fs.existsSync(productsPath)) {
    console.error('products.json not found at project root');
    process.exit(1);
  }
  const products = readJson(productsPath);
  const rewrite = process.argv.includes('--rewrite');

  let organized = 0;

  for (const p of products.products) {
    const slug = slugify(p.name || `listing-${p.id}`);
    const base = `${String(p.id).toString().padStart(3,'0')}-${slug}`;
    const listingDir = path.join(root, 'images', 'listings', base);
    ensureDir(listingDir);

    const newImages = [];
    const sourceImages = Array.isArray(p.images) ? p.images : [];

    sourceImages.forEach((rel, idx) => {
      const src = path.isAbsolute(rel) ? rel : path.join(root, rel);
      const ext = path.extname(src) || '.jpg';
      const destName = `${String(p.id).toString().padStart(3,'0')}_${slug}_${idx+1}${ext}`;
      const dest = path.join(listingDir, destName);
      const copied = copyIfExists(src, dest);
      if (copied) {
        newImages.push(path.relative(root, dest).replace(/\\/g, '/'));
      } else {
        // keep original path if file not found
        newImages.push(rel);
        console.warn(`Missing image for product ${p.id}: ${rel}`);
      }
    });

    // Copy barcode into listing folder if present
    let barcodeCopied = null;
    if (p.barcode) {
      const barcodeSrc = path.isAbsolute(p.barcode) ? p.barcode : path.join(root, p.barcode);
      const dest = path.join(listingDir, 'barcode' + (path.extname(barcodeSrc) || '.jpeg'));
      if (copyIfExists(barcodeSrc, dest)) {
        barcodeCopied = path.relative(root, dest).replace(/\\/g, '/');
      }
    }

    // Write metadata
    const meta = {
      id: p.id,
      name: p.name,
      slug,
      folder: path.relative(root, listingDir),
      createdAt: new Date().toISOString(),
      sourceImages: sourceImages,
      organizedImages: newImages,
      barcode: p.barcode,
      copiedBarcode: barcodeCopied
    };
    writeJson(path.join(listingDir, 'metadata.json'), meta);

    if (rewrite) {
      p.images = newImages;
      if (barcodeCopied) p.barcode = barcodeCopied;
    }

    organized++;
  }

  if (rewrite) {
    writeJson(productsPath, products);
    console.log('products.json updated with organized image and barcode paths.');
  }

  console.log(`Organized ${organized} listings under images/listings/`);
}

if (require.main === module) {
  main();
}
