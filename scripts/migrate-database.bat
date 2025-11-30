@echo off
echo ========================================
echo   greenslife - Database Migration
echo ========================================
echo.

REM Check if Docker is running
docker info >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ Docker is not running. Please start Docker Desktop first.
    echo.
    pause
    exit /b 1
)

echo 🔍 Checking if MongoDB container is running...
docker ps --filter "name=greenslife-mongodb" --format "table {{.Names}}\t{{.Status}}" | findstr greenslife-mongodb >nul
if %errorlevel% neq 0 (
    echo ❌ MongoDB container is not running.
    echo 🚀 Starting greenslife containers...
    docker-compose -f docker-compose.yml up -d
    echo ⏳ Waiting 10 seconds for MongoDB to start...
    timeout /t 10 /nobreak >nul
) else (
    echo ✅ MongoDB container is running
)

echo.
echo 🗄️ Running database migration...
echo.

REM Run the migration script
node scripts/migrateCarnationData.js

echo.
if %errorlevel% equ 0 (
    echo ✅ Migration completed successfully!
    echo.
    echo 🌐 Your application now uses MongoDB for:
    echo    - Product catalog ^(flowers^)
    echo    - Categories
    echo    - Admin product management
    echo.
    echo 🚀 Start your application with:
    echo    npm start   ^(backend^)
    echo    cd client ^&^& npm start   ^(frontend^)
    echo.
) else (
    echo ❌ Migration failed. Please check the error messages above.
    echo.
)

pause