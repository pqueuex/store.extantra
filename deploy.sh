#!/bin/bash

# Extantra Store Deployment Script for Debian
# Run this script on your Debian server after cloning the repository

set -e  # Exit on any error

echo "🚀 Starting Extantra Store deployment..."

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${GREEN}✓${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}⚠${NC} $1"
}

print_error() {
    echo -e "${RED}✗${NC} $1"
}

# Check if running as root
if [[ $EUID -eq 0 ]]; then
   print_error "This script should not be run as root. Please run as a regular user with sudo access."
   exit 1
fi

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    print_warning "Node.js not found. Installing Node.js LTS..."
    curl -fsSL https://deb.nodesource.com/setup_lts.x | sudo -E bash -
    sudo apt-get install -y nodejs
    print_status "Node.js installed"
else
    print_status "Node.js found: $(node --version)"
fi

# Check if npm is available
if ! command -v npm &> /dev/null; then
    print_error "npm not found. Please install Node.js properly."
    exit 1
fi

# Install PM2 globally if not present
if ! command -v pm2 &> /dev/null; then
    print_warning "PM2 not found. Installing PM2..."
    sudo npm install -g pm2
    print_status "PM2 installed"
else
    print_status "PM2 found"
fi

# Install project dependencies
print_status "Installing project dependencies..."
npm install

# Check if .env file exists
if [ ! -f ".env" ]; then
    print_warning "Creating .env file template..."
    cat > .env << EOL
# Extantra Store Environment Variables
NODE_ENV=production
PORT=3000

# Stripe Configuration (Replace with your actual keys)
STRIPE_PUBLISHABLE_KEY=pk_live_your_publishable_key_here
STRIPE_SECRET_KEY=sk_live_your_secret_key_here

# USPS API Configuration (Optional - for real-time shipping rates)
USPS_CONSUMER_KEY=your_usps_key_here
USPS_CONSUMER_SECRET=your_usps_secret_here

# Security
SESSION_SECRET=your_random_session_secret_here
EOL
    print_warning "Please edit .env file with your actual API keys before starting the application!"
    print_warning "Run: nano .env"
else
    print_status ".env file already exists"
fi

# Stop existing PM2 process if running
if pm2 describe extantra-store > /dev/null 2>&1; then
    print_status "Stopping existing application..."
    pm2 stop extantra-store
    pm2 delete extantra-store
fi

# Start application with PM2
print_status "Starting application with PM2..."
pm2 start server.js --name "extantra-store" --env production

# Save PM2 configuration
pm2 save

# Setup PM2 startup script
print_status "Setting up PM2 startup script..."
pm2 startup | tail -n 1 | sudo bash

print_status "Application deployed successfully!"
print_status "Application is running on port 3000"

echo ""
echo "🎉 Deployment Complete!"
echo ""
echo "Next steps:"
echo "1. Edit .env file with your API keys: nano .env"
echo "2. Restart the application: pm2 restart extantra-store"
echo "3. Set up Nginx reverse proxy (see debian-deployment-guide.md)"
echo "4. Configure SSL with Let's Encrypt"
echo ""
echo "Useful commands:"
echo "  pm2 status              - Check application status"
echo "  pm2 logs extantra-store - View application logs"
echo "  pm2 restart extantra-store - Restart application"
echo ""
