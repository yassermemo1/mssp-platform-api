import { ApiProperty } from '@nestjs/swagger';
import { ServiceMetricType } from '../../../enums/service-metric-type.enum';

/**
 * Service Gauge Metric
 */
export class ServiceGaugeMetricDto {
  @ApiProperty({ description: 'Service type (EDR, SIEM, NDR)' })
  serviceType: string;

  @ApiProperty({ description: 'Metric type' })
  metricType: ServiceMetricType;

  @ApiProperty({ description: 'Display name for the metric' })
  displayName: string;

  @ApiProperty({ description: 'Current value' })
  currentValue: number;

  @ApiProperty({ description: 'Target value' })
  targetValue: number;

  @ApiProperty({ description: 'Maximum capacity' })
  maxCapacity: number;

  @ApiProperty({ description: 'Unit of measurement' })
  unit: string;

  @ApiProperty({ description: 'Utilization percentage' })
  utilizationPercentage: number;

  @ApiProperty({ description: 'Status: good, warning, critical' })
  status: 'good' | 'warning' | 'critical';

  @ApiProperty({ description: 'Last updated timestamp' })
  lastUpdated: Date;

  @ApiProperty({ description: 'Trend direction: up, down, stable' })
  trend: 'up' | 'down' | 'stable';

  @ApiProperty({ description: 'Change from last period' })
  changePercentage: number;
}

/**
 * Service Performance Summary
 */
export class ServicePerformanceSummaryDto {
  @ApiProperty({ description: 'Total number of monitored services' })
  totalServices: number;

  @ApiProperty({ description: 'Number of services at capacity' })
  atCapacity: number;

  @ApiProperty({ description: 'Number of services with warnings' })
  warnings: number;

  @ApiProperty({ description: 'Number of services with critical issues' })
  critical: number;
}

/**
 * Service Metrics Dashboard Response
 */
export class ServiceMetricsDashboardDto {
  @ApiProperty({ description: 'EDR metrics gauges' })
  edr: ServiceGaugeMetricDto[];

  @ApiProperty({ description: 'SIEM metrics gauges' })
  siem: ServiceGaugeMetricDto[];

  @ApiProperty({ description: 'NDR metrics gauges' })
  ndr: ServiceGaugeMetricDto[];

  @ApiProperty({ description: 'Overall service performance summary' })
  summary: ServicePerformanceSummaryDto;

  @ApiProperty({ description: 'Services requiring attention' })
  alerts: Array<{
    serviceId: string;
    clientName: string;
    serviceName: string;
    issue: string;
    severity: 'warning' | 'critical';
  }>;
} 