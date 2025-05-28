import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DashboardController } from './dashboard.controller';
import { DashboardDataService } from './dashboard-data.service';
import { ClientOverviewController } from './client-overview.controller';
import { ClientOverviewService } from './client-overview.service';
import { IntegrationsModule } from '../integrations/integrations.module';

// Import all entities needed for dashboard queries
import {
  Client,
  Contract,
  ServiceScope,
  Service,
  Proposal,
  HardwareAsset,
  ClientHardwareAssignment,
  FinancialTransaction,
  ClientTeamAssignment,
  SLAMetric,
  TicketSummary,
  ServicePerformanceMetric,
  ClientSubscriptionSnapshot,
} from '../../entities';

/**
 * Dashboard Module
 * Provides aggregated data APIs for operational dashboards and client 360 views
 * Handles complex queries and data aggregation for visualization
 */
@Module({
  imports: [
    TypeOrmModule.forFeature([
      Client,
      Contract,
      ServiceScope,
      Service,
      Proposal,
      HardwareAsset,
      ClientHardwareAssignment,
      FinancialTransaction,
      ClientTeamAssignment,
      SLAMetric,
      TicketSummary,
      ServicePerformanceMetric,
      ClientSubscriptionSnapshot,
    ]),
    IntegrationsModule,
  ],
  controllers: [DashboardController, ClientOverviewController],
  providers: [DashboardDataService, ClientOverviewService],
  exports: [DashboardDataService, ClientOverviewService],
})
export class DashboardModule {} 