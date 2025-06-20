# Database Setup Guide for Dynamic Product Loading

## Option 1: JSON File Database (Simplest - No Server Required)

This is the easiest way to get started with dynamic loading without setting up a database server.

### Step 1: Create a products.json file

```json
{
  "products": [
    {
      "id": 1,
      "name": "Premium Lighter Model A",
      "price": 29.99,
      "description": "High-quality butane lighter with chrome finish",
      "images": [
        "images/IMG_2179.jpeg",
        "images/IMG_2180.jpeg"
      ],
      "category": "premium",
      "inStock": true,
      "barcode": "||||| ||| ||"
    },
    {
      "id": 2,
      "name": "Classic Zippo Style",
      "price": 45.00,
      "description": "Traditional flip-top design with windproof flame",
      "images": [
        "images/IMG_2181.jpeg",
        "images/IMG_2183.jpeg"
      ],
      "category": "classic",
      "inStock": true,
      "barcode": "||||| ||| ||"
    },
    {
      "id": 3,
      "name": "Modern Electric Lighter",
      "price": 19.95,
      "description": "USB rechargeable electric arc lighter",
      "images": [
        "images/IMG_2184.jpeg",
        "images/IMG_2185.jpeg"
      ],
      "category": "electric",
      "inStock": true,
      "barcode": "||||| ||| ||"
    }
  ]
}
```

### Step 2: Update your JavaScript to load from JSON

```javascript
// Global variables
let products = [];
let currentImageIndex = [];

// Load products from JSON file
async function loadProducts() {
    try {
        const response = await fetch('products.json');
        const data = await response.json();
        products = data.products;
        currentImageIndex = new Array(products.length).fill(0);
        renderProducts(products);
    } catch (error) {
        console.error('Error loading products:', error);
        // Fallback to hardcoded products if JSON fails
        loadFallbackProducts();
    }
}

// Fallback products if JSON loading fails
function loadFallbackProducts() {
    products = [
        { 
            id: 1,
            name: 'Sample Product Title', 
            price: 29.99,
            images: ['images/IMG_2179.jpeg']
        },
        // ... more fallback products
    ];
    currentImageIndex = new Array(products.length).fill(0);
    renderProducts(products);
}

// Your existing renderProducts function
function renderProducts(products) {
    const productGrid = document.querySelector('.product-grid');
    productGrid.innerHTML = '';
    
    products.forEach((product, index) => {
        const productCard = document.createElement('div');
        productCard.className = 'product-card';
        productCard.id = `product-${index}`;
        productCard.innerHTML = `
            <div class="product-image" onclick="enlargeImage(${index})">
                <img src="${product.images[0]}" alt="${product.name}" class="product-img">
                <div class="image-nav image-nav-left">
                    <button class="nav-button" onclick="event.stopPropagation(); previousImage(${index})">&lt;</button>
                </div>
                <div class="image-nav image-nav-right">
                    <button class="nav-button" onclick="event.stopPropagation(); nextImage(${index})">&gt;</button>
                </div>
            </div>
            <div class="product-title">${product.name}</div>
            <div class="product-price">$${product.price.toFixed(2)}</div>
            <button class="purchase-button" onclick="addToCart(${index})">Add to Cart</button>
            <div class="barcode-space">${product.barcode || '||||| ||| ||'}</div>
        `;
        productGrid.appendChild(productCard);
    });
}

// Update image navigation functions
function previousImage(productIndex) {
    const product = products[productIndex];
    if (product.images.length > 1) {
        currentImageIndex[productIndex] = 
            (currentImageIndex[productIndex] - 1 + product.images.length) % product.images.length;
        updateProductImage(productIndex);
    }
}

function nextImage(productIndex) {
    const product = products[productIndex];
    if (product.images.length > 1) {
        currentImageIndex[productIndex] = 
            (currentImageIndex[productIndex] + 1) % product.images.length;
        updateProductImage(productIndex);
    }
}

function updateProductImage(productIndex) {
    const product = products[productIndex];
    const imgElement = document.querySelector(`#product-${productIndex} .product-img`);
    if (imgElement) {
        imgElement.src = product.images[currentImageIndex[productIndex]];
    }
}

// Load products when page loads
document.addEventListener('DOMContentLoaded', function() {
    loadProducts();
});
```

---

## Option 2: SQLite Database (Local File Database)

If you want a real database but keep it simple, SQLite is perfect.

### Step 1: Install Node.js and setup

```bash
# Install Node.js (if not already installed)
# Download from https://nodejs.org/

# Initialize your project
npm init -y

# Install dependencies
npm install express sqlite3 cors
```

### Step 2: Create database setup script (setup-db.js)

```javascript
const sqlite3 = require('sqlite3').verbose();
const path = require('path');

// Create database
const db = new sqlite3.Database('products.db');

// Create products table
db.serialize(() => {
    db.run(`CREATE TABLE IF NOT EXISTS products (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        price REAL NOT NULL,
        description TEXT,
        category TEXT,
        in_stock BOOLEAN DEFAULT 1,
        barcode TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )`);

    db.run(`CREATE TABLE IF NOT EXISTS product_images (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        product_id INTEGER,
        image_path TEXT NOT NULL,
        is_primary BOOLEAN DEFAULT 0,
        sort_order INTEGER DEFAULT 0,
        FOREIGN KEY (product_id) REFERENCES products (id)
    )`);

    // Insert sample data
    const stmt = db.prepare(`INSERT INTO products (name, price, description, category, barcode) VALUES (?, ?, ?, ?, ?)`);
    
    stmt.run("Premium Lighter Model A", 29.99, "High-quality butane lighter with chrome finish", "premium", "||||| ||| ||");
    stmt.run("Classic Zippo Style", 45.00, "Traditional flip-top design with windproof flame", "classic", "||||| ||| ||");
    stmt.run("Modern Electric Lighter", 19.95, "USB rechargeable electric arc lighter", "electric", "||||| ||| ||");
    
    stmt.finalize();

    // Insert image data
    const imgStmt = db.prepare(`INSERT INTO product_images (product_id, image_path, is_primary, sort_order) VALUES (?, ?, ?, ?)`);
    
    imgStmt.run(1, "images/IMG_2179.jpeg", 1, 0);
    imgStmt.run(1, "images/IMG_2180.jpeg", 0, 1);
    imgStmt.run(2, "images/IMG_2181.jpeg", 1, 0);
    imgStmt.run(2, "images/IMG_2183.jpeg", 0, 1);
    imgStmt.run(3, "images/IMG_2184.jpeg", 1, 0);
    imgStmt.run(3, "images/IMG_2185.jpeg", 0, 1);
    
    imgStmt.finalize();
});

db.close();
console.log('Database setup complete!');
```

### Step 3: Create API server (server.js)

```javascript
const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const cors = require('cors');
const path = require('path');

const app = express();
const port = 3000;

// Enable CORS for your frontend
app.use(cors());
app.use(express.json());

// Serve static files (your HTML, CSS, images)
app.use(express.static('.'));

// Database connection
const db = new sqlite3.Database('products.db');

// API endpoint to get all products
app.get('/api/products', (req, res) => {
    const query = `
        SELECT 
            p.*,
            GROUP_CONCAT(pi.image_path ORDER BY pi.sort_order) as images
        FROM products p
        LEFT JOIN product_images pi ON p.id = pi.product_id
        WHERE p.in_stock = 1
        GROUP BY p.id
        ORDER BY p.id
    `;
    
    db.all(query, [], (err, rows) => {
        if (err) {
            res.status(500).json({ error: err.message });
            return;
        }
        
        // Format the data
        const products = rows.map(row => ({
            id: row.id,
            name: row.name,
            price: row.price,
            description: row.description,
            category: row.category,
            inStock: row.in_stock,
            barcode: row.barcode,
            images: row.images ? row.images.split(',') : []
        }));
        
        res.json({ products });
    });
});

// API endpoint to get single product
app.get('/api/products/:id', (req, res) => {
    const id = req.params.id;
    // Similar query but with WHERE clause
    // ... implementation
});

app.listen(port, () => {
    console.log(`Server running at http://localhost:${port}`);
});
```

### Step 4: Update your frontend JavaScript

```javascript
// Load products from API
async function loadProducts() {
    try {
        const response = await fetch('/api/products');
        const data = await response.json();
        products = data.products;
        currentImageIndex = new Array(products.length).fill(0);
        renderProducts(products);
    } catch (error) {
        console.error('Error loading products:', error);
    }
}
```

### Step 5: Run the setup

```bash
# Setup database
node setup-db.js

# Start server
node server.js

# Visit http://localhost:3000
```

---

## Option 3: Firebase (Cloud Database - Free Tier)

### Step 1: Setup Firebase project

1. Go to https://firebase.google.com/
2. Create new project
3. Enable Firestore Database
4. Get your config

### Step 2: Add Firebase to your project

```html
<!-- Add to your HTML head -->
<script src="https://www.gstatic.com/firebasejs/9.0.0/firebase-app-compat.js"></script>
<script src="https://www.gstatic.com/firebasejs/9.0.0/firebase-firestore-compat.js"></script>
```

### Step 3: Initialize Firebase

```javascript
// Firebase config (replace with your config)
const firebaseConfig = {
    // Your config here
};

firebase.initializeApp(firebaseConfig);
const db = firebase.firestore();

// Load products from Firestore
async function loadProducts() {
    try {
        const snapshot = await db.collection('products').get();
        products = [];
        snapshot.forEach(doc => {
            products.push({ id: doc.id, ...doc.data() });
        });
        currentImageIndex = new Array(products.length).fill(0);
        renderProducts(products);
    } catch (error) {
        console.error('Error loading products:', error);
    }
}
```

---

## Recommendation

**Start with Option 1 (JSON file)** - it's the simplest and requires no server setup. You can easily manage your products by editing the JSON file.

**Upgrade to Option 2 (SQLite)** when you need:
- Better data management
- Search/filtering capabilities
- Admin interface to add/edit products

**Use Option 3 (Firebase)** if you want:
- Cloud hosting
- Real-time updates
- User authentication
- Automatic scaling

Would you like me to implement any of these options for your current setup?
