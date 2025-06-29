#!/bin/bash

# Complete Deployment Script
# This script deploys both backend (Railway) and frontend (Vercel)

set -e

echo "🚀 Starting complete deployment..."

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check if required tools are installed
print_status "Checking prerequisites..."

# Check Node.js
if ! command -v node &> /dev/null; then
    print_error "Node.js is not installed"
    exit 1
fi

# Check npm
if ! command -v npm &> /dev/null; then
    print_error "npm is not installed"
    exit 1
fi

# Check Railway CLI
if ! command -v railway &> /dev/null; then
    print_warning "Railway CLI is not installed. Installing..."
    npm install -g @railway/cli
fi

# Check Vercel CLI
if ! command -v vercel &> /dev/null; then
    print_warning "Vercel CLI is not installed. Installing..."
    npm install -g vercel
fi

print_success "All prerequisites are installed"

# Install dependencies
print_status "Installing dependencies..."
npm install

# Deploy Backend to Railway
print_status "Deploying backend to Railway..."

# Check Railway login
if ! railway whoami &> /dev/null; then
    print_error "Not logged in to Railway. Please run: railway login"
    exit 1
fi

# Build and deploy backend
print_status "Building server..."
npm run build:server

print_status "Deploying to Railway..."
railway up

# Get Railway URL
RAILWAY_URL=$(railway status --json | jq -r '.url' 2>/dev/null || echo "unknown")
print_success "Backend deployed to Railway: $RAILWAY_URL"

# Deploy Frontend to Vercel
print_status "Deploying frontend to Vercel..."

# Check Vercel login
if ! vercel whoami &> /dev/null; then
    print_error "Not logged in to Vercel. Please run: vercel login"
    exit 1
fi

# Build and deploy frontend
print_status "Building client..."
npm run build:client

print_status "Deploying to Vercel..."
vercel --prod

print_success "Frontend deployed to Vercel"

# Final instructions
echo ""
echo "🎉 Deployment completed successfully!"
echo ""
echo "📋 Next steps:"
echo "1. Go to your Vercel project settings"
echo "2. Add environment variable: REACT_APP_SOCKET_URL = $RAILWAY_URL"
echo "3. Redeploy your Vercel project to apply the environment variable"
echo ""
echo "🌐 Your URLs:"
echo "   Backend (Railway): $RAILWAY_URL"
echo "   Frontend (Vercel): Check your Vercel dashboard"
echo ""
echo "🔧 To redeploy in the future, run: ./scripts/deploy-all.sh" 