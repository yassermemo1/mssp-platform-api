import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { DatabaseConfig } from './database.config';
import { JwtConfig } from './jwt.config';

/**
 * ConfigDemoService - Demonstrates how to use ConfigService
 *
 * This service shows examples of:
 * - Injecting ConfigService
 * - Accessing direct environment variables with type safety
 * - Accessing custom configuration objects
 * - Using default values and type casting
 */
@Injectable()
export class ConfigDemoService {
  constructor(private readonly configService: ConfigService) {}

  /**
   * Example: Accessing direct environment variables
   */
  getServerConfiguration() {
    // Access PORT with type casting and default value
    const port = this.configService.get<number>('PORT', 3000);

    // Access NODE_ENV with type safety
    const nodeEnv = this.configService.get<string>('NODE_ENV');

    return {
      port,
      nodeEnv,
      isProduction: nodeEnv === 'production',
      isDevelopment: nodeEnv === 'development',
    };
  }

  /**
   * Example: Accessing custom configuration objects
   */
  getDatabaseConfiguration(): DatabaseConfig {
    // Access the entire database configuration object
    return this.configService.get<DatabaseConfig>('database');
  }

  /**
   * Example: Accessing specific values from custom configuration
   */
  getDatabaseHost(): string {
    // Access a specific property from the database configuration
    return this.configService.get<string>('database.host');
  }

  /**
   * Example: Accessing JWT configuration
   */
  getJwtConfiguration(): JwtConfig {
    return this.configService.get<JwtConfig>('jwt');
  }

  /**
   * Example: Building a connection string using configuration values
   */
  buildDatabaseConnectionString(): string {
    const dbConfig = this.getDatabaseConfiguration();
    return `postgresql://${dbConfig.username}:${dbConfig.password}@${dbConfig.host}:${dbConfig.port}/${dbConfig.name}`;
  }

  /**
   * Example: Conditional logic based on environment
   */
  getLogLevel(): string {
    const nodeEnv = this.configService.get<string>('NODE_ENV');

    switch (nodeEnv) {
      case 'production':
        return 'error';
      case 'test':
        return 'silent';
      default:
        return 'debug';
    }
  }

  /**
   * Example: Accessing environment variable with validation
   */
  getJwtSecret(): string {
    const secret = this.configService.get<string>('jwt.secret');

    if (!secret) {
      throw new Error('JWT_SECRET is required but not configured');
    }

    if (secret.length < 32) {
      throw new Error('JWT_SECRET must be at least 32 characters long');
    }

    return secret;
  }
}
