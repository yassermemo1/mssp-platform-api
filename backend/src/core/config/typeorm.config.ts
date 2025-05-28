import { DataSource } from 'typeorm';
import { ConfigService } from '@nestjs/config';
import { config } from 'dotenv';
import { 
  User, 
  Client, 
  Service, 
  Contract, 
  ServiceScope, 
  Proposal,
  HardwareAsset,
  ClientHardwareAssignment,
  FinancialTransaction,
  ClientTeamAssignment
} from '../../entities';

// Load environment variables
config();

const configService = new ConfigService();

/**
 * TypeORM DataSource configuration for migrations
 * This configuration is used by TypeORM CLI for generating and running migrations
 * Includes all MSSP platform entities for comprehensive schema management
 */
export const AppDataSource = new DataSource({
  type: 'postgres',
  host: configService.get('DB_HOST') || 'localhost',
  port: parseInt(configService.get('DB_PORT'), 10) || 5432,
  username: configService.get('DB_USERNAME'),
  password: configService.get('DB_PASSWORD'),
  database: configService.get('DB_NAME'),
  entities: [User, Client, Service, Contract, ServiceScope, Proposal, HardwareAsset, ClientHardwareAssignment, FinancialTransaction, ClientTeamAssignment],
  migrations: ['src/migrations/*{.ts,.js}'],
  migrationsTableName: 'migrations',
  synchronize: false, // Never use synchronize in production
  logging: process.env.NODE_ENV === 'development',
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
}); 