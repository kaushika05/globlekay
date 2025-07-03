@echo off
setlocal enabledelayedexpansion

echo 🚀 Starting complete deployment for Kays Globle Mod...

REM Check if Node.js is installed
where node >nul 2>nul
if %errorlevel% neq 0 (
    echo ❌ Node.js is not installed
    echo Please install Node.js from https://nodejs.org/
    pause
    exit /b 1
)

REM Check if npm is installed
where npm >nul 2>nul
if %errorlevel% neq 0 (
    echo ❌ npm is not installed
    pause
    exit /b 1
)

echo ✅ Prerequisites check passed

REM Install dependencies
echo 📦 Installing dependencies...
call npm install
if %errorlevel% neq 0 (
    echo ❌ Failed to install dependencies
    pause
    exit /b 1
)

REM Build both client and server
echo 🔨 Building project...
call npm run build
if %errorlevel% neq 0 (
    echo ❌ Build failed
    pause
    exit /b 1
)

echo ✅ Build completed

REM Deploy Backend to Railway
echo.
echo 🚂 Deploying backend to Railway...

REM Check if Railway CLI is installed
where railway >nul 2>nul
if %errorlevel% neq 0 (
    echo ⚠️ Railway CLI is not installed. Installing...
    call npm install -g @railway/cli
    if %errorlevel% neq 0 (
        echo ❌ Failed to install Railway CLI
        pause
        exit /b 1
    )
)

REM Check if logged in to Railway
railway whoami >nul 2>nul
if %errorlevel% neq 0 (
    echo ⚠️ Not logged in to Railway. Please login...
    call railway login
    if %errorlevel% neq 0 (
        echo ❌ Railway login failed
        pause
        exit /b 1
    )
)

REM Deploy server
echo 🚀 Deploying server to Railway...
call railway up
if %errorlevel% neq 0 (
    echo ❌ Railway deployment failed
    echo Make sure you've linked your project with: railway link
    echo Or create a new project with: railway new
    pause
    exit /b 1
)

echo ✅ Backend deployed to Railway

REM Deploy Frontend to Vercel
echo.
echo 🌐 Deploying frontend to Vercel...

REM Check if Vercel CLI is installed
where vercel >nul 2>nul
if %errorlevel% neq 0 (
    echo ⚠️ Vercel CLI is not installed. Installing...
    call npm install -g vercel
    if %errorlevel% neq 0 (
        echo ❌ Failed to install Vercel CLI
        pause
        exit /b 1
    )
)

REM Deploy to Vercel
echo 🚀 Deploying to Vercel...
call vercel --prod
if %errorlevel% neq 0 (
    echo ❌ Vercel deployment failed
    echo Make sure you've linked your project or it will prompt you to create one
    pause
    exit /b 1
)

echo ✅ Frontend deployed to Vercel

echo.
echo 🎉 Deployment completed successfully!
echo.
echo 📋 Next steps:
echo 1. Get your Railway backend URL from: https://railway.app/dashboard
echo 2. Go to your Vercel project settings: https://vercel.com/dashboard
echo 3. Add environment variable: REACT_APP_SOCKET_URL=your-railway-backend-url
echo 4. Redeploy Vercel to apply the environment variable
echo.
echo 🔧 Commands for future deployments:
echo   Full build: npm run build
echo   Backend only: railway up
echo   Frontend only: vercel --prod
echo.
echo 📁 Your project structure:
echo   - Server files: ./server/
echo   - Client files: ./src/
echo   - Built server: ./dist/server/
echo   - Built client: ./build/

pause