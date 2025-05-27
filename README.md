# MSSP Client Management Platform - Backend API

A robust NestJS backend API for the MSSP (Managed Security Service Provider) Client Management Platform, built with TypeScript, PostgreSQL, and comprehensive configuration management.

## 🚀 Features

- **Robust Configuration Management**: Environment variable validation with Joi
- **Type-Safe Configuration**: Custom configuration factories with TypeScript interfaces
- **Global Configuration Access**: ConfigService available application-wide
- **Environment Validation**: Startup validation ensures all required variables are present
- **Organized Structure**: Modular architecture with core and feature modules

## 📋 Prerequisites

- Node.js (v18 or higher)
- npm or yarn
- PostgreSQL (for database connectivity)

## 🛠️ Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd mssp-platform-api
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   ```bash
   # Copy the example environment file
   cp .env.example .env
   
   # Edit .env with your actual values
   nano .env
   ```

## ⚙️ Configuration

### Environment Variables

The application requires the following environment variables:

| Variable | Description | Required | Default |
|----------|-------------|----------|---------|
| `NODE_ENV` | Application environment (development/production/test) | No | development |
| `PORT` | Server port number | No | 3000 |
| `DB_HOST` | PostgreSQL database host | Yes | - |
| `DB_PORT` | PostgreSQL database port | No | 5432 |
| `DB_USERNAME` | PostgreSQL username | Yes | - |
| `DB_PASSWORD` | PostgreSQL password | Yes | - |
| `DB_NAME` | PostgreSQL database name | Yes | - |
| `JWT_SECRET` | JWT secret key (min 32 characters) | Yes | - |
| `JWT_EXPIRES_IN` | JWT token expiration time | No | 60m |

### Configuration Structure

The application uses a modular configuration approach:

- **`src/core/config/validation.schema.ts`**: Joi validation schema for all environment variables
- **`src/core/config/database.config.ts`**: Database configuration factory
- **`src/core/config/jwt.config.ts`**: JWT configuration factory
- **`src/core/core.module.ts`**: Global configuration module setup

## 🏃‍♂️ Running the Application

### Development Mode
```bash
npm run start:dev
```

### Production Mode
```bash
npm run build
npm run start:prod
```

### Debug Mode
```bash
npm run start:debug
```

## 🧪 Testing the Configuration

Once the application is running, you can test the configuration endpoints:

- **Basic Info**: `GET http://localhost:3000/`
- **Server Config**: `GET http://localhost:3000/config/server`
- **Database Config**: `GET http://localhost:3000/config/database`
- **JWT Config**: `GET http://localhost:3000/config/jwt`
- **Environment Info**: `GET http://localhost:3000/config/environment`

## 📁 Project Structure

```
src/
├── core/                    # Core application modules
│   ├── config/             # Configuration management
│   │   ├── validation.schema.ts    # Environment validation
│   │   ├── database.config.ts      # Database configuration
│   │   ├── jwt.config.ts           # JWT configuration
│   │   └── config-demo.service.ts  # Configuration usage examples
│   └── core.module.ts      # Global core module
├── modules/                # Feature modules (to be added)
├── app.controller.ts       # Main application controller
├── app.service.ts          # Main application service
├── app.module.ts           # Root application module
└── main.ts                 # Application bootstrap
```

## 🔧 Configuration Usage Examples

### Injecting ConfigService

```typescript
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class MyService {
  constructor(private readonly configService: ConfigService) {}

  // Access direct environment variable
  getPort(): number {
    return this.configService.get<number>('PORT', 3000);
  }

  // Access custom configuration object
  getDatabaseConfig() {
    return this.configService.get('database');
  }

  // Access specific property from custom config
  getDatabaseHost(): string {
    return this.configService.get<string>('database.host');
  }
}
```

### Type-Safe Configuration Access

```typescript
import { DatabaseConfig } from '@core/config/database.config';
import { JwtConfig } from '@core/config/jwt.config';

// Get typed configuration objects
const dbConfig = this.configService.get<DatabaseConfig>('database');
const jwtConfig = this.configService.get<JwtConfig>('jwt');
```

## 🔒 Security Notes

- Never commit your `.env` file to version control
- Use strong, unique JWT secrets (minimum 32 characters)
- Rotate JWT secrets regularly in production
- Use environment-specific configuration files for different deployment stages

## 📝 Scripts

- `npm run build` - Build the application
- `npm run start` - Start the application
- `npm run start:dev` - Start in development mode with hot reload
- `npm run start:debug` - Start in debug mode
- `npm run start:prod` - Start in production mode
- `npm run test` - Run tests
- `npm run test:watch` - Run tests in watch mode
- `npm run test:cov` - Run tests with coverage
- `npm run lint` - Lint the code
- `npm run format` - Format the code

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## 📄 License

This project is licensed under the UNLICENSED license - see the package.json file for details.

---

**Note**: This is the foundational configuration setup for the MSSP Platform API. Database integration, authentication, and business logic modules will be added in subsequent development phases. 