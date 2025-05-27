# 🚀 MSSP Client Management Platform

A comprehensive full-stack application for Managed Security Service Provider (MSSP) client management, built with modern technologies and best practices.

## 📋 Project Overview

**Current Date & Time**: Tuesday, May 27, 2025, 11:35 PM (Riyadh Time, +03)  
**Location**: Riyadh, Saudi Arabia  
**Architecture**: Monorepo with separate backend and frontend applications

## 🏗️ Project Structure

```
mssp-platform-api/
├── backend/                 # NestJS Backend API
│   ├── src/                # Source code
│   ├── test/               # Test files
│   ├── package.json        # Backend dependencies
│   └── tsconfig.json       # TypeScript configuration
├── frontend/               # React Frontend Application
│   ├── src/                # Source code
│   ├── public/             # Static assets
│   ├── package.json        # Frontend dependencies
│   └── tsconfig.json       # TypeScript configuration
├── .github/
│   └── workflows/
│       └── ci.yml          # CI/CD Pipeline
├── .gitignore              # Git ignore rules
└── README.md               # This file
```

## 🛠️ Technology Stack

### Backend (NestJS)
- **Framework**: NestJS with TypeScript
- **Database**: PostgreSQL (standalone setup)
- **Configuration**: @nestjs/config with Joi validation
- **Testing**: Jest with coverage reporting
- **Code Quality**: ESLint + Prettier

### Frontend (React)
- **Framework**: React 19.x with TypeScript
- **Build Tool**: Create React App
- **Testing**: React Testing Library + Jest
- **Code Quality**: ESLint (react-app config)

## 🚀 CI/CD Pipeline

Our GitHub Actions workflow provides comprehensive continuous integration for both backend and frontend applications.

### Workflow Features

#### 🎯 **Triggers**
- Push events to `main`, `master`, and `develop` branches
- Pull requests targeting primary branches
- Smart path filtering to optimize CI runs

#### 🔧 **Backend CI Job** (`backend-ci`)
- **Environment**: Ubuntu 22.04 LTS
- **Node.js Versions**: 18.x, 20.x (matrix strategy)
- **Working Directory**: `./backend`
- **Path Filtering**: Runs only when backend files change

**Steps:**
1. 📥 Code checkout with full history
2. 🟢 Node.js setup with npm caching
3. 📦 Dependency installation (`npm ci`)
4. 🎨 Code formatting check (Prettier)
5. 🔍 Linting (ESLint)
6. 🏗️ Build verification
7. 🧪 Unit tests with coverage
8. 📊 Coverage artifact upload
9. 🔒 Security audit

#### ⚛️ **Frontend CI Job** (`frontend-ci`)
- **Environment**: Ubuntu 22.04 LTS
- **Node.js Versions**: 18.x, 20.x (matrix strategy)
- **Working Directory**: `./frontend`
- **Path Filtering**: Runs only when frontend files change

**Steps:**
1. 📥 Code checkout with full history
2. 🟢 Node.js setup with npm caching
3. 📦 Dependency installation (`npm ci`)
4. 🔍 Linting (ESLint)
5. 🔧 TypeScript type checking
6. 🧪 Unit tests with coverage
7. 🏗️ Production build verification
8. 📦 Build artifact upload
9. 🔒 Security audit

#### 🔗 **Integration Checks** (`integration-checks`)
- Runs after both backend and frontend jobs
- Downloads all artifacts
- Generates comprehensive CI summary
- Marks overall success/failure status

### Key CI/CD Design Decisions

#### **Node.js Version Choice: 20.x LTS**
- **Primary**: Node.js 20.x (latest LTS for stability and performance)
- **Compatibility**: Also tested against 18.x for broader compatibility
- **Justification**: 20.x provides the latest features while maintaining long-term support

#### **Package Manager: npm**
- **Choice**: npm with `npm ci` for reproducible builds
- **Caching**: Aggressive dependency caching using `actions/setup-node@v4`
- **Optimization**: `--prefer-offline --no-audit` flags for faster CI runs

#### **Path Filtering Implementation**
```yaml
# Backend job only runs when backend files change
if: |
  contains(github.event.head_commit.modified, 'backend/') ||
  contains(github.event.head_commit.added, 'backend/') ||
  contains(github.event.head_commit.removed, 'backend/') ||
  contains(github.event.head_commit.modified, '.github/workflows/') ||
  github.event_name == 'pull_request'
```

#### **Caching Strategy**
- **Dependency Caching**: Automatic npm cache via `actions/setup-node@v4`
- **Cache Keys**: Based on `package-lock.json` files
- **Performance**: Reduces dependency installation time by ~60%

#### **Artifact Management**
- **Backend**: Coverage reports and test results
- **Frontend**: Build artifacts and coverage reports
- **Retention**: 30 days for analysis and debugging
- **Optimization**: Only upload from Node.js 20.x matrix to avoid duplicates

## 🚦 Getting Started

### Prerequisites
- Node.js 18.x or 20.x
- npm 9.x or higher
- PostgreSQL 14+ (for backend)

### Backend Setup
```bash
cd backend
npm install
cp .env.example .env
# Configure your environment variables
npm run start:dev
```

### Frontend Setup
```bash
cd frontend
npm install
npm start
```

### Running Tests
```bash
# Backend tests
cd backend
npm test
npm run test:cov

# Frontend tests
cd frontend
npm test
npm test -- --coverage --watchAll=false
```

### Code Quality
```bash
# Backend
cd backend
npm run lint
npm run format:check

# Frontend
cd frontend
npm run lint
```

## 📊 CI/CD Status

The CI pipeline automatically runs on every push and pull request, ensuring:

- ✅ Code quality standards (ESLint + Prettier)
- ✅ Type safety (TypeScript compilation)
- ✅ Test coverage and reliability
- ✅ Build verification
- ✅ Security vulnerability scanning
- ✅ Cross-version compatibility (Node.js 18.x & 20.x)

## 🔧 Configuration

### Environment Variables (Backend)
```bash
# Application
NODE_ENV=development
PORT=3000

# Database
DB_HOST=localhost
DB_PORT=5432
DB_USERNAME=your_username
DB_PASSWORD=your_password
DB_DATABASE=mssp_platform

# JWT
JWT_SECRET=your-super-secure-jwt-secret-key-here
JWT_EXPIRES_IN=24h
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Make your changes
4. Ensure all tests pass (`npm test` in both backend and frontend)
5. Commit your changes (`git commit -m 'Add amazing feature'`)
6. Push to the branch (`git push origin feature/amazing-feature`)
7. Open a Pull Request

The CI pipeline will automatically run and validate your changes!

## 📝 License

This project is licensed under the UNLICENSED License - see the backend package.json for details.

## 🏢 Development Team

**MSSP Development Team**  
Riyadh, Saudi Arabia  
May 2025

---

*Built with ❤️ using NestJS, React, and modern DevOps practices* 