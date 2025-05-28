import { Module } from '@nestjs/common';
import { CoreModule } from './core/core.module';
import { AuthModule } from './modules/auth/auth.module';
import { ClientsModule } from './modules/clients/clients.module';
import { ServicesModule } from './modules/services/services.module';
import { ContractsModule } from './modules/contracts/contracts.module';
import { FilesModule } from './modules/files/files.module';
import { HardwareModule } from './modules/hardware/hardware.module';
import { FinancialsModule } from './modules/financials/financials.module';
import { TeamAssignmentsModule } from './modules/team-assignments/team-assignments.module';
import { MetricsModule } from './modules/metrics/metrics.module';
import { DashboardModule } from './modules/dashboard/dashboard.module';
import { IntegrationsModule } from './modules/integrations/integrations.module';
import { JiraIntegrationModule } from './modules/jira-integration/jira-integration.module';
import { AppController } from './app.controller';
import { AppService } from './app.service';

/**
 * AppModule - Root application module
 *
 * This module:
 * - Imports CoreModule for global configuration
 * - Imports AuthModule for user authentication
 * - Imports ClientsModule for client management
 * - Imports ServicesModule for service catalog management
 * - Imports ContractsModule for contract and service scope management
 * - Imports HardwareModule for hardware inventory and asset tracking
 * - Imports FinancialsModule for financial transaction tracking
 * - Imports TeamAssignmentsModule for client team assignment management
 * - Imports MetricsModule for dashboard metrics and reporting data
 * - Imports DashboardModule for dashboard aggregation and client overview
 * - Imports IntegrationsModule for external API integrations framework
 * - Imports JiraIntegrationModule for Jira DC ticket and SLA integration
 * - Sets up basic application structure
 * - Can be extended with feature modules
 */
@Module({
  imports: [
    CoreModule, 
    AuthModule, 
    ClientsModule, 
    ServicesModule, 
    ContractsModule,
    FilesModule,
    HardwareModule,
    FinancialsModule,
    TeamAssignmentsModule,
    MetricsModule,
    DashboardModule,
    IntegrationsModule,
    JiraIntegrationModule
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
