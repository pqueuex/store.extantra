// Main JavaScript for EXTANTRA website
document.addEventListener('DOMContentLoaded', function() {
    // Hide loading overlay once everything is loaded
    hideLoadingOverlay();
    
    // Initialize the application
    initializeApp();
});

// Hide loading overlay
function hideLoadingOverlay() {
    const loadingOverlay = document.getElementById('loading-overlay');
    if (loadingOverlay) {
        loadingOverlay.style.display = 'none';
    }
}

// Initialize application
function initializeApp() {
    // Set up mobile menu toggle
    setupMobileMenu();
    
    // Initialize form handlers
    initializeForms();
    
    // Load cart from storage
    if (typeof loadCartFromStorage === 'function') {
        loadCartFromStorage();
    }
    
    // Update cart display
    if (typeof updateCartDisplay === 'function') {
        updateCartDisplay();
    }
    
    console.log('EXTANTRA website initialized');
}

// Page navigation
function showPage(pageId) {
    // Hide all pages
    const pages = document.querySelectorAll('.page');
    pages.forEach(page => {
        page.classList.remove('active');
    });
    
    // Show selected page
    const targetPage = document.getElementById(pageId + '-page');
    if (targetPage) {
        targetPage.classList.add('active');
    }
    
    // Update navigation
    updateNavigation(pageId);
    
    // Load products if on products page
    if (pageId === 'products' && typeof loadAllProducts === 'function') {
        loadAllProducts();
    }
    
    // Close mobile menu
    closeMobileMenu();
    
    // Scroll to top
    window.scrollTo(0, 0);
}

// Update navigation active state
function updateNavigation(activePageId) {
    const navLinks = document.querySelectorAll('.nav-link');
    navLinks.forEach(link => {
        link.classList.remove('active');
        if (link.onclick && link.onclick.toString().includes(activePageId)) {
            link.classList.add('active');
        }
    });
}

// Mobile menu functionality
function setupMobileMenu() {
    const menuToggle = document.getElementById('menu-toggle');
    const mainNav = document.getElementById('main-nav');
    
    if (menuToggle && mainNav) {
        menuToggle.addEventListener('click', function() {
            mainNav.classList.toggle('active');
        });
    }
}

function closeMobileMenu() {
    const mainNav = document.getElementById('main-nav');
    if (mainNav) {
        mainNav.classList.remove('active');
    }
}

// Smooth scrolling for sections
function scrollToSection(sectionId) {
    const element = document.getElementById(sectionId);
    if (element) {
        element.scrollIntoView({ 
            behavior: 'smooth',
            block: 'start'
        });
    }
}

// Product detail functionality
function showProductDetail(productId) {
    if (typeof openProductModal === 'function') {
        openProductModal(productId);
    }
}

// Cart functionality - Updated to work with cart.js
function openCart() {
    const cartModal = document.getElementById('cart-modal');
    if (cartModal) {
        cartModal.style.display = 'flex';
        cartModal.classList.add('show');
        document.body.style.overflow = 'hidden';
    }
    
    // Update cart display
    if (typeof cart !== 'undefined' && typeof cart.updateCartDisplay === 'function') {
        cart.updateCartDisplay();
    }
}

function closeCart() {
    const cartModal = document.getElementById('cart-modal');
    if (cartModal) {
        cartModal.style.display = 'none';
        cartModal.classList.remove('show');
        document.body.style.overflow = 'auto';
    }
}

// Checkout functionality
function proceedToCheckout() {
    // Close cart modal first
    closeCart();
    
    // Open checkout modal
    if (typeof openCheckout === 'function') {
        openCheckout();
    } else {
        showError('Checkout system not available. Please refresh the page and try again.');
    }
}

function closeCheckout() {
    const checkoutModal = document.getElementById('checkout-modal');
    if (checkoutModal) {
        checkoutModal.style.display = 'none';
        document.body.style.overflow = 'auto';
    }
}

// Product modal functionality - Updated to work with cart.js
function closeProductModal() {
    const productModal = document.getElementById('product-modal');
    if (productModal) {
        productModal.style.display = 'none';
        productModal.classList.remove('show');
        document.body.style.overflow = 'auto';
    }
}

// Success modal functionality
function closeSuccessModal() {
    const successModal = document.getElementById('success-modal');
    if (successModal) {
        successModal.style.display = 'none';
        document.body.style.overflow = 'auto';
    }
    
    // Return to home page
    showPage('home');
    
    // Clear cart
    if (typeof clearCart === 'function') {
        clearCart();
    }
}

// Error modal functionality
function closeErrorModal() {
    const errorModal = document.getElementById('error-modal');
    if (errorModal) {
        errorModal.style.display = 'none';
        document.body.style.overflow = 'auto';
    }
}

function showError(message) {
    const errorModal = document.getElementById('error-modal');
    const errorMessage = document.getElementById('error-message');
    
    if (errorModal && errorMessage) {
        errorMessage.textContent = message;
        errorModal.style.display = 'flex';
        document.body.style.overflow = 'hidden';
    }
}

// Form handling
function initializeForms() {
    // Jewelry signup form
    const jewelryForm = document.getElementById('jewelry-signup-form');
    if (jewelryForm) {
        jewelryForm.addEventListener('submit', handleJewelrySignup);
    }
    
    // Contact form
    const contactForm = document.getElementById('contact-form');
    if (contactForm) {
        contactForm.addEventListener('submit', handleContactForm);
    }
}

function handleJewelrySignup(e) {
    e.preventDefault();
    const email = document.getElementById('jewelry-email').value;
    
    if (email) {
        // Store email for jewelry notifications
        console.log('Jewelry signup:', email);
        
        // Show success message
        alert('Thank you! We\'ll notify you when jewelry becomes available.');
        
        // Clear form
        document.getElementById('jewelry-email').value = '';
    }
}

function handleContactForm(e) {
    e.preventDefault();
    
    const formData = new FormData(e.target);
    const contactData = {
        name: formData.get('name'),
        email: formData.get('email'),
        subject: formData.get('subject'),
        message: formData.get('message')
    };
    
    console.log('Contact form submission:', contactData);
    
    // Show success message
    alert('Thank you for your message! We\'ll get back to you soon.');
    
    // Clear form
    e.target.reset();
}

// Modal close on outside click
document.addEventListener('click', function(e) {
    const modals = document.querySelectorAll('.modal');
    modals.forEach(modal => {
        if (e.target === modal) {
            modal.style.display = 'none';
            document.body.style.overflow = 'auto';
        }
    });
});

// Keyboard navigation
document.addEventListener('keydown', function(e) {
    if (e.key === 'Escape') {
        // Close any open modals
        const openModals = document.querySelectorAll('.modal[style*="flex"], .modal[style*="block"]');
        openModals.forEach(modal => {
            modal.style.display = 'none';
        });
        document.body.style.overflow = 'auto';
        closeMobileMenu();
    }
});

// Utility functions
function formatPrice(price) {
    return '$' + parseFloat(price).toFixed(2);
}

function validateEmail(email) {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(email);
}

function sanitizeHTML(str) {
    const temp = document.createElement('div');
    temp.textContent = str;
    return temp.innerHTML;
}

// Loading states
function showLoading(element) {
    if (element) {
        element.classList.add('loading');
    }
}

function hideLoading(element) {
    if (element) {
        element.classList.remove('loading');
    }
}

// Export functions for use in other scripts
window.EXTANTRA = {
    showPage,
    scrollToSection,
    showProductDetail,
    openCart,
    closeCart,
    proceedToCheckout,
    closeCheckout,
    closeProductModal,
    closeSuccessModal,
    closeErrorModal,
    showError,
    formatPrice,
    validateEmail,
    sanitizeHTML
};