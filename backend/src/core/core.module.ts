import { Global, Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { validationSchema } from './config/validation.schema';
import { databaseConfig } from './config/database.config';
import { jwtConfig } from './config/jwt.config';
import { ConfigDemoService } from './config/config-demo.service';
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
  ClientTeamAssignment,
  CustomFieldDefinition,
  CustomFieldValue,
  ExternalDataSource,
  DataSourceQuery
} from '../entities';

/**
 * CoreModule - Global module for shared application-wide services
 *
 * This module configures:
 * - Environment variable loading and validation
 * - Global ConfigService availability
 * - Custom configuration factories for organized config access
 * - TypeORM database connection and entity registration
 * - All MSSP platform entities (Users, Clients, Services, Contracts, ServiceScopes, Proposals, Hardware Assets, Hardware Assignments)
 */
@Global()
@Module({
  imports: [
    ConfigModule.forRoot({
      // Make ConfigService available globally without re-importing ConfigModule
      isGlobal: true,

      // Specify the environment file to load
      envFilePath: '.env',

      // Load custom configuration factories for organized config access
      load: [databaseConfig, jwtConfig],

      // Validate environment variables on application startup
      validationSchema,

      // Validation options
      validationOptions: {
        // Allow unknown environment variables (useful for system env vars)
        allowUnknown: true,

        // Abort application startup if validation fails
        abortEarly: true,
      },

      // Expand variables in .env file (e.g., ${VAR_NAME})
      expandVariables: true,
    }),
    
    // TypeORM configuration using existing database config
    TypeOrmModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        type: 'postgres',
        host: configService.get('database.host'),
        port: configService.get('database.port'),
        username: configService.get('database.username'),
        password: configService.get('database.password'),
        database: configService.get('database.name'),
        entities: [User, Client, Service, Contract, ServiceScope, Proposal, HardwareAsset, ClientHardwareAssignment, FinancialTransaction, ClientTeamAssignment, CustomFieldDefinition, CustomFieldValue, ExternalDataSource, DataSourceQuery],
        synchronize: false, // Disable synchronization to prevent enum conflicts
        logging: process.env.NODE_ENV === 'development',
        migrations: ['dist/migrations/*{.ts,.js}'],
        migrationsTableName: 'migrations',
        migrationsRun: false, // We'll run migrations manually
        ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
      }),
    }),

    // Register entities for dependency injection
    TypeOrmModule.forFeature([User, Client, Service, Contract, ServiceScope, Proposal, HardwareAsset, ClientHardwareAssignment, FinancialTransaction, ClientTeamAssignment, CustomFieldDefinition, CustomFieldValue, ExternalDataSource, DataSourceQuery]),
  ],
  providers: [ConfigDemoService],
  exports: [ConfigDemoService, TypeOrmModule],
})
export class CoreModule {}
