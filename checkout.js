// Checkout System with Stripe Integration for EXTANTRA Store

// IMPORTANT: Replace this with your actual Stripe publishable key from your Stripe dashboard
// Get it from: https://dashboard.stripe.com/test/apikeys
// It should look like: pk_test_51Hxxx...
const STRIPE_PUBLISHABLE_KEY = 'pk_test_51RWLsCH1cwHoz8jU8jvxgUomjaDR5OpUsdwfdzcY0ChmBsNG7QJnp1QevvHer32AdAE6bTlP11GnHrOoQXz4EgW200BP0e21X7'; // ⚠️ REPLACE THIS WITH YOUR REAL STRIPE KEY
let stripe;
let elements;
let paymentElement;
let isStripeInitialized = false;

// Initialize Stripe when page loads
function initializeStripe() {
    return new Promise((resolve, reject) => {
        if (isStripeInitialized) {
            resolve(true);
            return;
        }

        // Check if Stripe is loaded
        if (typeof Stripe === 'undefined') {
            console.error('Stripe library not loaded');
            reject(new Error('Payment system unavailable. Please refresh the page.'));
            return;
        }

        try {
            stripe = Stripe(STRIPE_PUBLISHABLE_KEY);
            
            if (!stripe) {
                throw new Error('Failed to initialize Stripe');
            }

            elements = stripe.elements({
                appearance: {
                    theme: 'night',
                    variables: {
                        colorPrimary: '#ffffff',
                        colorBackground: '#000000',
                        colorText: '#ffffff',
                        colorDanger: '#df1b41',
                        fontFamily: 'Inter, Arial, sans-serif',
                        spacingUnit: '5px',
                        borderRadius: '0px'
                    }
                }
            });

            isStripeInitialized = true;
            console.log('Stripe initialized successfully');
            resolve(true);

        } catch (error) {
            console.error('Error initializing Stripe:', error);
            reject(error);
        }
    });
}

// Initialize Stripe on page load
document.addEventListener('DOMContentLoaded', () => {
    // Add a small delay to ensure Stripe library is fully loaded
    setTimeout(() => {
        initializeStripe().catch(error => {
            console.error('Failed to initialize payment system:', error);
        });
    }, 500);
});

// Checkout state management
class CheckoutManager {
    constructor() {
        this.currentStep = 1;
        this.customerInfo = {};
        this.shippingInfo = {};
        this.paymentIntentId = null;
        this.isProcessing = false;
        this.clientSecret = null;
    }

    // Initialize checkout
    async initialize() {
        try {
            // Ensure Stripe is initialized
            await initializeStripe();
            
            this.updateStepDisplay();
            this.renderOrderSummary();
            await this.createPaymentIntent();
            
        } catch (error) {
            console.error('Error initializing checkout:', error);
            showError('Failed to initialize payment system. Please refresh and try again.');
        }
    }

    // Create payment intent with Stripe
    async createPaymentIntent() {
        const cartData = cart.getCartData();
        const amount = Math.round(parseFloat(cartData.totals.total) * 100); // Convert to cents

        try {
            console.log('Creating payment intent for amount:', amount);
            
            // Ensure Stripe is ready
            if (!stripe || !elements) {
                await initializeStripe();
            }

            // In a real implementation, this would be an API call to your backend
            // For demo purposes, we'll create a simulated client secret
            this.clientSecret = `pi_test_${Date.now()}_secret_${Math.random().toString(36).substr(2, 9)}`;
            
            console.log('Payment intent created successfully');
            
        } catch (error) {
            console.error('Error creating payment intent:', error);
            throw new Error('Failed to initialize payment. Please try again.');
        }
    }

    // Update step display
    updateStepDisplay() {
        const steps = document.querySelectorAll('.step');
        steps.forEach((step, index) => {
            if (index + 1 === this.currentStep) {
                step.classList.add('active');
            } else {
                step.classList.remove('active');
            }
        });

        // Show/hide step content
        const stepContents = document.querySelectorAll('.checkout-step-content');
        stepContents.forEach((content, index) => {
            if (index + 1 === this.currentStep) {
                content.style.display = 'block';
            } else {
                content.style.display = 'none';
            }
        });
    }

    // Proceed to next step
    async nextStep() {
        if (this.isProcessing) return;

        // Validate current step
        if (!await this.validateCurrentStep()) {
            return;
        }

        if (this.currentStep < 3) {
            this.currentStep++;
            this.updateStepDisplay();
        } else {
            // Final step - process payment
            await this.processPayment();
        }
    }

    // Go to previous step
    previousStep() {
        if (this.currentStep > 1) {
            this.currentStep--;
            this.updateStepDisplay();
        }
    }

    // Validate current step
    async validateCurrentStep() {
        switch (this.currentStep) {
            case 1:
                return this.validateCustomerInfo();
            case 2:
                return this.validateShippingInfo();
            case 3:
                return true; // Payment validation happens during processing
            default:
                return false;
        }
    }

    // Validate customer information
    validateCustomerInfo() {
        const email = document.getElementById('customer-email')?.value;
        const firstName = document.getElementById('first-name')?.value;
        const lastName = document.getElementById('last-name')?.value;

        if (!email || !firstName || !lastName) {
            showError('Please fill in all required customer information fields.');
            return false;
        }

        if (!this.isValidEmail(email)) {
            showError('Please enter a valid email address.');
            return false;
        }

        this.customerInfo = { email, firstName, lastName };
        return true;
    }

    // Validate shipping information
    validateShippingInfo() {
        const address = document.getElementById('shipping-address')?.value;
        const city = document.getElementById('shipping-city')?.value;
        const state = document.getElementById('shipping-state')?.value;
        const zip = document.getElementById('shipping-zip')?.value;
        const country = document.getElementById('shipping-country')?.value;

        if (!address || !city || !state || !zip || !country) {
            showError('Please fill in all required shipping information fields.');
            return false;
        }

        this.shippingInfo = { address, city, state, zip, country };
        return true;
    }

    // Process payment
    async processPayment() {
        if (this.isProcessing) return;
        
        this.isProcessing = true;
        this.showProcessingState();

        try {
            // Ensure Stripe is initialized
            if (!stripe || !elements || !paymentElement) {
                throw new Error('Payment system not properly initialized');
            }

            // For demo purposes, simulate a successful payment
            // In production, you would use stripe.confirmPayment()
            console.log('Processing payment...');
            
            // Simulate payment processing delay
            await new Promise(resolve => setTimeout(resolve, 2000));
            
            // Simulate successful payment
            const mockPaymentIntent = {
                id: `pi_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
                status: 'succeeded'
            };

            console.log('Payment successful:', mockPaymentIntent.id);
            await this.completeOrder(mockPaymentIntent.id);

        } catch (error) {
            console.error('Payment error:', error);
            showError(error.message || 'Payment failed. Please try again.');
        } finally {
            this.isProcessing = false;
            this.hideProcessingState();
        }
    }

    // Complete order after successful payment
    async completeOrder(paymentIntentId) {
        const orderData = {
            paymentIntentId,
            customer: this.customerInfo,
            shipping: this.shippingInfo,
            items: cart.items,
            totals: cart.getCartTotals(),
            orderDate: new Date().toISOString(),
            orderNumber: this.generateOrderNumber()
        };

        try {
            // Send order confirmation emails
            await this.sendOrderEmails(orderData);
            
            // Clear cart
            cart.clearCart();
            
            // Show success modal
            this.showOrderSuccess(orderData);
            
        } catch (error) {
            console.error('Error completing order:', error);
            // Payment succeeded but order completion failed
            showError('Payment was successful, but there was an issue completing your order. Please contact support with payment ID: ' + paymentIntentId);
        }
    }

    // Generate unique order number
    generateOrderNumber() {
        const timestamp = Date.now();
        const random = Math.floor(Math.random() * 1000);
        return `EXT-${timestamp}-${random}`;
    }

    // Send order confirmation emails
    async sendOrderEmails(orderData) {
        // In a real implementation, this would call your backend API
        // For demo purposes, we'll simulate the email sending
        console.log('Sending order confirmation emails for order:', orderData.orderNumber);
        
        // Simulate API call
        return new Promise((resolve) => {
            setTimeout(() => {
                console.log('Order confirmation emails sent successfully');
                resolve();
            }, 1000);
        });
    }

    // Show processing state
    showProcessingState() {
        const submitBtn = document.getElementById('submit-payment-btn');
        if (submitBtn) {
            submitBtn.disabled = true;
            submitBtn.innerHTML = 'Processing Payment... <div class="loading-spinner"></div>';
        }
    }

    // Hide processing state
    hideProcessingState() {
        const submitBtn = document.getElementById('submit-payment-btn');
        if (submitBtn) {
            submitBtn.disabled = false;
            submitBtn.innerHTML = 'Complete Order';
        }
    }

    // Show order success
    showOrderSuccess(orderData) {
        closeCheckout();
        
        const modal = document.getElementById('success-modal');
        const content = document.getElementById('success-content');
        
        if (modal && content) {
            content.innerHTML = `
                <div class="success-content">
                    <div class="success-icon">✓</div>
                    <h2>Order Confirmed!</h2>
                    <p>Thank you for your purchase!</p>
                    <div class="order-details">
                        <p><strong>Order Number:</strong> ${orderData.orderNumber}</p>
                        <p><strong>Total:</strong> $${orderData.totals.total}</p>
                        <p><strong>Email:</strong> ${orderData.customer.email}</p>
                    </div>
                    <p class="order-note">You will receive an order confirmation email shortly.</p>
                    <button class="continue-btn" onclick="closeSuccessModal()">Continue Shopping</button>
                </div>
            `;
            modal.classList.add('show');
            modal.style.display = 'flex';
        }
    }

    // Render order summary
    renderOrderSummary() {
        const summaryContainer = document.getElementById('order-summary-items');
        const cartData = cart.getCartData();
        
        if (summaryContainer) {
            summaryContainer.innerHTML = cartData.items.map(item => `
                <div class="summary-item">
                    <span>${item.name} (${item.quantity})</span>
                    <span>$${(item.price * item.quantity).toFixed(2)}</span>
                </div>
            `).join('');
        }

        // Update totals
        const subtotalEl = document.getElementById('summary-subtotal');
        const taxEl = document.getElementById('summary-tax');
        const shippingEl = document.getElementById('summary-shipping');
        const totalEl = document.getElementById('summary-total');

        if (subtotalEl) subtotalEl.textContent = `$${cartData.totals.subtotal}`;
        if (taxEl) taxEl.textContent = `$${cartData.totals.tax}`;
        if (shippingEl) {
            const shipping = parseFloat(cartData.totals.shipping);
            shippingEl.textContent = shipping === 0 ? 'FREE' : `$${cartData.totals.shipping}`;
        }
        if (totalEl) totalEl.textContent = `$${cartData.totals.total}`;
    }

    // Email validation
    isValidEmail(email) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
    }
}

// Initialize checkout manager
let checkoutManager;

// Checkout UI functions
async function openCheckout() {
    try {
        const modal = document.getElementById('checkout-modal');
        modal.style.display = 'block';
        document.body.style.overflow = 'hidden';
        
        // Initialize checkout manager
        if (!checkoutManager) {
            checkoutManager = new CheckoutManager();
        }
        
        // Initialize checkout with proper error handling
        await initializeCheckout();
        
    } catch (error) {
        console.error('Error opening checkout:', error);
        showError('Failed to open checkout. Please try again.');
        closeCheckout();
    }
}

function closeCheckout() {
    const modal = document.getElementById('checkout-modal');
    modal.style.display = 'none';
    document.body.style.overflow = 'auto';
    
    // Reset checkout state
    if (checkoutManager) {
        checkoutManager.currentStep = 1;
        checkoutManager.updateStepDisplay();
    }
}

async function initializeCheckout() {
    try {
        if (!checkoutManager) {
            checkoutManager = new CheckoutManager();
        }
        
        checkoutManager.currentStep = 1;
        checkoutManager.updateStepDisplay();
        await showShippingForm();
        
    } catch (error) {
        console.error('Error initializing checkout:', error);
        throw error;
    }
}

async function showShippingForm() {
    const checkoutContent = document.getElementById('checkout-content');
    if (!checkoutContent) return;
    
    checkoutContent.innerHTML = `
        <div class="checkout-step-content" id="step-1">
            <div class="checkout-section">
                <h3>Customer Information</h3>
                <form class="checkout-form">
                    <div class="form-row">
                        <div class="form-group">
                            <label for="customer-email">Email *</label>
                            <input type="email" id="customer-email" required>
                        </div>
                    </div>
                    <div class="form-row">
                        <div class="form-group">
                            <label for="first-name">First Name *</label>
                            <input type="text" id="first-name" required>
                        </div>
                        <div class="form-group">
                            <label for="last-name">Last Name *</label>
                            <input type="text" id="last-name" required>
                        </div>
                    </div>
                </form>
            </div>
            
            <div class="checkout-section">
                <h3>Shipping Address</h3>
                <form class="checkout-form">
                    <div class="form-row">
                        <div class="form-group">
                            <label for="shipping-address">Address *</label>
                            <input type="text" id="shipping-address" required>
                        </div>
                    </div>
                    <div class="form-row">
                        <div class="form-group">
                            <label for="shipping-city">City *</label>
                            <input type="text" id="shipping-city" required>
                        </div>
                        <div class="form-group">
                            <label for="shipping-state">State *</label>
                            <select id="shipping-state" required>
                                <option value="">Select State</option>
                                <option value="FL">Florida</option>
                                <option value="CA">California</option>
                                <option value="NY">New York</option>
                                <option value="TX">Texas</option>
                            </select>
                        </div>
                        <div class="form-group">
                            <label for="shipping-zip">ZIP Code *</label>
                            <input type="text" id="shipping-zip" required>
                        </div>
                    </div>
                    <div class="form-row">
                        <div class="form-group">
                            <label for="shipping-country">Country *</label>
                            <select id="shipping-country" required>
                                <option value="US">United States</option>
                                <option value="CA">Canada</option>
                                <option value="GB">United Kingdom</option>
                            </select>
                        </div>
                    </div>
                </form>
            </div>
            
            <div class="order-summary">
                <h3>Order Summary</h3>
                <div id="order-summary-items"></div>
                <div class="summary-totals">
                    <div class="summary-row">
                        <span>Subtotal:</span>
                        <span id="summary-subtotal">$0.00</span>
                    </div>
                    <div class="summary-row">
                        <span>Tax:</span>
                        <span id="summary-tax">$0.00</span>
                    </div>
                    <div class="summary-row">
                        <span>Shipping:</span>
                        <span id="summary-shipping">FREE</span>
                    </div>
                    <div class="summary-row total">
                        <span>Total:</span>
                        <span id="summary-total">$0.00</span>
                    </div>
                </div>
            </div>
            
            <div class="checkout-actions">
                <button type="button" class="next-btn" onclick="proceedToPayment()">Continue to Payment</button>
            </div>
        </div>
    `;
    
    // Initialize checkout manager and render order summary
    if (!checkoutManager) {
        checkoutManager = new CheckoutManager();
    }
    
    try {
        await checkoutManager.initialize();
    } catch (error) {
        console.error('Error initializing checkout manager:', error);
        showError('Failed to initialize checkout. Please try again.');
    }
}

async function proceedToPayment() {
    if (!checkoutManager) {
        checkoutManager = new CheckoutManager();
    }
    
    try {
        // Validate shipping form
        if (!checkoutManager.validateCurrentStep()) {
            return;
        }
        
        // Show payment form
        await showPaymentForm();
        
        // Update step
        checkoutManager.currentStep = 2;
        checkoutManager.updateStepDisplay();
        
    } catch (error) {
        console.error('Error proceeding to payment:', error);
        showError('Failed to proceed to payment. Please try again.');
    }
}

async function showPaymentForm() {
    const checkoutContent = document.getElementById('checkout-content');
    if (!checkoutContent) return;
    
    checkoutContent.innerHTML = `
        <div class="checkout-step-content" id="step-2">
            <div class="checkout-section">
                <h3>Payment Information</h3>
                <div class="payment-status">
                    <div class="status-message">Initializing secure payment...</div>
                </div>
                <div id="payment-element" class="payment-element">
                    <!-- Stripe payment element will be mounted here -->
                </div>
                <div class="payment-notice">
                    <p>Your payment information is secure and encrypted.</p>
                </div>
            </div>
            
            <div class="order-summary">
                <h3>Order Summary</h3>
                <div id="order-summary-items-payment"></div>
                <div class="summary-totals">
                    <div class="summary-row">
                        <span>Subtotal:</span>
                        <span id="summary-subtotal-payment">$0.00</span>
                    </div>
                    <div class="summary-row">
                        <span>Tax:</span>
                        <span id="summary-tax-payment">$0.00</span>
                    </div>
                    <div class="summary-row">
                        <span>Shipping:</span>
                        <span id="summary-shipping-payment">FREE</span>
                    </div>
                    <div class="summary-row total">
                        <span>Total:</span>
                        <span id="summary-total-payment">$0.00</span>
                    </div>
                </div>
            </div>
            
            <div class="checkout-actions">
                <button type="button" class="back-btn" onclick="backToShipping()">Back to Shipping</button>
                <button type="button" class="submit-btn" id="submit-payment-btn" onclick="submitPayment()">Complete Order</button>
            </div>
        </div>
    `;
    
    // Render order summary for payment step
    checkoutManager.renderOrderSummary();
    
    // Update payment step summary
    const cartData = cart.getCartData();
    const paymentSummaryItems = document.getElementById('order-summary-items-payment');
    if (paymentSummaryItems) {
        paymentSummaryItems.innerHTML = cartData.items.map(item => `
            <div class="summary-item">
                <span>${item.name} (${item.quantity})</span>
                <span>$${(item.price * item.quantity).toFixed(2)}</span>
            </div>
        `).join('');
    }
    
    // Update payment totals
    document.getElementById('summary-subtotal-payment').textContent = `$${cartData.totals.subtotal}`;
    document.getElementById('summary-tax-payment').textContent = `$${cartData.totals.tax}`;
    document.getElementById('summary-shipping-payment').textContent = parseFloat(cartData.totals.shipping) === 0 ? 'FREE' : `$${cartData.totals.shipping}`;
    document.getElementById('summary-total-payment').textContent = `$${cartData.totals.total}`;
    
    try {
        // Initialize payment element
        await initializePaymentElement();
        
        // Update status
        const statusMessage = document.querySelector('.status-message');
        if (statusMessage) {
            statusMessage.textContent = 'Payment ready - Complete your order below';
            statusMessage.style.color = '#4caf50';
        }
        
    } catch (error) {
        console.error('Error initializing payment element:', error);
        const statusMessage = document.querySelector('.status-message');
        if (statusMessage) {
            statusMessage.textContent = 'Payment initialization failed - Please try again';
            statusMessage.style.color = '#f44336';
        }
        showError('Failed to initialize payment form. Please try again.');
    }
}

async function initializePaymentElement() {
    try {
        // Ensure Stripe is initialized
        await initializeStripe();
        
        if (!stripe || !elements) {
            throw new Error('Stripe not properly initialized');
        }
        
        // For demo purposes, create a simple payment form
        const paymentElementContainer = document.getElementById('payment-element');
        if (paymentElementContainer) {
            paymentElementContainer.innerHTML = `
                <div class="demo-payment-form">
                    <div class="form-group">
                        <label for="card-number">Card Number</label>
                        <input type="text" id="card-number" placeholder="1234 5678 9012 3456" maxlength="19">
                    </div>
                    <div class="form-row">
                        <div class="form-group">
                            <label for="card-expiry">Expiry</label>
                            <input type="text" id="card-expiry" placeholder="MM/YY" maxlength="5">
                        </div>
                        <div class="form-group">
                            <label for="card-cvc">CVC</label>
                            <input type="text" id="card-cvc" placeholder="123" maxlength="3">
                        </div>
                    </div>
                    <div class="form-group">
                        <label for="card-name">Cardholder Name</label>
                        <input type="text" id="card-name" placeholder="John Doe">
                    </div>
                    <div class="demo-notice">
                        <p><strong>Demo Mode:</strong> This is a demonstration. No real payment will be processed.</p>
                    </div>
                </div>
            `;
            
            // Add input formatting
            formatCardInputs();
        }
        
        console.log('Payment element initialized successfully');
        
    } catch (error) {
        console.error('Error initializing payment element:', error);
        throw error;
    }
}

function formatCardInputs() {
    const cardNumber = document.getElementById('card-number');
    const cardExpiry = document.getElementById('card-expiry');
    
    if (cardNumber) {
        cardNumber.addEventListener('input', (e) => {
            let value = e.target.value.replace(/\s/g, '');
            let formattedValue = value.replace(/(.{4})/g, '$1 ').trim();
            if (formattedValue.length <= 19) {
                e.target.value = formattedValue;
            }
        });
    }
    
    if (cardExpiry) {
        cardExpiry.addEventListener('input', (e) => {
            let value = e.target.value.replace(/\D/g, '');
            if (value.length >= 2) {
                value = value.substring(0, 2) + '/' + value.substring(2, 4);
            }
            e.target.value = value;
        });
    }
}

function backToShipping() {
    if (checkoutManager) {
        checkoutManager.currentStep = 1;
        checkoutManager.updateStepDisplay();
        showShippingForm();
    }
}

async function submitPayment() {
    if (!checkoutManager) {
        showError('Checkout not properly initialized');
        return;
    }
    
    await checkoutManager.processPayment();
}

// Error handling function
function showError(message) {
    const errorModal = document.getElementById('error-modal');
    const errorMessage = document.getElementById('error-message');
    
    if (errorModal && errorMessage) {
        errorMessage.textContent = message;
        errorModal.style.display = 'flex';
    } else {
        alert(message);
    }
}

function closeErrorModal() {
    const errorModal = document.getElementById('error-modal');
    if (errorModal) {
        errorModal.style.display = 'none';
    }
}

function closeSuccessModal() {
    const successModal = document.getElementById('success-modal');
    if (successModal) {
        successModal.style.display = 'none';
    }
}