@echo off
echo 🚀 Deploying Greens Life Application...

REM Check if .env file exists
if not exist .env (
    echo ⚠️  .env file not found. Creating from example...
    copy .env.example .env >nul
    echo 📝 Please edit .env file with your configuration before running again.
    exit /b 1
)

REM Build and start production containers
echo 🔨 Building production containers...
docker-compose -f docker-compose.prod.yml build

echo 🚀 Starting production deployment...
docker-compose -f docker-compose.prod.yml up -d

echo ⏳ Waiting for services to be ready...
timeout /t 30 >nul

REM Check if services are running
echo 🔍 Checking service health...
docker-compose -f docker-compose.prod.yml ps | findstr "Up" >nul
if %errorlevel% equ 0 (
    echo ✅ Deployment successful!
    echo.
    echo 🌐 Your application is now running:
    echo    Frontend: http://localhost
    echo    Backend API: http://localhost:3001
    echo    MongoDB: localhost:27017
    echo.
    echo 📊 View logs:
    echo    docker-compose -f docker-compose.prod.yml logs -f
    echo.
    echo 🛑 Stop deployment:
    echo    docker-compose -f docker-compose.prod.yml down
) else (
    echo ❌ Deployment failed. Check logs:
    docker-compose -f docker-compose.prod.yml logs
)