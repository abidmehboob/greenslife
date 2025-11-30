#!/bin/bash

# greenslife Docker Management Script

set -e

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

# Function to check if Docker is running
check_docker() {
    if ! docker info > /dev/null 2>&1; then
        print_error "Docker is not running. Please start Docker Desktop first."
        exit 1
    fi
}

# Function to start services
start_services() {
    print_status "Starting greenslife services with Docker Compose..."
    
    # Copy environment file
    if [ ! -f .env ]; then
        cp .env.docker .env
        print_status "Created .env file from .env.docker template"
    fi
    
    # Build and start services
    docker-compose up --build -d
    
    print_success "Services started successfully!"
    print_status "Waiting for services to be ready..."
    
    # Wait for MongoDB to be ready
    echo "Waiting for MongoDB to initialize..."
    sleep 10
    
    # Check service status
    docker-compose ps
    
    print_success "greenslife is now running!"
    echo ""
    echo "🌸 Frontend: http://localhost:3000"
    echo "🔧 Backend API: http://localhost:3001"
    echo "🍃 MongoDB: mongodb://admin:greenslife123@localhost:27017/flower-catalog"
    echo ""
    echo "To view logs: ./docker-manage.sh logs"
    echo "To stop: ./docker-manage.sh stop"
}

# Function to stop services
stop_services() {
    print_status "Stopping greenslife services..."
    docker-compose down
    print_success "Services stopped successfully!"
}

# Function to restart services
restart_services() {
    print_status "Restarting greenslife services..."
    docker-compose restart
    print_success "Services restarted successfully!"
}

# Function to view logs
view_logs() {
    if [ -n "$2" ]; then
        print_status "Showing logs for $2..."
        docker-compose logs -f "$2"
    else
        print_status "Showing logs for all services..."
        docker-compose logs -f
    fi
}

# Function to rebuild services
rebuild_services() {
    print_status "Rebuilding greenslife services..."
    docker-compose down
    docker-compose build --no-cache
    docker-compose up -d
    print_success "Services rebuilt and started successfully!"
}

# Function to show status
show_status() {
    print_status "Service status:"
    docker-compose ps
    echo ""
    print_status "Resource usage:"
    docker stats --no-stream
}

# Function to clean up
cleanup() {
    print_warning "This will remove all containers, images, and volumes. Are you sure? (y/n)"
    read -r response
    if [[ "$response" =~ ^[Yy]$ ]]; then
        print_status "Cleaning up Docker resources..."
        docker-compose down -v --rmi all
        docker system prune -f
        print_success "Cleanup completed!"
    else
        print_status "Cleanup cancelled."
    fi
}

# Function to access MongoDB shell
mongo_shell() {
    print_status "Connecting to MongoDB shell..."
    docker-compose exec mongodb mongosh -u admin -p greenslife123 --authenticationDatabase admin flower-catalog
}

# Function to backup database
backup_db() {
    print_status "Creating database backup..."
    timestamp=$(date +%Y%m%d_%H%M%S)
    mkdir -p backups
    
    # Backup MongoDB
    docker-compose exec mongodb mongodump --uri="mongodb://admin:greenslife123@localhost:27017/flower-catalog?authSource=admin" --out=/tmp/backup
    docker-compose cp mongodb:/tmp/backup ./backups/mongodb_backup_$timestamp
    
    # Backup SQLite
    docker-compose cp app:/app/database ./backups/sqlite_backup_$timestamp
    
    print_success "Backup created in ./backups/"
}

# Function to show help
show_help() {
    echo "greenslife Docker Management Script"
    echo ""
    echo "Usage: $0 [COMMAND]"
    echo ""
    echo "Commands:"
    echo "  start     Start all services"
    echo "  stop      Stop all services"
    echo "  restart   Restart all services"
    echo "  rebuild   Rebuild and restart all services"
    echo "  logs      View logs for all services"
    echo "  logs [service]  View logs for specific service (app, mongodb, frontend)"
    echo "  status    Show service status and resource usage"
    echo "  mongo     Access MongoDB shell"
    echo "  backup    Create database backup"
    echo "  cleanup   Remove all containers, images, and volumes"
    echo "  help      Show this help message"
    echo ""
    echo "Examples:"
    echo "  $0 start          # Start all services"
    echo "  $0 logs app       # View backend logs"
    echo "  $0 logs frontend  # View frontend logs"
    echo "  $0 mongo          # Access MongoDB shell"
}

# Main script logic
case "${1}" in
    start)
        check_docker
        start_services
        ;;
    stop)
        check_docker
        stop_services
        ;;
    restart)
        check_docker
        restart_services
        ;;
    rebuild)
        check_docker
        rebuild_services
        ;;
    logs)
        check_docker
        view_logs "$@"
        ;;
    status)
        check_docker
        show_status
        ;;
    mongo)
        check_docker
        mongo_shell
        ;;
    backup)
        check_docker
        backup_db
        ;;
    cleanup)
        check_docker
        cleanup
        ;;
    help|--help|-h)
        show_help
        ;;
    *)
        if [ -z "$1" ]; then
            show_help
        else
            print_error "Unknown command: $1"
            echo ""
            show_help
            exit 1
        fi
        ;;
esac