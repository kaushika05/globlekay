# Deployment Guide

This guide will help you deploy your Kay's Globle Mod application with the backend on Railway and frontend on Vercel.

## Prerequisites

- Node.js 18.x or 20.x (LTS)
- npm or yarn
- GitHub account
- Railway account (free tier available)
- Vercel account (free tier available)

## Quick Deployment

### Option 1: Automated Script (Recommended)

#### For Windows:
```bash
scripts\deploy-windows.bat
```

#### For macOS/Linux:
```bash
chmod +x scripts/deploy-all.sh
./scripts/deploy-all.sh
```

### Option 2: Manual Deployment

## Step 1: Deploy Backend to Railway

### 1.1 Install Railway CLI
```bash
npm install -g @railway/cli
```

### 1.2 Login to Railway
```bash
railway login
```

### 1.3 Deploy Backend
```bash
# Build the server
npm run build:server

# Deploy to Railway
railway up
```

### 1.4 Get Railway URL
```bash
railway status --json | jq -r '.url'
```

## Step 2: Deploy Frontend to Vercel

### 2.1 Install Vercel CLI
```bash
npm install -g vercel
```

### 2.2 Login to Vercel
```bash
vercel login
```

### 2.3 Deploy Frontend
```bash
# Build the client
npm run build:client

# Deploy to Vercel
vercel --prod
```

## Step 3: Configure Environment Variables

### 3.1 Set Railway URL in Vercel
1. Go to your Vercel project dashboard
2. Navigate to Settings → Environment Variables
3. Add a new variable:
   - **Name**: `REACT_APP_SOCKET_URL`
   - **Value**: Your Railway backend URL (e.g., `https://your-app.up.railway.app`)
4. Redeploy your Vercel project

## Configuration Files

### railway.json
Railway configuration for backend deployment:
```json
{
  "$schema": "https://railway.app/railway.schema.json",
  "build": {
    "builder": "NIXPACKS",
    "buildCommand": "npm install && npm run build:server"
  },
  "deploy": {
    "startCommand": "npm run start:server:prod",
    "healthcheckPath": "/health",
    "healthcheckTimeout": 100,
    "restartPolicyType": "ON_FAILURE",
    "restartPolicyMaxRetries": 10
  }
}
```

### vercel.json
Vercel configuration for frontend deployment:
```json
{
  "version": 2,
  "name": "kays-globle-mod-frontend",
  "builds": [
    {
      "src": "package.json",
      "use": "@vercel/static-build",
      "config": {
        "distDir": "build"
      }
    }
  ],
  "routes": [
    {
      "src": "/static/(.*)",
      "dest": "/static/$1"
    },
    {
      "src": "/(.*)",
      "dest": "/index.html"
    }
  ],
  "env": {
    "REACT_APP_SOCKET_URL": "@react_app_socket_url"
  },
  "buildCommand": "npm run build:client",
  "outputDirectory": "build"
}
```

## Available Scripts

### Development
- `npm start` - Start both client and server in development mode
- `npm run start:client` - Start only the React client
- `npm run start:server` - Start only the Express server

### Building
- `npm run build` - Build both client and server
- `npm run build:client` - Build only the React client
- `npm run build:server` - Build only the Express server

### Deployment
- `npm run start:server:prod` - Start the production server

## Troubleshooting

### Common Issues

#### 1. Railway Deployment Fails
- Check that your Railway account has available resources
- Ensure all dependencies are in `package.json`
- Check Railway logs for specific error messages

#### 2. Vercel Deployment Fails
- Verify the build command works locally: `npm run build:client`
- Check that all environment variables are set correctly
- Review Vercel build logs for errors

#### 3. Socket Connection Issues
- Ensure `REACT_APP_SOCKET_URL` is set correctly in Vercel
- Check that the Railway backend is running and accessible
- Verify CORS settings in the backend

#### 4. Environment Variables Not Working
- Redeploy your Vercel project after adding environment variables
- Ensure variable names start with `REACT_APP_` for Create React App
- Check that variables are set for the correct environment (Production/Preview)

### Getting Help

1. **Railway Issues**: Check Railway documentation and community forums
2. **Vercel Issues**: Check Vercel documentation and community forums
3. **Application Issues**: Check the application logs and browser console

## Monitoring

### Railway Backend
- Monitor your Railway dashboard for:
  - Resource usage
  - Deployment status
  - Logs and errors
  - Health check status

### Vercel Frontend
- Monitor your Vercel dashboard for:
  - Deployment status
  - Build logs
  - Performance metrics
  - Function invocations

## Cost Considerations

### Railway (Backend)
- Free tier: $5/month credit
- Pay-as-you-go after free tier
- Costs depend on resource usage

### Vercel (Frontend)
- Free tier: Unlimited static sites
- Pro plan: $20/month for advanced features
- Most projects can run on free tier

## Security Notes

1. **Environment Variables**: Never commit sensitive data to your repository
2. **CORS**: The backend is configured to accept connections from any origin (`*`)
3. **HTTPS**: Both Railway and Vercel provide HTTPS by default
4. **Rate Limiting**: Consider implementing rate limiting for production use

## Updates and Maintenance

### Updating Dependencies
```bash
npm update
npm audit fix
```

### Redeploying
```bash
# Backend only
railway up

# Frontend only
vercel --prod

# Both (using scripts)
./scripts/deploy-all.sh
```

### Monitoring Updates
- Set up notifications for failed deployments
- Monitor application performance regularly
- Keep dependencies updated for security patches 