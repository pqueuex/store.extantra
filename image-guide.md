# Adding Images to Product Listings

## Method 1: Basic Image Replacement (What I just implemented)

### Step 1: Create an images folder
```bash
mkdir images
```

### Step 2: Add your product images to the folder
- `images/product1.jpg`
- `images/product2.jpg` 
- `images/product3.jpg`
- etc.

### Step 3: Replace the placeholder text with img tags
Replace `Product Image` text with:
```html
<img src="images/product1.jpg" alt="Product Name" class="product-img">
```

## Method 2: Multiple Images with Navigation (Advanced)

### Update JavaScript to handle multiple images per product:

```javascript
// Product data with multiple images
const products = [
    { 
        name: 'Sample Product Title', 
        price: 29.99,
        images: ['images/product1-1.jpg', 'images/product1-2.jpg', 'images/product1-3.jpg']
    },
    { 
        name: 'Another Product Name', 
        price: 45.00,
        images: ['images/product2-1.jpg', 'images/product2-2.jpg']
    }
    // ... more products
];

// Track current image index for each product
let currentImageIndex = [];

// Initialize image indices
function initializeImages() {
    currentImageIndex = new Array(products.length).fill(0);
    updateAllProductImages();
}

// Update all product images on page load
function updateAllProductImages() {
    products.forEach((product, index) => {
        const imgElement = document.querySelector(`#product-${index} .product-img`);
        if (imgElement && product.images.length > 0) {
            imgElement.src = product.images[currentImageIndex[index]];
        }
    });
}

// Navigate to previous image
function previousImage(productIndex) {
    const product = products[productIndex];
    if (product.images.length > 1) {
        currentImageIndex[productIndex] = 
            (currentImageIndex[productIndex] - 1 + product.images.length) % product.images.length;
        updateProductImage(productIndex);
    }
}

// Navigate to next image
function nextImage(productIndex) {
    const product = products[productIndex];
    if (product.images.length > 1) {
        currentImageIndex[productIndex] = 
            (currentImageIndex[productIndex] + 1) % product.images.length;
        updateProductImage(productIndex);
    }
}

// Update single product image
function updateProductImage(productIndex) {
    const product = products[productIndex];
    const imgElement = document.querySelector(`#product-${productIndex} .product-img`);
    if (imgElement) {
        imgElement.src = product.images[currentImageIndex[productIndex]];
    }
}
```

### Update HTML to use unique IDs:
```html
<div class="product-card" id="product-0">
    <div class="product-image" onclick="enlargeImage(0)">
        <img src="" alt="Product Name" class="product-img">
        <!-- navigation buttons -->
    </div>
</div>
```

## Method 3: Dynamic Loading from Database/API

```javascript
// Fetch products from API
async function loadProducts() {
    try {
        const response = await fetch('/api/products');
        const products = await response.json();
        renderProducts(products);
    } catch (error) {
        console.error('Error loading products:', error);
    }
}

// Render products dynamically
function renderProducts(products) {
    const productGrid = document.querySelector('.product-grid');
    productGrid.innerHTML = '';
    
    products.forEach((product, index) => {
        const productCard = document.createElement('div');
        productCard.className = 'product-card';
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
            <div class="barcode-space">||||| ||| ||</div>
        `;
        productGrid.appendChild(productCard);
    });
}
```

## Recommended Image Specifications

### File Formats:
- **JPEG (.jpg)**: Best for photos
- **PNG (.png)**: Best for graphics with transparency
- **WebP (.webp)**: Modern format, smaller file sizes

### Image Dimensions:
- **Product thumbnails**: 400x400px (square)
- **Enlarged modal**: 800x800px or larger
- **File size**: Keep under 500KB for fast loading

### Folder Structure:
```
/images/
  /products/
    /product1/
      - main.jpg
      - angle1.jpg
      - angle2.jpg
      - detail.jpg
    /product2/
      - main.jpg
      - side.jpg
```

## Quick Start (Simplest Method):

1. Create `images` folder in your project
2. Add product images named `product1.jpg`, `product2.jpg`, etc.
3. Replace placeholder text with img tags (already done for Product 1)
4. Repeat for other products

The CSS is already set up to make images fit perfectly in the product cards!
