#!/bin/bash

# MSSP Platform Database Setup Script
# This script automates the PostgreSQL database setup process

set -e  # Exit on any error

echo "🚀 MSSP Platform Database Setup"
echo "================================"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Database configuration
DB_NAME="mssp_platform"
DB_USER="mssp_user"
DB_PASSWORD="mssp_password"
DB_HOST="localhost"
DB_PORT="5432"

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

# Check if PostgreSQL is installed
check_postgresql() {
    print_status "Checking PostgreSQL installation..."
    
    if command -v psql &> /dev/null; then
        print_success "PostgreSQL is installed"
        psql --version
    else
        print_error "PostgreSQL is not installed or not in PATH"
        echo "Please install PostgreSQL using one of these methods:"
        echo "  - Homebrew: brew install postgresql@15"
        echo "  - PostgreSQL.app: https://postgresapp.com/"
        echo "  - Docker: See DATABASE_SETUP.md"
        exit 1
    fi
}

# Check if PostgreSQL is running
check_postgresql_running() {
    print_status "Checking if PostgreSQL is running..."
    
    if pg_isready -h $DB_HOST -p $DB_PORT &> /dev/null; then
        print_success "PostgreSQL is running on $DB_HOST:$DB_PORT"
    else
        print_error "PostgreSQL is not running on $DB_HOST:$DB_PORT"
        echo "Please start PostgreSQL:"
        echo "  - Homebrew: brew services start postgresql@15"
        echo "  - PostgreSQL.app: Start the application"
        echo "  - Docker: docker start mssp-postgres"
        exit 1
    fi
}

# Create database and user
create_database() {
    print_status "Creating database and user..."
    
    # Check if database already exists
    if psql -h $DB_HOST -p $DB_PORT -U postgres -lqt | cut -d \| -f 1 | grep -qw $DB_NAME; then
        print_warning "Database '$DB_NAME' already exists"
        read -p "Do you want to drop and recreate it? (y/N): " -n 1 -r
        echo
        if [[ $REPLY =~ ^[Yy]$ ]]; then
            print_status "Dropping existing database..."
            psql -h $DB_HOST -p $DB_PORT -U postgres -c "DROP DATABASE IF EXISTS $DB_NAME;"
            psql -h $DB_HOST -p $DB_PORT -U postgres -c "DROP USER IF EXISTS $DB_USER;"
        else
            print_status "Skipping database creation"
            return 0
        fi
    fi
    
    # Create user and database
    print_status "Creating user '$DB_USER'..."
    psql -h $DB_HOST -p $DB_PORT -U postgres -c "CREATE USER $DB_USER WITH PASSWORD '$DB_PASSWORD';"
    
    print_status "Creating database '$DB_NAME'..."
    psql -h $DB_HOST -p $DB_PORT -U postgres -c "CREATE DATABASE $DB_NAME OWNER $DB_USER;"
    
    print_status "Granting privileges..."
    psql -h $DB_HOST -p $DB_PORT -U postgres -c "GRANT ALL PRIVILEGES ON DATABASE $DB_NAME TO $DB_USER;"
    
    # Connect to the new database and set up extensions
    print_status "Setting up database extensions..."
    psql -h $DB_HOST -p $DB_PORT -U postgres -d $DB_NAME -c "CREATE EXTENSION IF NOT EXISTS \"uuid-ossp\";"
    psql -h $DB_HOST -p $DB_PORT -U postgres -d $DB_NAME -c "GRANT USAGE ON SCHEMA public TO $DB_USER;"
    psql -h $DB_HOST -p $DB_PORT -U postgres -d $DB_NAME -c "GRANT CREATE ON SCHEMA public TO $DB_USER;"
    
    print_success "Database setup completed successfully!"
}

# Create .env file
create_env_file() {
    print_status "Creating .env file..."
    
    if [ -f ".env" ]; then
        print_warning ".env file already exists"
        read -p "Do you want to overwrite it? (y/N): " -n 1 -r
        echo
        if [[ ! $REPLY =~ ^[Yy]$ ]]; then
            print_status "Skipping .env file creation"
            return 0
        fi
    fi
    
    # Generate a random JWT secret
    JWT_SECRET=$(openssl rand -base64 32 | tr -d "=+/" | cut -c1-32)
    
    cat > .env << EOF
# MSSP Platform API Environment Configuration
# Generated on $(date)

# Application Configuration
NODE_ENV=development
PORT=3000

# PostgreSQL Database Configuration
DB_HOST=$DB_HOST
DB_PORT=$DB_PORT
DB_USERNAME=$DB_USER
DB_PASSWORD=$DB_PASSWORD
DB_NAME=$DB_NAME

# JWT Authentication Configuration
JWT_SECRET=${JWT_SECRET}
JWT_EXPIRES_IN=60m
EOF
    
    print_success ".env file created successfully!"
}

# Test database connection
test_connection() {
    print_status "Testing database connection..."
    
    if psql -h $DB_HOST -p $DB_PORT -U $DB_USER -d $DB_NAME -c "SELECT version();" &> /dev/null; then
        print_success "Database connection test passed!"
    else
        print_error "Database connection test failed!"
        exit 1
    fi
}

# Run migrations
run_migrations() {
    print_status "Running database migrations..."
    
    if npm run migration:run; then
        print_success "Migrations completed successfully!"
    else
        print_error "Migration failed!"
        exit 1
    fi
}

# Verify setup
verify_setup() {
    print_status "Verifying database setup..."
    
    # Check if tables exist
    TABLES=$(psql -h $DB_HOST -p $DB_PORT -U $DB_USER -d $DB_NAME -t -c "SELECT COUNT(*) FROM information_schema.tables WHERE table_schema = 'public' AND table_type = 'BASE TABLE';")
    
    if [ "$TABLES" -gt 0 ]; then
        print_success "Database tables created successfully!"
        print_status "Tables in database:"
        psql -h $DB_HOST -p $DB_PORT -U $DB_USER -d $DB_NAME -c "\dt"
    else
        print_warning "No tables found in database"
    fi
}

# Main execution
main() {
    echo
    print_status "Starting MSSP Platform database setup..."
    echo
    
    check_postgresql
    check_postgresql_running
    create_database
    create_env_file
    test_connection
    run_migrations
    verify_setup
    
    echo
    print_success "🎉 Database setup completed successfully!"
    echo
    echo "Next steps:"
    echo "1. Start the application: npm run start:dev"
    echo "2. Check the logs for successful database connection"
    echo "3. Visit http://localhost:3000 to test the API"
    echo
    echo "Database connection details:"
    echo "  Host: $DB_HOST"
    echo "  Port: $DB_PORT"
    echo "  Database: $DB_NAME"
    echo "  Username: $DB_USER"
    echo
    echo "For more information, see DATABASE_SETUP.md"
}

# Run main function
main "$@" 