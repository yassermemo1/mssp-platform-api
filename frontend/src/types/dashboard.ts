/**
 * Dashboard Types
 * TypeScript interfaces for dashboard data structures
 */

// SLA Metrics Types
export interface SLAHistoricalDataPoint {
  date: string;
  achievementPercentage: number;
  breachCount: number;
  totalMetrics: number;
}

export interface CurrentMonthSLA {
  overallAchievement: number;
  targetPercentage: number;
  changeFromLastMonth: number;
  activeSLAs: number;
  breachedSLAs: number;
  metricBreakdown: Array<{
    metricType: string;
    displayName: string;
    achievementPercentage: number;
    breachCount: number;
  }>;
}

export interface SLADashboardData {
  historical: SLAHistoricalDataPoint[];
  currentMonth: CurrentMonthSLA;
  recentBreaches: Array<{
    id: string;
    clientName: string;
    metricType: string;
    breachDate: Date;
    severity: number;
  }>;
}

// Ticket Metrics Types
export interface TicketStatusSummary {
  total: number;
  open: number;
  critical: number;
  high: number;
  medium: number;
  low: number;
  closed: number;
  statusBreakdown: Record<string, number>;
  avgResolutionTime: number;
  slaBreachedCount: number;
}

export interface TicketTrendDataPoint {
  date: string;
  created: number;
  resolved: number;
  closed: number;
}

export interface TicketDashboardData {
  summary: TicketStatusSummary;
  trends: TicketTrendDataPoint[];
  topClients: Array<{
    clientId: string;
    clientName: string;
    ticketCount: number;
    criticalCount: number;
  }>;
  byService: Record<string, number>;
}

// Service Performance Types
export interface ServiceGaugeMetric {
  serviceType: string;
  metricType: string;
  displayName: string;
  currentValue: number;
  targetValue: number;
  maxCapacity: number;
  unit: string;
  utilizationPercentage: number;
  status: 'good' | 'warning' | 'critical';
  lastUpdated: Date;
  trend: 'up' | 'down' | 'stable';
  changePercentage: number;
}

export interface ServicePerformanceSummary {
  totalServices: number;
  atCapacity: number;
  warnings: number;
  critical: number;
}

export interface ServiceMetricsDashboardData {
  edr: ServiceGaugeMetric[];
  siem: ServiceGaugeMetric[];
  ndr: ServiceGaugeMetric[];
  summary: ServicePerformanceSummary;
  alerts: Array<{
    serviceId: string;
    clientName: string;
    serviceName: string;
    issue: string;
    severity: 'warning' | 'critical';
  }>;
}

// Subscription Metrics Types
export interface SubscriptionTrendDataPoint {
  date: string;
  activeClients: number;
  newClients: number;
  churnedClients: number;
  mrr: number;
  arr: number;
}

export interface SubscriptionMetricsDashboardData {
  currentSummary: {
    totalActiveClients: number;
    totalActiveContracts: number;
    currentMRR: number;
    currentARR: number;
    averageContractValue: number;
    churnRate: number;
    growthRate: number;
  };
  trends: SubscriptionTrendDataPoint[];
  clientsBySource: Record<string, number>;
  revenueByService: Record<string, number>;
}

// Expiration Data Types
export interface ExpiringSAF {
  serviceScopeId: string;
  clientId: string;
  clientName: string;
  serviceName: string;
  safEndDate: Date;
  daysUntilExpiration: number;
  safStatus: string;
}

export interface ExpiringContract {
  contractId: string;
  clientId: string;
  clientName: string;
  contractName: string;
  endDate: Date;
  daysUntilExpiration: number;
  value: number;
  status: string;
}

export interface ExpirationDashboardData {
  expiringSAFs: ExpiringSAF[];
  expiringContracts: ExpiringContract[];
  summary: {
    totalExpiringSAFs: number;
    totalExpiringContracts: number;
    totalExpiringValue: number;
    clientsAffected: number;
  };
}

// Client Overview Types
export interface ClientProfileSummary {
  id: string;
  companyName: string;
  industry: string;
  status: string;
  source: string;
  contactName: string;
  contactEmail: string;
  contactPhone: string;
  address: string;
  website: string;
  clientSince: Date;
  accountManager?: {
    id: string;
    name: string;
    email: string;
  };
}

export interface ClientContractSummary {
  id: string;
  contractName: string;
  status: string;
  startDate: Date;
  endDate: Date;
  value: number;
  daysUntilExpiration: number;
  isExpiringSoon: boolean;
  serviceCount: number;
}

export interface ClientServiceSummary {
  id: string;
  serviceName: string;
  serviceCategory: string;
  contractName: string;
  safStatus: string;
  startDate: Date | null;
  endDate: Date | null;
  isActive: boolean;
  keyParameters: Record<string, any>;
}

export interface ClientFinancialSummary {
  totalContractValue: number;
  totalPaidAmount: number;
  totalPendingAmount: number;
  lastPaymentDate: Date | null;
  nextPaymentDue: Date | null;
  recentTransactions: Array<{
    id: string;
    date: Date;
    amount: number;
    type: string;
    status: string;
    description: string;
  }>;
}

export interface ClientHardwareSummary {
  totalAssignedAssets: number;
  activeAssignments: number;
  assetsByType: Record<string, number>;
  recentAssignments: Array<{
    id: string;
    assetName: string;
    assetType: string;
    serialNumber: string;
    assignedDate: Date;
    status: string;
  }>;
}

export interface ClientTeamSummary {
  totalTeamMembers: number;
  membersByRole: Record<string, number>;
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

export interface ClientMetricsSummary {
  currentSLAAchievement: number;
  openTickets: number;
  criticalTickets: number;
  avgResolutionTime: number;
  serviceHealth: Array<{
    serviceName: string;
    status: 'good' | 'warning' | 'critical';
    metric: string;
    value: number;
  }>;
}

export interface ClientOverviewData {
  profile: ClientProfileSummary;
  contracts: ClientContractSummary[];
  services: ClientServiceSummary[];
  financials: ClientFinancialSummary;
  hardware: ClientHardwareSummary;
  team: ClientTeamSummary;
  metrics: ClientMetricsSummary;
  summary: {
    totalActiveContracts: number;
    totalActiveServices: number;
    totalValue: number;
    healthStatus: 'good' | 'warning' | 'critical';
    lastUpdated: Date;
  };
} 