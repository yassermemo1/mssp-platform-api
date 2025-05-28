import { ApiProperty } from '@nestjs/swagger';
import { ClientStatus, ContractStatus, SAFStatus, HardwareAssetStatus } from '../../../enums';

/**
 * Client Profile Summary
 */
export class ClientProfileSummaryDto {
  @ApiProperty({ description: 'Client ID' })
  id: string;

  @ApiProperty({ description: 'Company name' })
  companyName: string;

  @ApiProperty({ description: 'Industry' })
  industry: string;

  @ApiProperty({ description: 'Client status' })
  status: ClientStatus;

  @ApiProperty({ description: 'Client source' })
  source: string;

  @ApiProperty({ description: 'Primary contact name' })
  contactName: string;

  @ApiProperty({ description: 'Primary contact email' })
  contactEmail: string;

  @ApiProperty({ description: 'Primary contact phone' })
  contactPhone: string;

  @ApiProperty({ description: 'Address' })
  address: string;

  @ApiProperty({ description: 'Website' })
  website: string;

  @ApiProperty({ description: 'Client since date' })
  clientSince: Date;

  @ApiProperty({ description: 'Assigned account manager' })
  accountManager?: {
    id: string;
    name: string;
    email: string;
  };
}

/**
 * Contract Summary for Client Overview
 */
export class ClientContractSummaryDto {
  @ApiProperty({ description: 'Contract ID' })
  id: string;

  @ApiProperty({ description: 'Contract name' })
  contractName: string;

  @ApiProperty({ description: 'Contract status' })
  status: ContractStatus;

  @ApiProperty({ description: 'Start date' })
  startDate: Date;

  @ApiProperty({ description: 'End date' })
  endDate: Date;

  @ApiProperty({ description: 'Contract value' })
  value: number;

  @ApiProperty({ description: 'Days until expiration' })
  daysUntilExpiration: number;

  @ApiProperty({ description: 'Is expiring soon' })
  isExpiringSoon: boolean;

  @ApiProperty({ description: 'Number of services in contract' })
  serviceCount: number;
}

/**
 * Service Summary for Client Overview
 */
export class ClientServiceSummaryDto {
  @ApiProperty({ description: 'Service scope ID' })
  id: string;

  @ApiProperty({ description: 'Service name' })
  serviceName: string;

  @ApiProperty({ description: 'Service category' })
  serviceCategory: string;

  @ApiProperty({ description: 'Contract name' })
  contractName: string;

  @ApiProperty({ description: 'SAF status' })
  safStatus: SAFStatus;

  @ApiProperty({ description: 'Service start date' })
  startDate: Date | null;

  @ApiProperty({ description: 'Service end date' })
  endDate: Date | null;

  @ApiProperty({ description: 'Is active' })
  isActive: boolean;

  @ApiProperty({ description: 'Key scope parameters' })
  keyParameters: Record<string, any>;
}

/**
 * Financial Summary for Client Overview
 */
export class ClientFinancialSummaryDto {
  @ApiProperty({ description: 'Total contract value' })
  totalContractValue: number;

  @ApiProperty({ description: 'Total paid amount' })
  totalPaidAmount: number;

  @ApiProperty({ description: 'Total pending amount' })
  totalPendingAmount: number;

  @ApiProperty({ description: 'Last payment date' })
  lastPaymentDate: Date | null;

  @ApiProperty({ description: 'Next payment due date' })
  nextPaymentDue: Date | null;

  @ApiProperty({ description: 'Recent transactions' })
  recentTransactions: Array<{
    id: string;
    date: Date;
    amount: number;
    type: string;
    status: string;
    description: string;
  }>;
}

/**
 * Hardware Summary for Client Overview
 */
export class ClientHardwareSummaryDto {
  @ApiProperty({ description: 'Total assigned assets' })
  totalAssignedAssets: number;

  @ApiProperty({ description: 'Active assignments' })
  activeAssignments: number;

  @ApiProperty({ description: 'Assets by type' })
  assetsByType: Record<string, number>;

  @ApiProperty({ description: 'Recent assignments' })
  recentAssignments: Array<{
    id: string;
    assetName: string;
    assetType: string;
    serialNumber: string;
    assignedDate: Date;
    status: HardwareAssetStatus;
  }>;
}

/**
 * Team Assignment Summary for Client Overview
 */
export class ClientTeamSummaryDto {
  @ApiProperty({ description: 'Total team members assigned' })
  totalTeamMembers: number;

  @ApiProperty({ description: 'Team members by role' })
  membersByRole: Record<string, number>;

  @ApiProperty({ description: 'Team members list' })
  teamMembers: Array<{
    id: string;
    name: string;
    email: string;
    role: string;
    assignmentRole: string;
    isPrimary: boolean;
    assignedDate: Date;
  }>;
}

/**
 * Metrics Summary for Client Overview
 */
export class ClientMetricsSummaryDto {
  @ApiProperty({ description: 'Current month SLA achievement' })
  currentSLAAchievement: number;

  @ApiProperty({ description: 'Open tickets count' })
  openTickets: number;

  @ApiProperty({ description: 'Critical tickets count' })
  criticalTickets: number;

  @ApiProperty({ description: 'Average resolution time (hours)' })
  avgResolutionTime: number;

  @ApiProperty({ description: 'Service health indicators' })
  serviceHealth: Array<{
    serviceName: string;
    status: 'good' | 'warning' | 'critical';
    metric: string;
    value: number;
  }>;
}

/**
 * Complete Client Overview Response
 */
export class ClientOverviewDto {
  @ApiProperty({ description: 'Client profile information' })
  profile: ClientProfileSummaryDto;

  @ApiProperty({ description: 'Active contracts summary' })
  contracts: ClientContractSummaryDto[];

  @ApiProperty({ description: 'Active services summary' })
  services: ClientServiceSummaryDto[];

  @ApiProperty({ description: 'Financial summary' })
  financials: ClientFinancialSummaryDto;

  @ApiProperty({ description: 'Hardware assignment summary' })
  hardware: ClientHardwareSummaryDto;

  @ApiProperty({ description: 'Team assignment summary' })
  team: ClientTeamSummaryDto;

  @ApiProperty({ description: 'Performance metrics summary' })
  metrics: ClientMetricsSummaryDto;

  @ApiProperty({ description: 'Summary statistics' })
  summary: {
    totalActiveContracts: number;
    totalActiveServices: number;
    totalValue: number;
    healthStatus: 'good' | 'warning' | 'critical';
    lastUpdated: Date;
  };
} 