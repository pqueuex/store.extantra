#!/usr/bin/env node
/*
Interactive CLI to create a new listing from scratch.
- Prompts for core fields
- Copies provided images into images/listings/<id>-<slug>/
- Appends the new product to products.json
- Prints next steps and optional commands

No external deps.
*/
const fs = require('fs');
const path = require('path');
const readline = require('readline');

function readJson(p) { return JSON.parse(fs.readFileSync(p, 'utf8')); }
function writeJson(p, obj) { fs.writeFileSync(p, JSON.stringify(obj, null, 2) + '\n'); }
function ensureDir(p) { fs.mkdirSync(p, { recursive: true }); }
function slugify(s) {
  return s.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '');
}
function copyFileSafe(src, dest) {
  fs.copyFileSync(src, dest);
}

async function prompt(questions) {
  const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
  function ask(q) { return new Promise(res => rl.question(q, ans => res(ans))); }
  const answers = {};
  for (const q of questions) {
    let val;
    while (true) {
      val = (await ask(q.prompt)).trim();
      if (!q.required || val) break;
      console.log('This field is required.');
    }
    answers[q.name] = val || q.default || '';
  }
  rl.close();
  return answers;
}

function nextId(products) {
  const maxId = products.reduce((m, p) => Math.max(m, Number(p.id) || 0), 0);
  return maxId + 1;
}

async function main() {
  const root = process.cwd();
  const productsPath = path.join(root, 'products.json');
  if (!fs.existsSync(productsPath)) {
    console.error('products.json not found at project root.');
    process.exit(1);
  }
  const data = readJson(productsPath);
  const id = nextId(data.products);

  console.log(`\nCreating new listing. Next ID will be ${id}.`);

  const answers = await prompt([
    { name: 'name', prompt: 'Title/Name: ', required: true },
    { name: 'category', prompt: 'Category (gaming|music|original): ', required: true },
    { name: 'type', prompt: 'Type (default: lighter): ', default: 'lighter' },
    { name: 'color', prompt: 'Color (chrome|black|other): ', required: true },
    { name: 'theme', prompt: 'Theme (horror|electronic|fantasy|funny|other): ', required: true },
    { name: 'price', prompt: 'Original Price (e.g., 30): ', required: true },
    { name: 'inStock', prompt: 'In Stock? (y/n): ', required: true },
    { name: 'description', prompt: 'Short Description: ', required: true },
    { name: 'longDescription', prompt: 'Long Description (optional): ' },
    { name: 'imagePaths', prompt: 'Image file paths (comma-separated): ', required: true }
  ]);

  const slug = slugify(answers.name);
  const listingDir = path.join(root, 'images', 'listings', `${String(id).padStart(3, '0')}-${slug}`);
  ensureDir(listingDir);
  ensureDir(path.join(root, 'images', 'barcodes'));

  const sourceImages = answers.imagePaths.split(',').map(s => s.trim()).filter(Boolean);
  if (sourceImages.length === 0) {
    console.error('At least one image path is required.');
    process.exit(1);
  }

  const images = [];
  for (let i = 0; i < sourceImages.length; i++) {
    const src = path.isAbsolute(sourceImages[i]) ? sourceImages[i] : path.join(root, sourceImages[i]);
    if (!fs.existsSync(src)) {
      console.warn(`Warning: image not found, skipping: ${sourceImages[i]}`);
      continue;
    }
    const ext = path.extname(src) || '.jpg';
    const destName = `${String(id).padStart(3, '0')}_${slug}_${i + 1}${ext}`;
    const dest = path.join(listingDir, destName);
    copyFileSafe(src, dest);
    images.push(path.relative(root, dest).replace(/\\/g, '/'));
  }

  if (images.length === 0) {
    console.error('No valid images were copied. Aborting.');
    process.exit(1);
  }

  const product = {
    id,
    name: answers.name,
    originalPrice: Number(answers.price),
    salePrice: null,
    description: answers.description,
    longDescription: answers.longDescription || undefined,
    images,
    category: answers.category,
    type: answers.type || 'lighter',
    color: answers.color,
    theme: answers.theme,
    inStock: /^y(es)?$/i.test(answers.inStock),
    barcode: `images/barcodes/${String(id).padStart(3, '0')}.jpeg`
  };

  data.products.push(product);
  data.products.sort((a, b) => a.id - b.id);
  writeJson(productsPath, data);

  // Also drop a metadata file in the listing folder for reference
  const meta = {
    id,
    slug,
    createdAt: new Date().toISOString(),
    product
  };
  writeJson(path.join(listingDir, 'metadata.json'), meta);

  console.log('\n✅ New listing created!');
  console.log(`- Images folder: ${path.relative(root, listingDir)}`);
  console.log(`- Updated: products.json (added id ${id})`);
  console.log('\nNext steps:');
  console.log('- Place a barcode image at: ' + product.barcode);
  console.log('- Optionally run generator: npm run generate:listings');
  console.log('- Review outputs in dist/listings/');
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
