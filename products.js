// Product Database for EXTANTRA Store
const PRODUCTS = {
    // Art Prints
    'paper-print': {
        id: 'paper-print',
        name: 'Paper Print',
        category: 'prints',
        basePrice: 15,
        description: 'High-quality paper prints available in various sizes. Premium archival paper with vibrant colors that last. Perfect for framing and display in any room.',
        options: {
            size: [
                { name: '8x10', price: 15 },
                { name: '11x14', price: 25 },
                { name: '16x20', price: 45 }
            ]
        },
        images: ['📄'],
        featured: false
    },
    'canvas-print': {
        id: 'canvas-print',
        name: 'Canvas Print',
        category: 'prints',
        basePrice: 35,
        description: 'Premium canvas prints with gallery wrap. Museum-quality canvas with UV-resistant inks. Comes ready to hang with sturdy wooden frame.',
        options: {
            size: [
                { name: '12x16', price: 35 },
                { name: '16x20', price: 55 },
                { name: '20x24', price: 85 }
            ]
        },
        images: ['🎨'],
        featured: false
    },
    'woodblock-print': {
        id: 'woodblock-print',
        name: 'Woodblock Print',
        category: 'prints',
        basePrice: 25,
        description: 'Traditional woodblock prints with unique texture and character. Hand-carved blocks create distinctive impressions that make each print unique.',
        options: {
            size: [
                { name: '8x10', price: 25 },
                { name: '11x14', price: 45 },
                { name: '16x20', price: 65 }
            ]
        },
        images: ['🪵'],
        featured: false
    },
    'metal-print': {
        id: 'metal-print',
        name: 'Metal Print',
        category: 'prints',
        basePrice: 45,
        description: 'Modern metal prints with vibrant colors and sleek finish. Aluminum substrate with high-gloss coating creates stunning depth and luminosity.',
        options: {
            size: [
                { name: '12x16', price: 45 },
                { name: '16x20', price: 75 },
                { name: '20x24', price: 120 }
            ]
        },
        images: ['⚡'],
        featured: false
    },

    // T-Shirts
    'woodblock-tshirt': {
        id: 'woodblock-tshirt',
        name: 'Woodblock T-Shirt',
        category: 'shirts',
        basePrice: 35,
        description: 'Hand-printed classic fit t-shirt made with organic cotton. Each shirt features unique woodblock printing technique, making every piece one-of-a-kind.',
        options: {
            size: [
                { name: 'S', price: 35 },
                { name: 'M', price: 35 },
                { name: 'L', price: 35 },
                { name: 'XL', price: 35 },
                { name: 'XXL', price: 35 }
            ],
            color: [
                { name: 'Black', price: 0 },
                { name: 'White', price: 0 }
            ]
        },
        images: ['👕'],
        featured: false
    },
    'vintage-tshirt': {
        id: 'vintage-tshirt',
        name: 'Vintage T-Shirt',
        category: 'shirts',
        basePrice: 38,
        description: 'Vintage-style t-shirt with distressed woodblock print. Soft-washed cotton with a lived-in feel and unique aging process.',
        options: {
            size: [
                { name: 'S', price: 38 },
                { name: 'M', price: 38 },
                { name: 'L', price: 38 },
                { name: 'XL', price: 38 },
                { name: 'XXL', price: 38 }
            ],
            color: [
                { name: 'Charcoal', price: 0 },
                { name: 'Stone', price: 0 }
            ]
        },
        images: ['🎽'],
        featured: false
    },
    'premium-tshirt': {
        id: 'premium-tshirt',
        name: 'Premium T-Shirt',
        category: 'shirts',
        basePrice: 45,
        description: 'Premium quality fabric with superior woodblock printing. Triple-blend material for ultimate comfort and durability.',
        options: {
            size: [
                { name: 'S', price: 45 },
                { name: 'M', price: 45 },
                { name: 'L', price: 45 },
                { name: 'XL', price: 45 },
                { name: 'XXL', price: 45 }
            ],
            color: [
                { name: 'Black', price: 0 },
                { name: 'White', price: 0 },
                { name: 'Navy', price: 0 }
            ]
        },
        images: ['🥽'],
        featured: false
    },
    'long-sleeve-tshirt': {
        id: 'long-sleeve-tshirt',
        name: 'Long Sleeve T-Shirt',
        category: 'shirts',
        basePrice: 42,
        description: 'Long sleeve version of our classic woodblock tee. Perfect for cooler weather while maintaining the artistic aesthetic.',
        options: {
            size: [
                { name: 'S', price: 42 },
                { name: 'M', price: 42 },
                { name: 'L', price: 42 },
                { name: 'XL', price: 42 },
                { name: 'XXL', price: 42 }
            ],
            color: [
                { name: 'Black', price: 0 },
                { name: 'White', price: 0 }
            ]
        },
        images: ['🧥'],
        featured: false
    },

    // Accessories
    'custom-zippo': {
        id: 'custom-zippo',
        name: 'Custom Zippo',
        category: 'accessories',
        basePrice: 25,
        description: 'Personalized Zippo lighter with custom engraving options. Genuine Zippo windproof design with lifetime warranty. Choose from various finishes and custom text.',
        options: {
            finish: [
                { name: 'Chrome', price: 25 },
                { name: 'Brushed Chrome', price: 30 },
                { name: 'Black Matte', price: 35 }
            ]
        },
        images: ['🔥'],
        featured: false
    },
    'hip-flask': {
        id: 'hip-flask',
        name: 'Hip Flask',
        category: 'accessories',
        basePrice: 30,
        description: 'Stainless steel hip flask with custom design options. Food-grade stainless steel construction with leak-proof cap. Perfect for outdoor adventures.',
        options: {
            size: [
                { name: '6oz', price: 30 },
                { name: '8oz', price: 40 },
                { name: '10oz', price: 45 }
            ]
        },
        images: ['🍺'],
        featured: false
    },
    'zippo-flask-set': {
        id: 'zippo-flask-set',
        name: 'Zippo + Flask Set',
        category: 'accessories',
        basePrice: 45,
        originalPrice: 60,
        description: 'Complete set with matching Zippo and flask. Limited time offer with 25% savings! Both items feature coordinated designs and come in premium gift packaging.',
        options: {
            style: [
                { name: 'Classic Set', price: 45 },
                { name: 'Premium Set', price: 65 }
            ]
        },
        images: ['🎁'],
        featured: true,
        sale: true,
        discount: 25
    },
    'pocket-knife': {
        id: 'pocket-knife',
        name: 'Custom Pocket Knife',
        category: 'accessories',
        basePrice: 35,
        description: 'High-quality pocket knife with custom engraving. Stainless steel blade with ergonomic handle design. Perfect EDC companion.',
        options: {
            blade: [
                { name: 'Standard', price: 35 },
                { name: 'Serrated', price: 40 },
                { name: 'Tanto Point', price: 42 }
            ]
        },
        images: ['🔪'],
        featured: false
    },

    // Sticker Packs
    'mini-pack': {
        id: 'mini-pack',
        name: 'Mini Pack (5)',
        category: 'stickers',
        basePrice: 8,
        description: 'Five carefully selected stickers in a variety pack. High-quality vinyl stickers that are waterproof and fade-resistant. Perfect starter pack.',
        images: ['📋'],
        featured: false
    },
    'standard-pack': {
        id: 'standard-pack',
        name: 'Standard Pack (10)',
        category: 'stickers',
        basePrice: 15,
        description: 'Ten premium stickers featuring our best designs. Mix of sizes and styles including exclusive designs not available individually.',
        images: ['📋'],
        featured: false
    },
    'mega-pack': {
        id: 'mega-pack',
        name: 'Mega Pack (20)',
        category: 'stickers',
        basePrice: 25,
        description: 'Twenty stickers including exclusive designs and limited editions. Best value pack with rare designs and special finishes.',
        images: ['📋'],
        featured: false
    },
    'custom-pack': {
        id: 'custom-pack',
        name: 'Custom Pack',
        category: 'stickers',
        basePrice: 20,
        description: 'Personalized sticker pack with your choice of designs. Work with our team to create a unique collection that matches your style.',
        options: {
            quantity: [
                { name: '8 stickers', price: 20 },
                { name: '12 stickers', price: 28 },
                { name: '16 stickers', price: 35 }
            ]
        },
        images: ['🎨'],
        featured: false
    }
};

// Get product by ID
function getProduct(productId) {
    return PRODUCTS[productId] || null;
}

// Get products by category
function getProductsByCategory(category) {
    return Object.values(PRODUCTS).filter(product => product.category === category);
}

// Get all products
function getAllProducts() {
    return Object.values(PRODUCTS);
}

// Get featured products
function getFeaturedProducts() {
    return Object.values(PRODUCTS).filter(product => product.featured);
}

// Calculate product price with options
function calculateProductPrice(product, selectedOptions = {}) {
    let totalPrice = product.basePrice;
    
    if (product.options) {
        Object.keys(selectedOptions).forEach(optionType => {
            const selectedValue = selectedOptions[optionType];
            const option = product.options[optionType];
            if (option) {
                const selectedOption = option.find(opt => opt.name === selectedValue);
                if (selectedOption) {
                    totalPrice = selectedOption.price || totalPrice;
                }
            }
        });
    }
    
    return totalPrice;
}

// Format price for display
function formatPrice(price) {
    return `$${price.toFixed(2)}`;
}

// Get price range for products with options
function getPriceRange(product) {
    if (!product.options) {
        return formatPrice(product.basePrice);
    }
    
    let minPrice = product.basePrice;
    let maxPrice = product.basePrice;
    
    Object.values(product.options).forEach(optionGroup => {
        optionGroup.forEach(option => {
            if (option.price) {
                minPrice = Math.min(minPrice, option.price);
                maxPrice = Math.max(maxPrice, option.price);
            }
        });
    });
    
    if (minPrice === maxPrice) {
        return formatPrice(minPrice);
    }
    
    return `${formatPrice(minPrice)} - ${formatPrice(maxPrice)}`;
}

// Search products
function searchProducts(query) {
    const searchTerm = query.toLowerCase();
    return Object.values(PRODUCTS).filter(product => 
        product.name.toLowerCase().includes(searchTerm) ||
        product.description.toLowerCase().includes(searchTerm) ||
        product.category.toLowerCase().includes(searchTerm)
    );
}

// Export for use in other files
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        PRODUCTS,
        getProduct,
        getProductsByCategory,
        getAllProducts,
        getFeaturedProducts,
        calculateProductPrice,
        formatPrice,
        getPriceRange,
        searchProducts
    };
}

// Product Modal Functionality
function openProductModal(productId) {
    const product = getProduct(productId);
    if (!product) {
        console.error('Product not found:', productId);
        return;
    }
    
    const modal = document.getElementById('product-modal');
    const content = document.getElementById('product-detail-content');
    
    if (!modal || !content) {
        console.error('Product modal elements not found');
        return;
    }
    
    // Generate product detail HTML
    content.innerHTML = generateProductDetailHTML(product);
    
    // Show modal
    modal.style.display = 'flex';
    document.body.style.overflow = 'hidden';
    
    // Initialize product options
    initializeProductOptions(product);
}

function generateProductDetailHTML(product) {
    const priceRange = getPriceRange(product);
    const isOnSale = product.sale && product.originalPrice;
    
    let priceHTML = '';
    if (isOnSale) {
        priceHTML = `
            <div class="product-price-container">
                <span class="original-price">$${product.originalPrice}</span>
                <span class="sale-price">${priceRange}</span>
                <span class="discount-badge">${product.discount}% OFF</span>
            </div>
        `;
    } else {
        priceHTML = `<div class="product-price">${priceRange}</div>`;
    }
    
    let optionsHTML = '';
    if (product.options) {
        optionsHTML = '<div class="product-options">';
        
        Object.keys(product.options).forEach(optionType => {
            const options = product.options[optionType];
            optionsHTML += `
                <div class="option-group">
                    <label class="option-label">${capitalizeFirst(optionType)}:</label>
                    <select class="option-select" data-option="${optionType}" onchange="updateProductPrice('${product.id}')">
                        ${options.map(option => 
                            `<option value="${option.name}" data-price="${option.price || product.basePrice}">
                                ${option.name}${option.price && option.price !== product.basePrice ? ` (+$${(option.price - product.basePrice).toFixed(2)})` : ''}
                            </option>`
                        ).join('')}
                    </select>
                </div>
            `;
        });
        
        optionsHTML += '</div>';
    }
    
    return `
        <div class="product-detail">
            <div class="product-image-large">${product.images[0]}</div>
            <div class="product-info">
                <h2 class="product-title">${product.name}</h2>
                ${priceHTML}
                <div class="product-description">${product.description}</div>
                ${optionsHTML}
                <div class="quantity-selector">
                    <label for="quantity">Quantity:</label>
                    <input type="number" id="quantity" min="1" max="10" value="1">
                </div>
                <button class="add-to-cart-btn" onclick="addToCartFromModal('${product.id}')">
                    Add to Cart
                </button>
            </div>
        </div>
    `;
}

function initializeProductOptions(product) {
    // Set default selected options
    if (product.options) {
        Object.keys(product.options).forEach(optionType => {
            const select = document.querySelector(`[data-option="${optionType}"]`);
            if (select && select.options.length > 0) {
                select.selectedIndex = 0;
            }
        });
    }
    
    // Update initial price display
    updateProductPrice(product.id);
}

function updateProductPrice(productId) {
    const product = getProduct(productId);
    if (!product) return;
    
    const selectedOptions = {};
    
    // Get all selected options
    const optionSelects = document.querySelectorAll('.option-select');
    optionSelects.forEach(select => {
        const optionType = select.dataset.option;
        selectedOptions[optionType] = select.value;
    });
    
    // Calculate new price
    const totalPrice = calculateProductPrice(product, selectedOptions);
    
    // Update price display
    const priceContainer = document.querySelector('.product-price, .sale-price');
    if (priceContainer) {
        priceContainer.textContent = formatPrice(totalPrice);
    }
}

function addToCartFromModal(productId) {
    const product = getProduct(productId);
    if (!product) return;
    
    // Get selected options
    const selectedOptions = {};
    const optionSelects = document.querySelectorAll('.option-select');
    optionSelects.forEach(select => {
        const optionType = select.dataset.option;
        selectedOptions[optionType] = select.value;
    });
    
    // Get quantity
    const quantityInput = document.getElementById('quantity');
    const quantity = parseInt(quantityInput?.value) || 1;
    
    // Add to cart using the cart class method
    if (typeof cart !== 'undefined' && cart.addItem) {
        cart.addItem(productId, selectedOptions, quantity);
    } else {
        console.error('Cart not found');
    }
    
    // Close modal
    closeProductModal();
}

function showAddToCartSuccess(productName, quantity) {
    // Simple success notification
    const notification = document.createElement('div');
    notification.className = 'cart-notification';
    notification.innerHTML = `
        <div class="notification-content">
            ✓ Added ${quantity} × ${productName} to cart
        </div>
    `;
    
    document.body.appendChild(notification);
    
    // Remove after 3 seconds
    setTimeout(() => {
        if (notification.parentNode) {
            notification.parentNode.removeChild(notification);
        }
    }, 3000);
}

function capitalizeFirst(str) {
    return str.charAt(0).toUpperCase() + str.slice(1);
}

function loadAllProducts() {
    const productsGrid = document.getElementById('products-grid');
    if (!productsGrid) return;
    
    const allProducts = getAllProducts();
    
    productsGrid.innerHTML = allProducts.map(product => `
        <div class="product-item" onclick="openProductModal('${product.id}')">
            <div class="product-image-placeholder">${product.images[0]}</div>
            <div class="product-name">${product.name}</div>
            <div class="product-price">${getPriceRange(product)}</div>
            ${product.sale ? '<div class="product-badge">SALE</div>' : ''}
        </div>
    `).join('');
}