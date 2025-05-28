import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule } from '@nestjs/config';
import { Client } from '../../entities';
import { IntegrationsModule } from '../integrations/integrations.module';
import { JiraConfigService } from './services/jira-config.service';
import { JiraDataService } from './services/jira-data.service';
import { JiraDataController } from './jira-data.controller';

/**
 * JiraIntegrationModule
 * Provides Jira integration functionality using the Dynamic Data Source Framework
 */
@Module({
  imports: [
    TypeOrmModule.forFeature([Client]),
    ConfigModule,
    IntegrationsModule // Import to access DynamicDataFetcherService and configuration services
  ],
  controllers: [
    JiraDataController
  ],
  providers: [
    JiraConfigService,
    JiraDataService
  ],
  exports: [
    JiraDataService // Export for use in other modules like dashboard
  ]
})
export class JiraIntegrationModule {} 