// Shopping Cart Management for EXTANTRA Store
class ShoppingCart {
    constructor() {
        this.items = [];
        this.loadCartFromStorage();
        this.updateCartDisplay();
    }

    // Add item to cart
    addItem(productId, options = {}, quantity = 1) {
        const product = getProduct(productId);
        if (!product) {
            console.error('Product not found:', productId);
            return false;
        }

        // Create unique item ID based on product and options
        const itemId = this.generateItemId(productId, options);
        const price = calculateProductPrice(product, options);
        
        // Check if item already exists
        const existingItem = this.items.find(item => item.id === itemId);
        
        if (existingItem) {
            existingItem.quantity += quantity;
        } else {
            this.items.push({
                id: itemId,
                productId,
                name: product.name,
                price,
                options,
                quantity,
                image: product.images[0]
            });
        }
        
        this.saveCartToStorage();
        this.updateCartDisplay();
        this.showCartNotification(`${product.name} added to cart`);
        return true;
    }

    // Remove item from cart
    removeItem(itemId) {
        this.items = this.items.filter(item => item.id !== itemId);
        this.saveCartToStorage();
        this.updateCartDisplay();
    }

    // Update item quantity
    updateQuantity(itemId, quantity) {
        const item = this.items.find(item => item.id === itemId);
        if (item) {
            if (quantity <= 0) {
                this.removeItem(itemId);
            } else {
                item.quantity = quantity;
                this.saveCartToStorage();
                this.updateCartDisplay();
            }
        }
    }

    // Clear entire cart
    clearCart() {
        this.items = [];
        this.saveCartToStorage();
        this.updateCartDisplay();
    }

    // Get cart totals
    getCartTotals() {
        const subtotal = this.items.reduce((total, item) => total + (item.price * item.quantity), 0);
        const tax = subtotal * 0.08; // 8% tax rate
        const shipping = this.calculateShipping(subtotal);
        const total = subtotal + tax + shipping;

        return {
            subtotal: subtotal.toFixed(2),
            tax: tax.toFixed(2),
            shipping: shipping.toFixed(2),
            total: total.toFixed(2),
            itemCount: this.items.reduce((count, item) => count + item.quantity, 0)
        };
    }

    // Calculate shipping cost
    calculateShipping(subtotal) {
        if (subtotal >= 50) return 0; // Free shipping over $50
        if (subtotal >= 25) return 5; // $5 shipping for orders $25-$49
        return 8; // $8 shipping for orders under $25
    }

    // Generate unique item ID
    generateItemId(productId, options) {
        const optionsString = Object.keys(options)
            .sort()
            .map(key => `${key}:${options[key]}`)
            .join('|');
        return `${productId}-${btoa(optionsString)}`;
    }

    // Save cart to localStorage
    saveCartToStorage() {
        try {
            localStorage.setItem('extantra_cart', JSON.stringify(this.items));
        } catch (error) {
            console.error('Error saving cart to storage:', error);
        }
    }

    // Load cart from localStorage
    loadCartFromStorage() {
        try {
            const savedCart = localStorage.getItem('extantra_cart');
            if (savedCart) {
                this.items = JSON.parse(savedCart);
            }
        } catch (error) {
            console.error('Error loading cart from storage:', error);
            this.items = [];
        }
    }

    // Update cart display in UI
    updateCartDisplay() {
        const cartCount = document.getElementById('cart-count');
        const cartItems = document.getElementById('cart-items');
        const cartTotal = document.getElementById('cart-total');
        
        const totals = this.getCartTotals();
        
        // Update cart count
        if (cartCount) {
            cartCount.textContent = totals.itemCount;
        }

        // Update cart items display
        if (cartItems) {
            if (this.items.length === 0) {
                cartItems.innerHTML = '<div class="empty-cart">Your cart is empty</div>';
                if (cartTotal) cartTotal.style.display = 'none';
            } else {
                cartItems.innerHTML = this.items.map(item => this.renderCartItem(item)).join('');
                if (cartTotal) {
                    cartTotal.style.display = 'block';
                    this.updateCartTotals(totals);
                }
            }
        }
    }

    // Render individual cart item
    renderCartItem(item) {
        const optionsText = Object.keys(item.options)
            .map(key => `${key}: ${item.options[key]}`)
            .join(', ');

        return `
            <div class="cart-item" data-item-id="${item.id}">
                <div class="cart-item-info">
                    <div class="cart-item-name">${item.name}</div>
                    <div class="cart-item-price">$${item.price.toFixed(2)} each</div>
                    ${optionsText ? `<div class="cart-item-options">${optionsText}</div>` : ''}
                </div>
                <div class="cart-item-controls">
                    <button class="quantity-btn" onclick="cart.updateQuantity('${item.id}', ${item.quantity - 1})">-</button>
                    <span class="quantity">${item.quantity}</span>
                    <button class="quantity-btn" onclick="cart.updateQuantity('${item.id}', ${item.quantity + 1})">+</button>
                    <button class="remove-btn" onclick="cart.removeItem('${item.id}')" title="Remove item">🗑</button>
                </div>
            </div>
        `;
    }

    // Update cart totals display
    updateCartTotals(totals) {
        const subtotalAmount = document.getElementById('subtotal-amount');
        const taxAmount = document.getElementById('tax-amount');
        const shippingAmount = document.getElementById('shipping-amount');
        const totalAmount = document.getElementById('total-amount');

        if (subtotalAmount) subtotalAmount.textContent = totals.subtotal;
        if (taxAmount) taxAmount.textContent = totals.tax;
        if (totalAmount) totalAmount.textContent = totals.total;
        
        if (shippingAmount) {
            if (parseFloat(totals.shipping) === 0) {
                shippingAmount.textContent = 'FREE';
            } else {
                shippingAmount.textContent = `$${totals.shipping}`;
            }
        }
    }

    // Show cart notification
    showCartNotification(message) {
        const notification = document.createElement('div');
        notification.className = 'cart-notification';
        notification.textContent = message;
        notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: #ffffff;
            color: #000000;
            padding: 10px 20px;
            border: 2px solid #000000;
            z-index: 10000;
            font-size: 12px;
            font-weight: 600;
            text-transform: uppercase;
            letter-spacing: 1px;
            animation: slideInRight 0.3s ease;
        `;

        document.body.appendChild(notification);

        // Add animation styles if not already added
        if (!document.getElementById('cart-notification-styles')) {
            const style = document.createElement('style');
            style.id = 'cart-notification-styles';
            style.textContent = `
                @keyframes slideInRight {
                    from { transform: translateX(100%); opacity: 0; }
                    to { transform: translateX(0); opacity: 1; }
                }
                @keyframes fadeOut {
                    from { opacity: 1; }
                    to { opacity: 0; }
                }
            `;
            document.head.appendChild(style);
        }

        // Remove notification after 3 seconds
        setTimeout(() => {
            notification.style.animation = 'fadeOut 0.3s ease';
            setTimeout(() => {
                if (notification.parentNode) {
                    notification.parentNode.removeChild(notification);
                }
            }, 300);
        }, 3000);
    }

    // Get cart data for checkout
    getCartData() {
        return {
            items: this.items,
            totals: this.getCartTotals()
        };
    }
}

// Initialize cart
const cart = new ShoppingCart();

// Cart UI functions
function openCart() {
    const cartModal = document.getElementById('cart-modal');
    if (cartModal) {
        cartModal.classList.add('show');
        cartModal.style.display = 'flex';
    }
}

function closeCart() {
    const cartModal = document.getElementById('cart-modal');
    if (cartModal) {
        cartModal.classList.remove('show');
        cartModal.style.display = 'none';
    }
}

function proceedToCheckout() {
    if (cart.items.length === 0) {
        showError('Your cart is empty!');
        return;
    }
    closeCart();
    openCheckout();
}

// Product detail modal functions
let currentProductOptions = {};

function showProductDetail(productId) {
    const product = getProduct(productId);
    if (!product) return;

    const modal = document.getElementById('product-modal');
    const content = document.getElementById('product-detail-content');
    
    if (!modal || !content) return;

    // Reset options
    currentProductOptions = {};
    
    content.innerHTML = `
        <div class="product-detail">
            <div class="product-detail-image">${product.images[0]}</div>
            <div class="product-detail-name">${product.name}</div>
            <div class="product-detail-price" id="current-price">${getPriceRange(product)}</div>
            <div class="product-description">${product.description}</div>
            ${renderProductOptions(product)}
            <button class="add-to-cart-btn" onclick="addCurrentProductToCart('${productId}')">
                Add to Cart - <span id="add-to-cart-price">${formatPrice(product.basePrice)}</span>
            </button>
        </div>
    `;

    modal.classList.add('show');
    modal.style.display = 'flex';
}

function renderProductOptions(product) {
    if (!product.options) return '';

    return `
        <div class="product-options">
            ${Object.keys(product.options).map(optionType => `
                <div class="option-group">
                    <label class="option-label">${optionType.charAt(0).toUpperCase() + optionType.slice(1)}:</label>
                    <div class="option-buttons">
                        ${product.options[optionType].map(option => `
                            <button class="option-btn" 
                                onclick="selectOption('${optionType}', '${option.name}', ${option.price || product.basePrice}, '${product.id}')"
                                data-option-type="${optionType}" 
                                data-option-value="${option.name}">
                                ${option.name}
                                ${option.price && option.price !== product.basePrice ? ` (+${formatPrice(option.price - product.basePrice)})` : ''}
                            </button>
                        `).join('')}
                    </div>
                </div>
            `).join('')}
        </div>
    `;
}

function selectOption(optionType, optionValue, price, productId) {
    // Update selected option
    currentProductOptions[optionType] = optionValue;
    
    // Update button states
    const buttons = document.querySelectorAll(`[data-option-type="${optionType}"]`);
    buttons.forEach(btn => btn.classList.remove('selected'));
    
    const selectedButton = document.querySelector(`[data-option-type="${optionType}"][data-option-value="${optionValue}"]`);
    if (selectedButton) {
        selectedButton.classList.add('selected');
    }
    
    // Update price display
    const product = getProduct(productId);
    const currentPrice = calculateProductPrice(product, currentProductOptions);
    
    const priceElement = document.getElementById('add-to-cart-price');
    if (priceElement) {
        priceElement.textContent = formatPrice(currentPrice);
    }
}

function addCurrentProductToCart(productId) {
    const product = getProduct(productId);
    if (!product) return;

    // Check if all required options are selected
    if (product.options) {
        const requiredOptions = Object.keys(product.options);
        const selectedOptions = Object.keys(currentProductOptions);
        
        for (let option of requiredOptions) {
            if (!currentProductOptions[option]) {
                showError(`Please select ${option}`);
                return;
            }
        }
    }

    cart.addItem(productId, currentProductOptions, 1);
    closeProductModal();
}

function closeProductModal() {
    const modal = document.getElementById('product-modal');
    if (modal) {
        modal.classList.remove('show');
        modal.style.display = 'none';
    }
    currentProductOptions = {};
}

// Error handling
function showError(message) {
    const modal = document.getElementById('error-modal');
    const messageElement = document.getElementById('error-message');
    
    if (modal && messageElement) {
        messageElement.textContent = message;
        modal.classList.add('show');
        modal.style.display = 'flex';
    }
}

function closeErrorModal() {
    const modal = document.getElementById('error-modal');
    if (modal) {
        modal.classList.remove('show');
        modal.style.display = 'none';
    }
}

// Close modals when clicking outside
document.addEventListener('click', function(event) {
    const modals = document.querySelectorAll('.modal');
    modals.forEach(modal => {
        if (event.target === modal) {
            modal.classList.remove('show');
            modal.style.display = 'none';
        }
    });
});

// Keyboard navigation
document.addEventListener('keydown', function(event) {
    if (event.key === 'Escape') {
        const visibleModal = document.querySelector('.modal.show');
        if (visibleModal) {
            visibleModal.classList.remove('show');
            visibleModal.style.display = 'none';
        }
    }
});