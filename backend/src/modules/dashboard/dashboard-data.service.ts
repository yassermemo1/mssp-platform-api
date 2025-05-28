import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between, MoreThan, LessThan, In } from 'typeorm';
import { 
  SLAMetric, 
  TicketSummary, 
  ServicePerformanceMetric, 
  ClientSubscriptionSnapshot,
  Contract,
  ServiceScope,
  Client,
  Service
} from '../../entities';
import {
  SLADashboardDto,
  TicketDashboardDto,
  ServiceMetricsDashboardDto,
  SubscriptionMetricsDashboardDto,
  ExpirationDashboardDto,
  ServiceGaugeMetricDto,
} from './dto';
import { TicketStatus, TicketPriority, ContractStatus, ServiceCategory, ServiceMetricType } from '../../enums';

/**
 * Dashboard Data Service
 * Handles all data aggregation and calculations for dashboard metrics
 */
@Injectable()
export class DashboardDataService {
  constructor(
    @InjectRepository(SLAMetric)
    private slaMetricRepository: Repository<SLAMetric>,
    @InjectRepository(TicketSummary)
    private ticketRepository: Repository<TicketSummary>,
    @InjectRepository(ServicePerformanceMetric)
    private serviceMetricRepository: Repository<ServicePerformanceMetric>,
    @InjectRepository(ClientSubscriptionSnapshot)
    private subscriptionSnapshotRepository: Repository<ClientSubscriptionSnapshot>,
    @InjectRepository(Contract)
    private contractRepository: Repository<Contract>,
    @InjectRepository(ServiceScope)
    private serviceScopeRepository: Repository<ServiceScope>,
    @InjectRepository(Client)
    private clientRepository: Repository<Client>,
    @InjectRepository(Service)
    private serviceRepository: Repository<Service>,
  ) {}

  /**
   * Get SLA dashboard data including historical and current month metrics
   */
  async getSLADashboardData(): Promise<SLADashboardDto> {
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const sixMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 6, 1);

    // Get historical data (last 6 months)
    const historicalData = await this.slaMetricRepository
      .createQueryBuilder('sla')
      .select([
        "DATE_TRUNC('month', sla.metricDate) as month",
        'COUNT(*) as total',
        'SUM(CASE WHEN sla.isBreach THEN 1 ELSE 0 END) as breaches',
        'AVG(sla.achievementPercentage) as avgAchievement',
      ])
      .where('sla.metricDate >= :sixMonthsAgo', { sixMonthsAgo })
      .groupBy("DATE_TRUNC('month', sla.metricDate)")
      .orderBy("DATE_TRUNC('month', sla.metricDate)", 'ASC')
      .getRawMany();

    // Get current month metrics
    const currentMonthMetrics = await this.slaMetricRepository.find({
      where: { metricDate: MoreThan(startOfMonth) },
      relations: ['client'],
    });

    // Get last month metrics for comparison
    const lastMonthMetrics = await this.slaMetricRepository.find({
      where: { 
        metricDate: Between(startOfLastMonth, startOfMonth) 
      },
    });

    // Calculate current month summary
    const totalMetrics = currentMonthMetrics.length;
    const breachedMetrics = currentMonthMetrics.filter(m => m.isBreach).length;
    const overallAchievement = totalMetrics > 0
      ? currentMonthMetrics.reduce((sum, m) => sum + m.achievementPercentage, 0) / totalMetrics
      : 0;

    // Calculate last month achievement for comparison
    const lastMonthAchievement = lastMonthMetrics.length > 0
      ? lastMonthMetrics.reduce((sum, m) => sum + m.achievementPercentage, 0) / lastMonthMetrics.length
      : 0;

    // Group metrics by type
    const metricTypeBreakdown = this.groupMetricsByType(currentMonthMetrics);

    // Get recent breaches for drill-down
    const recentBreaches = currentMonthMetrics
      .filter(m => m.isBreach)
      .sort((a, b) => b.metricDate.getTime() - a.metricDate.getTime())
      .slice(0, 10)
      .map(m => ({
        id: m.id,
        clientName: m.client?.companyName || 'Unknown',
        metricType: m.displayName,
        breachDate: m.metricDate,
        severity: m.breachSeverity || 1,
      }));

    return {
      historical: historicalData.map(h => ({
        date: h.month,
        achievementPercentage: parseFloat(h.avgachievement) || 0,
        breachCount: parseInt(h.breaches) || 0,
        totalMetrics: parseInt(h.total) || 0,
      })),
      currentMonth: {
        overallAchievement,
        targetPercentage: 95, // Default SLA target
        changeFromLastMonth: overallAchievement - lastMonthAchievement,
        activeSLAs: totalMetrics,
        breachedSLAs: breachedMetrics,
        metricBreakdown: metricTypeBreakdown,
      },
      recentBreaches,
    };
  }

  /**
   * Get ticket dashboard data
   */
  async getTicketDashboardData(): Promise<TicketDashboardDto> {
    const now = new Date();
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

    // Get all tickets
    const allTickets = await this.ticketRepository.find({
      relations: ['client'],
    });

    // Calculate status summary
    const statusBreakdown = this.calculateStatusBreakdown(allTickets);
    const priorityBreakdown = this.calculatePriorityBreakdown(allTickets);

    // Calculate average resolution time
    const resolvedTickets = allTickets.filter(t => t.resolvedDate);
    const avgResolutionTime = resolvedTickets.length > 0
      ? resolvedTickets.reduce((sum, t) => sum + (t.resolutionTimeMinutes || 0), 0) / resolvedTickets.length / 60
      : 0;

    // Get trend data for last 30 days
    const trendData = await this.calculateTicketTrends(thirtyDaysAgo, now);

    // Get top clients by ticket volume
    const clientTicketCounts = this.calculateClientTicketCounts(allTickets);
    const topClients = Object.entries(clientTicketCounts)
      .sort(([, a], [, b]) => b.total - a.total)
      .slice(0, 5)
      .map(([clientId, counts]) => ({
        clientId,
        clientName: counts.name,
        ticketCount: counts.total,
        criticalCount: counts.critical,
      }));

    // Group tickets by service
    const byService = this.groupTicketsByService(allTickets);

    return {
      summary: {
        total: allTickets.length,
        open: statusBreakdown[TicketStatus.OPEN] || 0,
        critical: priorityBreakdown[TicketPriority.CRITICAL] || 0,
        high: priorityBreakdown[TicketPriority.HIGH] || 0,
        medium: priorityBreakdown[TicketPriority.MEDIUM] || 0,
        low: priorityBreakdown[TicketPriority.LOW] || 0,
        closed: statusBreakdown[TicketStatus.CLOSED] || 0,
        statusBreakdown,
        avgResolutionTime,
        slaBreachedCount: allTickets.filter(t => t.slaBreached).length,
      },
      trends: trendData,
      topClients,
      byService,
    };
  }

  /**
   * Get service performance metrics for dashboard gauges
   */
  async getServiceMetricsDashboard(): Promise<ServiceMetricsDashboardDto> {
    const latestMetrics = await this.getLatestServiceMetrics();

    // Group metrics by service type
    const edrMetrics = this.filterAndMapServiceMetrics(latestMetrics, 'EDR');
    const siemMetrics = this.filterAndMapServiceMetrics(latestMetrics, 'SIEM');
    const ndrMetrics = this.filterAndMapServiceMetrics(latestMetrics, 'NDR');

    // Calculate summary statistics
    const summary = this.calculateServiceSummary(latestMetrics);

    // Generate alerts for services requiring attention
    const alerts = this.generateServiceAlerts(latestMetrics);

    return {
      edr: edrMetrics,
      siem: siemMetrics,
      ndr: ndrMetrics,
      summary,
      alerts,
    };
  }

  /**
   * Get subscription metrics and trends
   */
  async getSubscriptionMetrics(): Promise<SubscriptionMetricsDashboardDto> {
    // Get latest snapshot for current summary
    const latestSnapshot = await this.subscriptionSnapshotRepository.findOne({
      where: { periodType: 'monthly' },
      order: { snapshotDate: 'DESC' },
    });

    // Get trend data for last 12 months
    const twelveMonthsAgo = new Date();
    twelveMonthsAgo.setMonth(twelveMonthsAgo.getMonth() - 12);

    const trendSnapshots = await this.subscriptionSnapshotRepository.find({
      where: {
        periodType: 'monthly',
        snapshotDate: MoreThan(twelveMonthsAgo),
      },
      order: { snapshotDate: 'ASC' },
    });

    // If no snapshots, calculate from raw data
    const currentSummary = latestSnapshot
      ? {
          totalActiveClients: latestSnapshot.totalActiveClients,
          totalActiveContracts: latestSnapshot.totalActiveContracts,
          currentMRR: latestSnapshot.getMRR() || 0,
          currentARR: latestSnapshot.getARR() || 0,
          averageContractValue: latestSnapshot.getAverageContractValue() || 0,
          churnRate: latestSnapshot.churnRate || 0,
          growthRate: latestSnapshot.growthMetrics?.clientGrowthRate || 0,
        }
      : await this.calculateCurrentSubscriptionSummary();

    return {
      currentSummary,
      trends: trendSnapshots.map(s => ({
        date: s.snapshotDate.toISOString().split('T')[0],
        activeClients: s.totalActiveClients,
        newClients: s.newClients,
        churnedClients: s.churnedClients,
        mrr: s.getMRR() || 0,
        arr: s.getARR() || 0,
      })),
      clientsBySource: latestSnapshot?.clientSourceBreakdown || {},
      revenueByService: latestSnapshot?.serviceBreakdown || {},
    };
  }

  /**
   * Get expiring SAFs and contracts
   */
  async getExpirationData(): Promise<ExpirationDashboardDto> {
    const now = new Date();
    const thirtyDaysFromNow = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);

    // Get expiring SAFs
    const expiringSAFs = await this.serviceScopeRepository.find({
      where: {
        safServiceEndDate: Between(now, thirtyDaysFromNow),
        isActive: true,
      },
      relations: ['contract', 'contract.client', 'service'],
    });

    // Get expiring contracts
    const expiringContracts = await this.contractRepository.find({
      where: {
        endDate: Between(now, thirtyDaysFromNow),
        status: In([ContractStatus.ACTIVE, ContractStatus.RENEWED_ACTIVE]),
      },
      relations: ['client'],
    });

    // Map to DTOs
    const safDtos = expiringSAFs.map(saf => ({
      serviceScopeId: saf.id,
      clientId: saf.contract.client.id,
      clientName: saf.contract.client.companyName,
      serviceName: saf.service.name,
      safEndDate: saf.safServiceEndDate!,
      daysUntilExpiration: Math.ceil((saf.safServiceEndDate!.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)),
      safStatus: saf.safStatus || 'Unknown',
    }));

    const contractDtos = expiringContracts.map(contract => ({
      contractId: contract.id,
      clientId: contract.client.id,
      clientName: contract.client.companyName,
      contractName: contract.contractName,
      endDate: contract.endDate,
      daysUntilExpiration: Math.ceil((contract.endDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)),
      value: contract.value || 0,
      status: contract.status,
    }));

    // Calculate summary
    const clientsAffected = new Set([
      ...safDtos.map(s => s.clientId),
      ...contractDtos.map(c => c.clientId),
    ]).size;

    const totalExpiringValue = contractDtos.reduce((sum, c) => sum + c.value, 0);

    return {
      expiringSAFs: safDtos,
      expiringContracts: contractDtos,
      summary: {
        totalExpiringSAFs: safDtos.length,
        totalExpiringContracts: contractDtos.length,
        totalExpiringValue,
        clientsAffected,
      },
    };
  }

  // Helper methods
  private groupMetricsByType(metrics: SLAMetric[]): any[] {
    const grouped = metrics.reduce((acc, metric) => {
      const type = metric.metricType;
      if (!acc[type]) {
        acc[type] = { count: 0, breaches: 0, totalAchievement: 0 };
      }
      acc[type].count++;
      if (metric.isBreach) acc[type].breaches++;
      acc[type].totalAchievement += metric.achievementPercentage;
      return acc;
    }, {} as Record<string, any>);

    return Object.entries(grouped).map(([type, data]) => ({
      metricType: type,
      displayName: type.replace(/_/g, ' ').toLowerCase().replace(/\b\w/g, c => c.toUpperCase()),
      achievementPercentage: data.totalAchievement / data.count,
      breachCount: data.breaches,
    }));
  }

  private calculateStatusBreakdown(tickets: TicketSummary[]): Record<TicketStatus, number> {
    return tickets.reduce((acc, ticket) => {
      acc[ticket.status] = (acc[ticket.status] || 0) + 1;
      return acc;
    }, {} as Record<TicketStatus, number>);
  }

  private calculatePriorityBreakdown(tickets: TicketSummary[]): Record<TicketPriority, number> {
    return tickets.reduce((acc, ticket) => {
      acc[ticket.priority] = (acc[ticket.priority] || 0) + 1;
      return acc;
    }, {} as Record<TicketPriority, number>);
  }

  private async calculateTicketTrends(startDate: Date, endDate: Date): Promise<any[]> {
    const trends = [];
    const currentDate = new Date(startDate);

    while (currentDate <= endDate) {
      const dayStart = new Date(currentDate);
      const dayEnd = new Date(currentDate);
      dayEnd.setDate(dayEnd.getDate() + 1);

      const created = await this.ticketRepository.count({
        where: { createdDate: Between(dayStart, dayEnd) },
      });

      const resolved = await this.ticketRepository.count({
        where: { resolvedDate: Between(dayStart, dayEnd) },
      });

      const closed = await this.ticketRepository.count({
        where: { closedDate: Between(dayStart, dayEnd) },
      });

      trends.push({
        date: currentDate.toISOString().split('T')[0],
        created,
        resolved,
        closed,
      });

      currentDate.setDate(currentDate.getDate() + 1);
    }

    return trends;
  }

  private calculateClientTicketCounts(tickets: TicketSummary[]): Record<string, any> {
    return tickets.reduce((acc, ticket) => {
      const clientId = ticket.clientId;
      if (!acc[clientId]) {
        acc[clientId] = {
          name: ticket.client?.companyName || 'Unknown',
          total: 0,
          critical: 0,
        };
      }
      acc[clientId].total++;
      if (ticket.priority === TicketPriority.CRITICAL) {
        acc[clientId].critical++;
      }
      return acc;
    }, {} as Record<string, any>);
  }

  private groupTicketsByService(tickets: TicketSummary[]): Record<string, number> {
    return tickets.reduce((acc, ticket) => {
      const service = ticket.affectedService || 'Other';
      acc[service] = (acc[service] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
  }

  private async getLatestServiceMetrics(): Promise<ServicePerformanceMetric[]> {
    // Get the most recent metric for each service scope and metric type
    const subquery = this.serviceMetricRepository
      .createQueryBuilder('sm1')
      .select('MAX(sm1.metricDate)', 'maxDate')
      .addSelect('sm1.serviceScopeId')
      .addSelect('sm1.metricType')
      .groupBy('sm1.serviceScopeId')
      .addGroupBy('sm1.metricType');

    return await this.serviceMetricRepository
      .createQueryBuilder('sm')
      .innerJoin(
        `(${subquery.getQuery()})`,
        'latest',
        'sm.serviceScopeId = latest.serviceScopeId AND sm.metricType = latest.metricType AND sm.metricDate = latest.maxDate'
      )
      .leftJoinAndSelect('sm.serviceScope', 'serviceScope')
      .leftJoinAndSelect('serviceScope.service', 'service')
      .leftJoinAndSelect('sm.client', 'client')
      .getMany();
  }

  private filterAndMapServiceMetrics(
    metrics: ServicePerformanceMetric[],
    serviceType: string
  ): ServiceGaugeMetricDto[] {
    return metrics
      .filter(m => {
        const serviceName = m.serviceScope?.service?.name || '';
        return serviceName.toUpperCase().includes(serviceType);
      })
      .map(m => this.mapToGaugeMetric(m, serviceType));
  }

  private mapToGaugeMetric(
    metric: ServicePerformanceMetric,
    serviceType: string
  ): ServiceGaugeMetricDto {
    const previousMetric = null; // TODO: Get previous period metric for trend calculation
    const trend = 'stable'; // TODO: Calculate based on historical data
    const changePercentage = 0; // TODO: Calculate

    return {
      serviceType,
      metricType: metric.metricType,
      displayName: metric.displayName,
      currentValue: metric.value,
      targetValue: metric.targetValue || 0,
      maxCapacity: metric.maxCapacity || 0,
      unit: metric.unit,
      utilizationPercentage: metric.utilizationPercentage || 0,
      status: metric.getStatus(),
      lastUpdated: metric.metricDate,
      trend,
      changePercentage,
    };
  }

  private calculateServiceSummary(metrics: ServicePerformanceMetric[]): any {
    const uniqueServices = new Set(metrics.map(m => m.serviceScopeId));
    const atCapacity = metrics.filter(m => m.utilizationPercentage && m.utilizationPercentage >= 90).length;
    const warnings = metrics.filter(m => m.getStatus() === 'warning').length;
    const critical = metrics.filter(m => m.getStatus() === 'critical').length;

    return {
      totalServices: uniqueServices.size,
      atCapacity,
      warnings,
      critical,
    };
  }

  private generateServiceAlerts(metrics: ServicePerformanceMetric[]): any[] {
    return metrics
      .filter(m => m.getStatus() !== 'good')
      .map(m => ({
        serviceId: m.serviceScopeId,
        clientName: m.client?.companyName || 'Unknown',
        serviceName: m.serviceScope?.service?.name || 'Unknown',
        issue: m.isAtRisk() ? 'Approaching capacity limit' : 'Threshold exceeded',
        severity: m.getStatus() as 'warning' | 'critical',
      }));
  }

  private async calculateCurrentSubscriptionSummary(): Promise<any> {
    // Fallback calculation if no snapshots exist
    const activeClients = await this.clientRepository.count({
      where: { status: 'ACTIVE' },
    });

    const activeContracts = await this.contractRepository.count({
      where: { status: In([ContractStatus.ACTIVE, ContractStatus.RENEWED_ACTIVE]) },
    });

    // Calculate MRR/ARR from active contracts
    const contractValues = await this.contractRepository
      .createQueryBuilder('contract')
      .select('SUM(contract.value)', 'total')
      .where('contract.status IN (:...statuses)', {
        statuses: [ContractStatus.ACTIVE, ContractStatus.RENEWED_ACTIVE],
      })
      .getRawOne();

    const totalValue = parseFloat(contractValues?.total || '0');
    const averageContractValue = activeContracts > 0 ? totalValue / activeContracts : 0;

    return {
      totalActiveClients: activeClients,
      totalActiveContracts: activeContracts,
      currentMRR: totalValue / 12, // Simplified calculation
      currentARR: totalValue,
      averageContractValue,
      churnRate: 0, // Would need historical data
      growthRate: 0, // Would need historical data
    };
  }
} 