# PostgreSQL Database Setup for MSSP Platform

This guide will help you set up PostgreSQL for the MSSP Client Management Platform.

## Prerequisites

- PostgreSQL 14+ installed on your system
- Node.js and npm (already installed)
- Access to PostgreSQL command line tools (`psql`, `createdb`)

## Installation Options

### Option 1: Using Homebrew (macOS)
```bash
# Install PostgreSQL
brew install postgresql@15

# Start PostgreSQL service
brew services start postgresql@15

# Add PostgreSQL to your PATH (add to ~/.zshrc or ~/.bash_profile)
export PATH="/opt/homebrew/opt/postgresql@15/bin:$PATH"
```

### Option 2: Using PostgreSQL.app (macOS)
1. Download from https://postgresapp.com/
2. Install and start the app
3. Add to PATH: `/Applications/Postgres.app/Contents/Versions/latest/bin`

### Option 3: Using Docker
```bash
# Run PostgreSQL in Docker
docker run --name mssp-postgres \
  -e POSTGRES_USER=mssp_user \
  -e POSTGRES_PASSWORD=mssp_password \
  -e POSTGRES_DB=mssp_platform \
  -p 5432:5432 \
  -d postgres:15-alpine

# To stop: docker stop mssp-postgres
# To start: docker start mssp-postgres
```

## Database Setup

### Step 1: Create Database and User

```bash
# Connect to PostgreSQL as superuser
psql postgres

# Create user
CREATE USER mssp_user WITH PASSWORD 'mssp_password';

# Create database
CREATE DATABASE mssp_platform OWNER mssp_user;

# Grant privileges
GRANT ALL PRIVILEGES ON DATABASE mssp_platform TO mssp_user;

# Enable UUID extension (required for our entities)
\c mssp_platform
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

# Grant usage on schema
GRANT USAGE ON SCHEMA public TO mssp_user;
GRANT CREATE ON SCHEMA public TO mssp_user;

# Exit psql
\q
```

### Step 2: Configure Environment Variables

Create a `.env` file in the backend directory:

```bash
# Copy the example file
cp .env.example .env
```

Edit `.env` with your database credentials:
```env
# Application Configuration
NODE_ENV=development
PORT=3000

# PostgreSQL Database Configuration
DB_HOST=localhost
DB_PORT=5432
DB_USERNAME=mssp_user
DB_PASSWORD=mssp_password
DB_NAME=mssp_platform

# JWT Authentication Configuration
JWT_SECRET=your_super_secret_jwt_key_please_change_me_minimum_32_characters
JWT_EXPIRES_IN=60m
```

### Step 3: Run Database Migrations

```bash
# Navigate to backend directory
cd backend

# Run the initial migration to create tables
npm run migration:run

# Verify migration was successful
npm run migration:show
```

## Database Schema

After running migrations, your database will have:

### Tables Created:
- **users**: Internal MSSP team members
- **clients**: MSSP clients/customers

### Enums Created:
- **user_role_enum**: admin, manager, project_manager, account_manager, engineer
- **client_status_enum**: prospect, active, inactive, expired, renewed

## Verification

### Test Database Connection
```bash
# Test connection using psql
psql -h localhost -p 5432 -U mssp_user -d mssp_platform

# List tables
\dt

# Describe users table
\d users

# Describe clients table
\d clients

# Exit
\q
```

### Test Application Connection
```bash
# Start the NestJS application
npm run start:dev

# Check logs for successful database connection
# You should see TypeORM connection logs
```

## Useful Commands

### Migration Commands
```bash
# Show migration status
npm run migration:show

# Run pending migrations
npm run migration:run

# Revert last migration
npm run migration:revert

# Generate new migration (after entity changes)
npm run migration:generate src/migrations/YourMigrationName

# Create empty migration file
npm run migration:create src/migrations/YourMigrationName
```

### Database Management
```bash
# Connect to database
psql -h localhost -p 5432 -U mssp_user -d mssp_platform

# Backup database
pg_dump -h localhost -p 5432 -U mssp_user mssp_platform > backup.sql

# Restore database
psql -h localhost -p 5432 -U mssp_user mssp_platform < backup.sql

# Drop and recreate database (CAUTION: This deletes all data)
dropdb -h localhost -p 5432 -U mssp_user mssp_platform
createdb -h localhost -p 5432 -U mssp_user mssp_platform
```

## Troubleshooting

### Common Issues

1. **Connection refused**
   - Ensure PostgreSQL is running: `brew services list | grep postgresql`
   - Check if port 5432 is available: `lsof -i :5432`

2. **Authentication failed**
   - Verify username/password in `.env`
   - Check PostgreSQL authentication settings in `pg_hba.conf`

3. **Database does not exist**
   - Create the database using the commands in Step 1
   - Verify database name matches `.env` configuration

4. **Permission denied**
   - Ensure user has proper privileges on the database
   - Run the GRANT commands from Step 1

### Reset Database (Development Only)
```bash
# Drop all tables and recreate schema
npm run schema:drop
npm run migration:run
```

## Security Notes

- Change default passwords in production
- Use environment-specific `.env` files
- Never commit `.env` files to version control
- Consider using connection pooling for production
- Enable SSL for production databases

## Next Steps

After setting up the database:
1. Test the application: `npm run start:dev`
2. Verify entities are working by checking the logs
3. Proceed to implement CRUD operations for Users and Clients
4. Set up authentication and authorization 