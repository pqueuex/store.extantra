// Email Notification System for EXTANTRA Store

class EmailNotificationSystem {
    constructor() {
        this.businessEmail = 'pqueue001@gmail.com';
        this.businessName = 'EXTANTRA';
    }

    // Send order confirmation to customer and business
    async sendOrderConfirmation(orderData) {
        try {
            // Send customer confirmation
            await this.sendCustomerConfirmation(orderData);
            
            // Send business notification
            await this.sendBusinessNotification(orderData);
            
            console.log('Order confirmation emails sent successfully');
            return true;
        } catch (error) {
            console.error('Failed to send order confirmation emails:', error);
            throw error;
        }
    }

    // Send confirmation email to customer
    async sendCustomerConfirmation(orderData) {
        const emailContent = this.generateCustomerEmailHTML(orderData);
        
        // In a real implementation, this would use a service like EmailJS, SendGrid, or your backend
        // For demo purposes, we'll simulate the email sending
        console.log('Customer confirmation email content:', emailContent);
        
        // Simulate API call to email service
        return new Promise((resolve, reject) => {
            setTimeout(() => {
                // Simulate success/failure
                if (Math.random() > 0.1) { // 90% success rate
                    resolve();
                } else {
                    reject(new Error('Email service unavailable'));
                }
            }, 1000);
        });
    }

    // Send notification email to business
    async sendBusinessNotification(orderData) {
        const emailContent = this.generateBusinessEmailHTML(orderData);
        
        console.log('Business notification email content:', emailContent);
        
        // Simulate API call to email service
        return new Promise((resolve, reject) => {
            setTimeout(() => {
                if (Math.random() > 0.1) {
                    resolve();
                } else {
                    reject(new Error('Email service unavailable'));
                }
            }, 500);
        });
    }

    // Generate customer confirmation email HTML
    generateCustomerEmailHTML(orderData) {
        const itemsHTML = orderData.items.map(item => `
            <tr>
                <td style="padding: 10px; border-bottom: 1px solid #eee;">${item.name}</td>
                <td style="padding: 10px; border-bottom: 1px solid #eee; text-align: center;">${item.quantity}</td>
                <td style="padding: 10px; border-bottom: 1px solid #eee; text-align: right;">$${item.price.toFixed(2)}</td>
                <td style="padding: 10px; border-bottom: 1px solid #eee; text-align: right;">$${(item.price * item.quantity).toFixed(2)}</td>
            </tr>
        `).join('');

        return `
            <!DOCTYPE html>
            <html>
            <head>
                <meta charset="utf-8">
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
                <title>Order Confirmation - ${this.businessName}</title>
                <style>
                    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
                    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
                    .header { background: #000; color: #fff; padding: 20px; text-align: center; }
                    .content { padding: 20px; background: #f9f9f9; }
                    .order-details { background: #fff; padding: 20px; margin: 20px 0; border: 1px solid #ddd; }
                    table { width: 100%; border-collapse: collapse; margin: 10px 0; }
                    th { background: #f5f5f5; padding: 12px; text-align: left; border-bottom: 2px solid #ddd; }
                    .total-row { font-weight: bold; background: #f5f5f5; }
                    .footer { background: #000; color: #fff; padding: 20px; text-align: center; margin-top: 20px; }
                </style>
            </head>
            <body>
                <div class="container">
                    <div class="header">
                        <h1>${this.businessName}</h1>
                        <h2>Order Confirmation</h2>
                    </div>
                    
                    <div class="content">
                        <p>Dear ${orderData.customer.firstName} ${orderData.customer.lastName},</p>
                        
                        <p>Thank you for your order! We've received your payment and are preparing your items for shipment.</p>
                        
                        <div class="order-details">
                            <h3>Order Details</h3>
                            <p><strong>Order Number:</strong> ${orderData.orderNumber}</p>
                            <p><strong>Order Date:</strong> ${new Date(orderData.orderDate).toLocaleDateString()}</p>
                            <p><strong>Payment ID:</strong> ${orderData.paymentIntentId}</p>
                            
                            <h4>Items Ordered:</h4>
                            <table>
                                <thead>
                                    <tr>
                                        <th>Item</th>
                                        <th style="text-align: center;">Qty</th>
                                        <th style="text-align: right;">Price</th>
                                        <th style="text-align: right;">Total</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    ${itemsHTML}
                                </tbody>
                                <tfoot>
                                    <tr>
                                        <td colspan="3" style="padding: 10px; text-align: right;"><strong>Subtotal:</strong></td>
                                        <td style="padding: 10px; text-align: right;"><strong>$${orderData.totals.subtotal}</strong></td>
                                    </tr>
                                    <tr>
                                        <td colspan="3" style="padding: 10px; text-align: right;"><strong>Tax:</strong></td>
                                        <td style="padding: 10px; text-align: right;"><strong>$${orderData.totals.tax}</strong></td>
                                    </tr>
                                    <tr>
                                        <td colspan="3" style="padding: 10px; text-align: right;"><strong>Shipping:</strong></td>
                                        <td style="padding: 10px; text-align: right;"><strong>${orderData.totals.shipping === '0.00' ? 'FREE' : '$' + orderData.totals.shipping}</strong></td>
                                    </tr>
                                    <tr class="total-row">
                                        <td colspan="3" style="padding: 15px; text-align: right; font-size: 18px;"><strong>TOTAL:</strong></td>
                                        <td style="padding: 15px; text-align: right; font-size: 18px;"><strong>$${orderData.totals.total}</strong></td>
                                    </tr>
                                </tfoot>
                            </table>
                        </div>
                        
                        <div class="order-details">
                            <h3>Shipping Information</h3>
                            <p>
                                ${orderData.customer.firstName} ${orderData.customer.lastName}<br>
                                ${orderData.shipping.address}<br>
                                ${orderData.shipping.city}, ${orderData.shipping.state} ${orderData.shipping.zip}<br>
                                ${orderData.shipping.country}
                            </p>
                        </div>
                        
                        <p><strong>What happens next?</strong></p>
                        <ul>
                            <li>We'll prepare your order for shipment within 1-2 business days</li>
                            <li>You'll receive a shipping confirmation email with tracking information</li>
                            <li>Your items will arrive within 5-10 business days (depending on location)</li>
                        </ul>
                        
                        <p>If you have any questions about your order, please contact us at ${this.businessEmail}</p>
                        
                        <p>Thank you for choosing ${this.businessName}!</p>
                    </div>
                    
                    <div class="footer">
                        <p>&copy; 2025 ${this.businessName} | EXT MARKET</p>
                        <p>This is an automated email. Please do not reply directly to this message.</p>
                    </div>
                </div>
            </body>
            </html>
        `;
    }

    // Generate business notification email HTML
    generateBusinessEmailHTML(orderData) {
        const itemsHTML = orderData.items.map(item => `
            <tr>
                <td style="padding: 8px; border-bottom: 1px solid #ddd;">${item.name}</td>
                <td style="padding: 8px; border-bottom: 1px solid #ddd; text-align: center;">${item.quantity}</td>
                <td style="padding: 8px; border-bottom: 1px solid #ddd; text-align: right;">$${item.price.toFixed(2)}</td>
                <td style="padding: 8px; border-bottom: 1px solid #ddd; text-align: right;">$${(item.price * item.quantity).toFixed(2)}</td>
            </tr>
        `).join('');

        return `
            <!DOCTYPE html>
            <html>
            <head>
                <meta charset="utf-8">
                <title>New Order Received - ${orderData.orderNumber}</title>
                <style>
                    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
                    .container { max-width: 700px; margin: 0 auto; padding: 20px; }
                    .header { background: #000; color: #fff; padding: 15px; text-align: center; }
                    .alert { background: #f0f8ff; border: 1px solid #0066cc; padding: 15px; margin: 20px 0; }
                    .section { background: #f9f9f9; padding: 15px; margin: 15px 0; border-left: 4px solid #000; }
                    table { width: 100%; border-collapse: collapse; margin: 10px 0; }
                    th { background: #333; color: #fff; padding: 10px; text-align: left; }
                    .total-row { background: #f5f5f5; font-weight: bold; }
                </style>
            </head>
            <body>
                <div class="container">
                    <div class="header">
                        <h1>NEW ORDER RECEIVED</h1>
                        <h2>Order #${orderData.orderNumber}</h2>
                    </div>
                    
                    <div class="alert">
                        <h3>🎉 New order requires processing!</h3>
                        <p><strong>Order Total:</strong> $${orderData.totals.total}</p>
                        <p><strong>Order Time:</strong> ${new Date(orderData.orderDate).toLocaleString()}</p>
                        <p><strong>Payment Status:</strong> ✅ PAID (Stripe ID: ${orderData.paymentIntentId})</p>
                    </div>
                    
                    <div class="section">
                        <h3>Customer Information</h3>
                        <p><strong>Name:</strong> ${orderData.customer.firstName} ${orderData.customer.lastName}</p>
                        <p><strong>Email:</strong> ${orderData.customer.email}</p>
                    </div>
                    
                    <div class="section">
                        <h3>Shipping Address</h3>
                        <p>
                            ${orderData.customer.firstName} ${orderData.customer.lastName}<br>
                            ${orderData.shipping.address}<br>
                            ${orderData.shipping.city}, ${orderData.shipping.state} ${orderData.shipping.zip}<br>
                            ${orderData.shipping.country}
                        </p>
                    </div>
                    
                    <div class="section">
                        <h3>Order Items</h3>
                        <table>
                            <thead>
                                <tr>
                                    <th>Product</th>
                                    <th style="text-align: center;">Quantity</th>
                                    <th style="text-align: right;">Unit Price</th>
                                    <th style="text-align: right;">Total</th>
                                </tr>
                            </thead>
                            <tbody>
                                ${itemsHTML}
                            </tbody>
                            <tfoot>
                                <tr>
                                    <td colspan="3" style="padding: 10px; text-align: right;"><strong>Subtotal:</strong></td>
                                    <td style="padding: 10px; text-align: right;"><strong>$${orderData.totals.subtotal}</strong></td>
                                </tr>
                                <tr>
                                    <td colspan="3" style="padding: 10px; text-align: right;"><strong>Tax:</strong></td>
                                    <td style="padding: 10px; text-align: right;"><strong>$${orderData.totals.tax}</strong></td>
                                </tr>
                                <tr>
                                    <td colspan="3" style="padding: 10px; text-align: right;"><strong>Shipping:</strong></td>
                                    <td style="padding: 10px; text-align: right;"><strong>${orderData.totals.shipping === '0.00' ? 'FREE' : '$' + orderData.totals.shipping}</strong></td>
                                </tr>
                                <tr class="total-row">
                                    <td colspan="3" style="padding: 15px; text-align: right; font-size: 16px;"><strong>TOTAL PAID:</strong></td>
                                    <td style="padding: 15px; text-align: right; font-size: 16px;"><strong>$${orderData.totals.total}</strong></td>
                                </tr>
                            </tfoot>
                        </table>
                    </div>
                    
                    <div class="section">
                        <h3>Next Steps</h3>
                        <ul>
                            <li>✅ Payment confirmed via Stripe</li>
                            <li>📦 Package items for shipment</li>
                            <li>📮 Create shipping label (ship from: Leesburg, FL 33748)</li>
                            <li>📧 Send tracking information to customer</li>
                        </ul>
                    </div>
                    
                    <div style="background: #333; color: #fff; padding: 15px; text-align: center; margin-top: 30px;">
                        <p><strong>${this.businessName} - Order Management System</strong></p>
                        <p>Generated: ${new Date().toLocaleString()}</p>
                    </div>
                </div>
            </body>
            </html>
        `;
    }

    // Send jewelry notification signup confirmation
    async sendJewelrySignupConfirmation(email) {
        const emailContent = `
            <!DOCTYPE html>
            <html>
            <head>
                <meta charset="utf-8">
                <title>Jewelry Collection Notification - ${this.businessName}</title>
                <style>
                    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
                    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
                    .header { background: #000; color: #fff; padding: 20px; text-align: center; }
                    .content { padding: 20px; background: #f9f9f9; }
                </style>
            </head>
            <body>
                <div class="container">
                    <div class="header">
                        <h1>${this.businessName}</h1>
                        <h2>Jewelry Collection Updates</h2>
                    </div>
                    
                    <div class="content">
                        <p>Thank you for your interest in our upcoming jewelry collection!</p>
                        
                        <p>You'll be the first to know when our handcrafted jewelry pieces become available. We're working on some beautiful, unique designs that we think you'll love.</p>
                        
                        <p>We'll send you an email as soon as the collection launches.</p>
                        
                        <p>In the meantime, feel free to explore our current collection of art prints, t-shirts, and accessories.</p>
                        
                        <p>Thank you for choosing ${this.businessName}!</p>
                    </div>
                </div>
            </body>
            </html>
        `;

        console.log('Jewelry signup confirmation email sent to:', email);
        return true;
    }
}

// Initialize email system
const emailSystem = new EmailNotificationSystem();

// Jewelry signup form handler
function handleJewelrySignup(event) {
    event.preventDefault();
    
    const form = event.target;
    const email = form.querySelector('input[type="email"]').value;
    const submitBtn = form.querySelector('button[type="submit"]');
    
    if (!email) {
        showError('Please enter a valid email address.');
        return;
    }
    
    // Show loading state
    submitBtn.disabled = true;
    submitBtn.textContent = 'Signing up...';
    
    // Simulate signup process
    setTimeout(async () => {
        try {
            // Save email to jewelry notification list (would be database in real app)
            console.log('Added email to jewelry notifications:', email);
            
            // Send confirmation email
            await emailSystem.sendJewelrySignupConfirmation(email);
            
            // Show success message
            form.innerHTML = `
                <div class="signup-success">
                    <p>✓ You're signed up!</p>
                    <p>We'll notify you when our jewelry collection launches.</p>
                </div>
            `;
            
        } catch (error) {
            console.error('Jewelry signup error:', error);
            showError('There was an issue with your signup. Please try again.');
            
            // Reset button
            submitBtn.disabled = false;
            submitBtn.textContent = 'Notify Me';
        }
    }, 1500);
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { emailSystem, handleJewelrySignup };
}