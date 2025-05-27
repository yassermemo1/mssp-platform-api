# MSSP Platform Quick Start Guide

## 🚀 Quick Database Setup

### Option 1: Automated Setup (Recommended)
```bash
# Run the automated setup script
npm run db:setup
```

This script will:
- ✅ Check PostgreSQL installation
- ✅ Create database and user
- ✅ Generate .env file with secure JWT secret
- ✅ Run migrations
- ✅ Verify setup

### Option 2: Manual Setup
```bash
# 1. Install PostgreSQL (if not installed)
brew install postgresql@15
brew services start postgresql@15

# 2. Create database manually
psql postgres -c "CREATE USER mssp_user WITH PASSWORD 'mssp_password';"
psql postgres -c "CREATE DATABASE mssp_platform OWNER mssp_user;"

# 3. Create .env file
cp .env.example .env
# Edit .env with your database credentials

# 4. Run migrations
npm run migration:run
```

## 🏃‍♂️ Start the Application

```bash
# Start in development mode
npm run start:dev

# The API will be available at:
# http://localhost:3000
```

## 🔍 Verify Everything Works

```bash
# Check database connection
curl http://localhost:3000/config/database

# Check server status
curl http://localhost:3000/

# View migration status
npm run migration:show
```

## 📊 Database Schema

After setup, you'll have these tables:

### Users Table
- **Purpose**: Internal MSSP team members
- **Fields**: id, firstName, lastName, email, password, role, isActive, timestamps
- **Roles**: admin, manager, project_manager, account_manager, engineer

### Clients Table
- **Purpose**: MSSP clients/customers
- **Fields**: id, companyName, contactName, contactEmail, contactPhone, address, industry, status, timestamps
- **Statuses**: prospect, active, inactive, expired, renewed

## 🛠️ Common Commands

```bash
# Database Management
npm run migration:show      # Show migration status
npm run migration:run       # Run pending migrations
npm run migration:revert    # Revert last migration

# Development
npm run start:dev          # Start with hot reload
npm run lint              # Check code quality
npm run test              # Run tests
npm run build             # Build for production

# Database Connection
psql -h localhost -U mssp_user -d mssp_platform  # Connect to database
```

## 🚨 Troubleshooting

### PostgreSQL not running?
```bash
# Check status
brew services list | grep postgresql

# Start PostgreSQL
brew services start postgresql@15
```

### Connection issues?
```bash
# Test connection
pg_isready -h localhost -p 5432

# Check .env file has correct credentials
cat .env
```

### Migration errors?
```bash
# Check migration status
npm run migration:show

# Reset database (CAUTION: Deletes all data)
npm run schema:drop
npm run migration:run
```

## 📚 Next Steps

1. ✅ Database setup complete
2. 🔄 Implement User authentication (Chunk 1.3)
3. 🔄 Create Client CRUD APIs (Chunk 1.4)
4. 🔄 Build React frontend
5. 🔄 Add more features...

For detailed information, see:
- `DATABASE_SETUP.md` - Complete database setup guide
- `README.md` - Full project documentation 