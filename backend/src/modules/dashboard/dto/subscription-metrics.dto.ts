import { ApiProperty } from '@nestjs/swagger';

/**
 * Subscription Trend Data Point
 */
export class SubscriptionTrendDataPointDto {
  @ApiProperty({ description: 'Date for this data point' })
  date: string;

  @ApiProperty({ description: 'Total active clients' })
  activeClients: number;

  @ApiProperty({ description: 'New clients added' })
  newClients: number;

  @ApiProperty({ description: 'Churned clients' })
  churnedClients: number;

  @ApiProperty({ description: 'Monthly Recurring Revenue' })
  mrr: number;

  @ApiProperty({ description: 'Annual Recurring Revenue' })
  arr: number;
}

/**
 * Expiring SAF Item
 */
export class ExpiringSAFDto {
  @ApiProperty({ description: 'Service scope ID' })
  serviceScopeId: string;

  @ApiProperty({ description: 'Client ID' })
  clientId: string;

  @ApiProperty({ description: 'Client name' })
  clientName: string;

  @ApiProperty({ description: 'Service name' })
  serviceName: string;

  @ApiProperty({ description: 'SAF end date' })
  safEndDate: Date;

  @ApiProperty({ description: 'Days until expiration' })
  daysUntilExpiration: number;

  @ApiProperty({ description: 'SAF status' })
  safStatus: string;
}

/**
 * Expiring Contract Item
 */
export class ExpiringContractDto {
  @ApiProperty({ description: 'Contract ID' })
  contractId: string;

  @ApiProperty({ description: 'Client ID' })
  clientId: string;

  @ApiProperty({ description: 'Client name' })
  clientName: string;

  @ApiProperty({ description: 'Contract name' })
  contractName: string;

  @ApiProperty({ description: 'Contract end date' })
  endDate: Date;

  @ApiProperty({ description: 'Days until expiration' })
  daysUntilExpiration: number;

  @ApiProperty({ description: 'Contract value' })
  value: number;

  @ApiProperty({ description: 'Contract status' })
  status: string;
}

/**
 * Subscription Metrics Dashboard Response
 */
export class SubscriptionMetricsDashboardDto {
  @ApiProperty({ description: 'Current subscription summary' })
  currentSummary: {
    totalActiveClients: number;
    totalActiveContracts: number;
    currentMRR: number;
    currentARR: number;
    averageContractValue: number;
    churnRate: number;
    growthRate: number;
  };

  @ApiProperty({ description: 'Subscription trend data' })
  trends: SubscriptionTrendDataPointDto[];

  @ApiProperty({ description: 'Client distribution by source' })
  clientsBySource: Record<string, number>;

  @ApiProperty({ description: 'Revenue by service category' })
  revenueByService: Record<string, number>;
}

/**
 * Expiration Dashboard Response
 */
export class ExpirationDashboardDto {
  @ApiProperty({ description: 'SAFs expiring in next 30 days' })
  expiringSAFs: ExpiringSAFDto[];

  @ApiProperty({ description: 'Contracts expiring in next 30 days' })
  expiringContracts: ExpiringContractDto[];

  @ApiProperty({ description: 'Summary statistics' })
  summary: {
    totalExpiringSAFs: number;
    totalExpiringContracts: number;
    totalExpiringValue: number;
    clientsAffected: number;
  };
} 