@echo off
setlocal enabledelayedexpansion

echo 🚀 Starting complete deployment...

REM Check if Node.js is installed
where node >nul 2>nul
if %errorlevel% neq 0 (
    echo ❌ Node.js is not installed
    exit /b 1
)

REM Check if npm is installed
where npm >nul 2>nul
if %errorlevel% neq 0 (
    echo ❌ npm is not installed
    exit /b 1
)

echo ✅ Prerequisites check passed

REM Install dependencies
echo 📦 Installing dependencies...
call npm install

REM Deploy Backend to Railway
echo 🚂 Deploying backend to Railway...

REM Check if Railway CLI is installed
where railway >nul 2>nul
if %errorlevel% neq 0 (
    echo ⚠️ Railway CLI is not installed. Installing...
    call npm install -g @railway/cli
)

REM Build server
echo 📦 Building server...
call npm run build:server

REM Deploy to Railway
echo 🚀 Deploying to Railway...
call railway up
if %errorlevel% neq 0 (
    echo ❌ Railway deployment failed
    exit /b 1
)
echo ✅ Backend deployed to Railway

REM Deploy Frontend to Vercel
echo 🚀 Deploying frontend to Vercel...

REM Check if Vercel CLI is installed
where vercel >nul 2>nul
if %errorlevel% neq 0 (
    echo ⚠️ Vercel CLI is not installed. Installing...
    call npm install -g vercel
)

REM Build client
echo 📦 Building client...
call npm run build:client

REM Deploy to Vercel
echo 🚀 Deploying to Vercel...
call vercel --prod --cwd . --yes --name globlekayfrontend
if %errorlevel% neq 0 (
    echo ❌ Vercel deployment failed
    exit /b 1
)
echo ✅ Frontend deployed to Vercel

echo.
echo 🎉 Deployment completed successfully!
echo.
echo 📋 Next steps:
echo 1. Go to your Vercel project settings
echo 2. Add environment variable: REACT_APP_SOCKET_URL = your-railway-backend-url
echo 3. Redeploy your Vercel project to apply the environment variable
echo 4. Ensure your backend server listens on the port provided by the PORT environment variable and exposes a /health endpoint for Railway health checks
echo.
echo 🔧 To redeploy in the future, run: scripts\deploy-windows.bat

pause 