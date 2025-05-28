import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { HttpModule } from '@nestjs/axios';
import { CacheModule } from '@nestjs/cache-manager';
import { ConfigModule } from '@nestjs/config';

// Entities
import { ExternalDataSource } from './entities/external-data-source.entity';
import { DataSourceQuery } from './entities/data-source-query.entity';

// Services
import { EncryptionService } from './services/encryption.service';
import { DynamicDataFetcherService } from './services/dynamic-data-fetcher.service';
import { ExternalDataSourceService } from './services/external-data-source.service';
import { DataSourceQueryService } from './services/data-source-query.service';

// Controllers
import { IntegrationsAdminController } from './controllers/integrations-admin.controller';
import { IntegrationsDataController } from './controllers/integrations-data.controller';

/**
 * IntegrationsModule
 * Provides functionality for managing and querying external data sources
 */
@Module({
  imports: [
    TypeOrmModule.forFeature([ExternalDataSource, DataSourceQuery]),
    HttpModule.register({
      timeout: 30000,
      maxRedirects: 5,
    }),
    CacheModule.register({
      ttl: 300, // Default TTL of 5 minutes
      max: 100, // Maximum number of items in cache
    }),
    ConfigModule,
  ],
  controllers: [
    IntegrationsAdminController,
    IntegrationsDataController,
  ],
  providers: [
    EncryptionService,
    DynamicDataFetcherService,
    ExternalDataSourceService,
    DataSourceQueryService,
  ],
  exports: [
    DynamicDataFetcherService,
    ExternalDataSourceService,
    DataSourceQueryService,
  ],
})
export class IntegrationsModule {} 