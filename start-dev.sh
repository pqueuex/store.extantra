#!/bin/bash

# Extantra Store - Development Startup Script
# This script starts both the server and Stripe webhook listener

echo "🚀 Starting Extantra Store Development Environment..."
echo ""

# Kill any existing processes on port 3000
echo "🧹 Cleaning up existing processes..."
lsof -ti :3000 | xargs kill -9 2>/dev/null || true

# Start the Node.js server in the background
echo "📦 Starting Node.js server..."
npm start &
SERVER_PID=$!

# Wait for server to start
sleep 2

# Start Stripe webhook listener
echo "🔔 Starting Stripe webhook listener..."
echo ""
echo "⚠️  IMPORTANT: You need to complete Stripe login first!"
echo "   Run this command in a separate terminal:"
echo "   stripe login"
echo ""
echo "   Then restart this script."
echo ""

# Check if Stripe is authenticated
if stripe config --list 2>/dev/null | grep -q "test_mode"; then
    echo "✅ Stripe authenticated!"
    echo ""
    echo "🎧 Starting webhook forwarding..."
    stripe listen --forward-to localhost:3000/webhook
else
    echo "❌ Stripe not authenticated yet."
    echo ""
    echo "📋 Steps to complete:"
    echo "   1. Open a new terminal"
    echo "   2. Run: stripe login"
    echo "   3. Follow the browser prompt"
    echo "   4. Come back and run: ./start-dev.sh"
    echo ""
    echo "🌐 Server is running at: http://localhost:3000"
    echo ""
    
    # Keep server running
    wait $SERVER_PID
fi
