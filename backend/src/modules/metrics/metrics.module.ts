import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SLAMetric } from '../../entities/sla-metric.entity';
import { TicketSummary } from '../../entities/ticket-summary.entity';
import { ServicePerformanceMetric } from '../../entities/service-performance-metric.entity';
import { ClientSubscriptionSnapshot } from '../../entities/client-subscription-snapshot.entity';

/**
 * Metrics Module
 * Manages all dashboard and reporting related entities and services
 * Provides functionality for SLA tracking, ticket management, 
 * service performance monitoring, and subscription analytics
 */
@Module({
  imports: [
    TypeOrmModule.forFeature([
      SLAMetric,
      TicketSummary,
      ServicePerformanceMetric,
      ClientSubscriptionSnapshot,
    ]),
  ],
  providers: [
    // Services will be added in future chunks for:
    // - SLAMetricsService
    // - TicketSummaryService
    // - ServicePerformanceService
    // - SubscriptionSnapshotService
    // - DashboardAggregationService
  ],
  controllers: [
    // Controllers will be added in future chunks for:
    // - SLAMetricsController
    // - TicketsController
    // - ServiceMetricsController
    // - DashboardController
  ],
  exports: [
    TypeOrmModule, // Export TypeORM features for use in other modules
  ],
})
export class MetricsModule {} 