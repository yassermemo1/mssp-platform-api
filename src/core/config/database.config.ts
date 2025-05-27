import { registerAs } from '@nestjs/config';

/**
 * Database configuration interface for type safety
 */
export interface DatabaseConfig {
  host: string;
  port: number;
  username: string;
  password: string;
  name: string;
}

/**
 * Database configuration factory function
 * This provides typed access to database-related environment variables
 */
export const databaseConfig = registerAs(
  'database',
  (): DatabaseConfig => ({
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT, 10) || 5432,
    username: process.env.DB_USERNAME,
    password: process.env.DB_PASSWORD,
    name: process.env.DB_NAME,
  }),
);
