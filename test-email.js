#!/usr/bin/env node

/**
 * Test Email Configuration
 * 
 * This script tests if your Gmail app password is configured correctly.
 * Run: node test-email.js
 */

const nodemailer = require('nodemailer');
require('dotenv').config();

async function testEmail() {
    console.log('🧪 Testing email configuration...\n');

    // Check environment variables
    if (!process.env.GMAIL_USER) {
        console.error('❌ GMAIL_USER not set in .env');
        process.exit(1);
    }

    if (!process.env.GMAIL_APP_PASSWORD) {
        console.error('❌ GMAIL_APP_PASSWORD not set in .env');
        process.exit(1);
    }

    console.log('✅ Gmail credentials found in .env');
    console.log(`   From: ${process.env.GMAIL_USER}`);
    console.log(`   To: ${process.env.NOTIFICATION_EMAIL}\n`);

    // Create transporter
    const transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: {
            user: process.env.GMAIL_USER,
            pass: process.env.GMAIL_APP_PASSWORD
        }
    });

    // Test email content
    const testOrderEmail = `
🧪 TEST EMAIL - Order Notification System

This is a test email to verify your email notifications are working!

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

📦 Sample Order Details:

1. Silent Hill 2 Zippo Lighter (Chrome)
   🔥 SIDE ENGRAVING: "In my restless dreams, I see that town"
   ⛽ BUTANE INSERT: Yes

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

💰 Payment: $38.15

🚚 Shipping Address:
Test Customer
123 Main Street
New York, NY 10001
US

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

✅ If you received this email, your notification system is working!

Next steps:
1. Place a real test order with custom engraving
2. Verify you receive an email with the custom text
3. Check Stripe Dashboard for order metadata
    `.trim();

    try {
        console.log('📧 Sending test email...');
        
        const info = await transporter.sendMail({
            from: process.env.GMAIL_USER,
            to: process.env.NOTIFICATION_EMAIL || 'store@extantra.net',
            subject: '🧪 Test Email - Order Notification System',
            text: testOrderEmail
        });

        console.log('\n✅ SUCCESS! Test email sent!');
        console.log(`   Message ID: ${info.messageId}`);
        console.log(`\n📬 Check your inbox at: ${process.env.NOTIFICATION_EMAIL}`);
        console.log('   (Also check spam folder if you don\'t see it)\n');
        
        process.exit(0);
    } catch (error) {
        console.error('\n❌ ERROR sending email:');
        console.error(`   ${error.message}\n`);
        
        if (error.message.includes('Invalid login')) {
            console.error('💡 This usually means:');
            console.error('   1. Gmail app password is incorrect');
            console.error('   2. 2-Factor Authentication is not enabled');
            console.error('   3. App password was not generated correctly\n');
            console.error('   Follow the setup guide: docs/email-setup-guide.md\n');
        }
        
        process.exit(1);
    }
}

testEmail();
