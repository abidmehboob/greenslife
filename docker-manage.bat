@echo off
REM greenslife Docker Management Script for Windows

setlocal enabledelayedexpansion

REM Function to print colored output (Windows doesn't support colors in batch easily)
echo greenslife Docker Management Script
echo =====================================

REM Check if Docker is running
docker info >nul 2>&1
if errorlevel 1 (
    echo [ERROR] Docker is not running. Please start Docker Desktop first.
    exit /b 1
)

REM Main script logic
if "%1"=="start" goto start
if "%1"=="stop" goto stop
if "%1"=="restart" goto restart
if "%1"=="rebuild" goto rebuild
if "%1"=="logs" goto logs
if "%1"=="status" goto status
if "%1"=="mongo" goto mongo
if "%1"=="backup" goto backup
if "%1"=="cleanup" goto cleanup
if "%1"=="help" goto help
if "%1"=="" goto help
echo [ERROR] Unknown command: %1
goto help

:start
echo [INFO] Starting greenslife services with Docker Compose...

REM Copy environment file if it doesn't exist
if not exist .env (
    copy .env.docker .env
    echo [INFO] Created .env file from .env.docker template
)

REM Build and start services
docker-compose up --build -d

echo [SUCCESS] Services started successfully!
echo [INFO] Waiting for services to be ready...

REM Wait for MongoDB to initialize
echo Waiting for MongoDB to initialize...
timeout /t 10 /nobreak >nul

REM Check service status
docker-compose ps

echo [SUCCESS] greenslife is now running!
echo.
echo 🌸 Frontend: http://localhost:3000
echo 🔧 Backend API: http://localhost:3001
echo 🍃 MongoDB: mongodb://admin:greenslife123@localhost:27017/flower-catalog
echo.
echo To view logs: docker-manage.bat logs
echo To stop: docker-manage.bat stop
goto end

:stop
echo [INFO] Stopping greenslife services...
docker-compose down
echo [SUCCESS] Services stopped successfully!
goto end

:restart
echo [INFO] Restarting greenslife services...
docker-compose restart
echo [SUCCESS] Services restarted successfully!
goto end

:rebuild
echo [INFO] Rebuilding greenslife services...
docker-compose down
docker-compose build --no-cache
docker-compose up -d
echo [SUCCESS] Services rebuilt and started successfully!
goto end

:logs
if not "%2"=="" (
    echo [INFO] Showing logs for %2...
    docker-compose logs -f %2
) else (
    echo [INFO] Showing logs for all services...
    docker-compose logs -f
)
goto end

:status
echo [INFO] Service status:
docker-compose ps
echo.
echo [INFO] Resource usage:
docker stats --no-stream
goto end

:mongo
echo [INFO] Connecting to MongoDB shell...
docker-compose exec mongodb mongosh -u admin -p greenslife123 --authenticationDatabase admin flower-catalog
goto end

:backup
echo [INFO] Creating database backup...
set timestamp=%date:~-4,4%%date:~-10,2%%date:~-7,2%_%time:~0,2%%time:~3,2%%time:~6,2%
set timestamp=%timestamp: =0%

if not exist backups mkdir backups

REM Backup MongoDB
docker-compose exec mongodb mongodump --uri="mongodb://admin:greenslife123@localhost:27017/flower-catalog?authSource=admin" --out=/tmp/backup
docker-compose cp mongodb:/tmp/backup ./backups/mongodb_backup_%timestamp%

REM Backup SQLite
docker-compose cp app:/app/database ./backups/sqlite_backup_%timestamp%

echo [SUCCESS] Backup created in ./backups/
goto end

:cleanup
set /p response="[WARNING] This will remove all containers, images, and volumes. Are you sure? (y/n): "
if /i "%response%"=="y" (
    echo [INFO] Cleaning up Docker resources...
    docker-compose down -v --rmi all
    docker system prune -f
    echo [SUCCESS] Cleanup completed!
) else (
    echo [INFO] Cleanup cancelled.
)
goto end

:help
echo greenslife Docker Management Script
echo.
echo Usage: %0 [COMMAND]
echo.
echo Commands:
echo   start     Start all services
echo   stop      Stop all services
echo   restart   Restart all services
echo   rebuild   Rebuild and restart all services
echo   logs      View logs for all services
echo   logs [service]  View logs for specific service (app, mongodb, frontend^)
echo   status    Show service status and resource usage
echo   mongo     Access MongoDB shell
echo   backup    Create database backup
echo   cleanup   Remove all containers, images, and volumes
echo   help      Show this help message
echo.
echo Examples:
echo   %0 start          # Start all services
echo   %0 logs app       # View backend logs
echo   %0 logs frontend  # View frontend logs
echo   %0 mongo          # Access MongoDB shell

:end
endlocal