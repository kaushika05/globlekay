#!/bin/bash

# Railway Backend Deployment Script
# This script deploys the backend to Railway

set -e

echo "🚂 Deploying backend to Railway..."

# Check if Railway CLI is installed
if ! command -v railway &> /dev/null; then
    echo "❌ Railway CLI is not installed. Please install it first:"
    echo "npm install -g @railway/cli"
    exit 1
fi

# Check if user is logged in to Railway
if ! railway whoami &> /dev/null; then
    echo "❌ Not logged in to Railway. Please run:"
    echo "railway login"
    exit 1
fi

# Build the server
echo "📦 Building server..."
npm run build:server

# Deploy to Railway
echo "🚀 Deploying to Railway..."
railway up

echo "✅ Backend deployed successfully!"
echo "🌐 Your Railway URL: $(railway status --json | jq -r '.url')"

# Get the Railway URL for frontend configuration
RAILWAY_URL=$(railway status --json | jq -r '.url')
echo ""
echo "📝 Add this environment variable to your Vercel frontend:"
echo "REACT_APP_SOCKET_URL=$RAILWAY_URL" 