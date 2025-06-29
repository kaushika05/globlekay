#!/bin/bash

# Vercel Frontend Deployment Script
# This script deploys the frontend to Vercel

set -e

echo "🚀 Deploying frontend to Vercel..."

# Check if Vercel CLI is installed
if ! command -v vercel &> /dev/null; then
    echo "❌ Vercel CLI is not installed. Please install it first:"
    echo "npm install -g vercel"
    exit 1
fi

# Check if user is logged in to Vercel
if ! vercel whoami &> /dev/null; then
    echo "❌ Not logged in to Vercel. Please run:"
    echo "vercel login"
    exit 1
fi

# Build the client
echo "📦 Building client..."
npm run build:client

# Deploy to Vercel
echo "🚀 Deploying to Vercel..."
vercel --prod

echo "✅ Frontend deployed successfully!"
echo ""
echo "📝 Make sure to set the REACT_APP_SOCKET_URL environment variable in Vercel:"
echo "   Go to your Vercel project settings > Environment Variables"
echo "   Add: REACT_APP_SOCKET_URL = your-railway-backend-url" 