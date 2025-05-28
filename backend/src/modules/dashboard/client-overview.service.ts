import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
import {
  Client,
  Contract,
  ServiceScope,
  FinancialTransaction,
  ClientHardwareAssignment,
  ClientTeamAssignment,
  SLAMetric,
  TicketSummary,
  ServicePerformanceMetric,
} from '../../entities';
import { ClientOverviewDto } from './dto/client-overview.dto';
import {
  ContractStatus,
  FinancialTransactionStatus,
  HardwareAssignmentStatus,
  TicketStatus,
  ClientAssignmentRole,
} from '../../enums';

/**
 * Client Overview Service
 * Provides comprehensive client data aggregation for 360 view
 */
@Injectable()
export class ClientOverviewService {
  constructor(
    @InjectRepository(Client)
    private clientRepository: Repository<Client>,
    @InjectRepository(Contract)
    private contractRepository: Repository<Contract>,
    @InjectRepository(ServiceScope)
    private serviceScopeRepository: Repository<ServiceScope>,
    @InjectRepository(FinancialTransaction)
    private financialRepository: Repository<FinancialTransaction>,
    @InjectRepository(ClientHardwareAssignment)
    private hardwareAssignmentRepository: Repository<ClientHardwareAssignment>,
    @InjectRepository(ClientTeamAssignment)
    private teamAssignmentRepository: Repository<ClientTeamAssignment>,
    @InjectRepository(SLAMetric)
    private slaMetricRepository: Repository<SLAMetric>,
    @InjectRepository(TicketSummary)
    private ticketRepository: Repository<TicketSummary>,
    @InjectRepository(ServicePerformanceMetric)
    private serviceMetricRepository: Repository<ServicePerformanceMetric>,
  ) {}

  /**
   * Get complete client overview data
   */
  async getClientOverview(clientId: string): Promise<ClientOverviewDto> {
    // Get client with basic info
    const client = await this.clientRepository.findOne({
      where: { id: clientId },
    });

    if (!client) {
      throw new NotFoundException(`Client with ID ${clientId} not found`);
    }

    // Fetch all related data in parallel for efficiency
    const [
      profile,
      contracts,
      services,
      financials,
      hardware,
      team,
      metrics,
    ] = await Promise.all([
      this.getClientProfile(client),
      this.getClientContracts(clientId),
      this.getClientServices(clientId),
      this.getClientFinancials(clientId),
      this.getClientHardware(clientId),
      this.getClientTeam(clientId),
      this.getClientMetrics(clientId),
    ]);

    // Calculate summary statistics
    const summary = this.calculateSummary(contracts, services, financials, metrics);

    return {
      profile,
      contracts,
      services,
      financials,
      hardware,
      team,
      metrics,
      summary,
    };
  }

  /**
   * Get client profile information
   */
  private async getClientProfile(client: Client): Promise<any> {
    // Get account manager assignment
    const accountManagerAssignment = await this.teamAssignmentRepository.findOne({
      where: {
        clientId: client.id,
        assignmentRole: ClientAssignmentRole.ACCOUNT_MANAGER,
        isActive: true,
      },
      relations: ['user'],
    });

    return {
      id: client.id,
      companyName: client.companyName,
      industry: client.industry,
      status: client.status,
      source: client.clientSource,
      contactName: client.contactName,
      contactEmail: client.contactEmail,
      contactPhone: client.contactPhone,
      address: client.address,
      website: client.website || '',
      clientSince: client.createdAt,
      accountManager: accountManagerAssignment
        ? {
            id: accountManagerAssignment.user.id,
            name: `${accountManagerAssignment.user.firstName} ${accountManagerAssignment.user.lastName}`,
            email: accountManagerAssignment.user.email,
          }
        : undefined,
    };
  }

  /**
   * Get client contracts summary
   */
  private async getClientContracts(clientId: string): Promise<any[]> {
    const contracts = await this.contractRepository.find({
      where: {
        clientId,
        status: In([ContractStatus.ACTIVE, ContractStatus.RENEWED_ACTIVE]),
      },
      relations: ['serviceScopes'],
      order: { endDate: 'ASC' },
    });

    const now = new Date();

    return contracts.map(contract => ({
      id: contract.id,
      contractName: contract.contractName,
      status: contract.status,
      startDate: contract.startDate,
      endDate: contract.endDate,
      value: contract.value || 0,
      daysUntilExpiration: Math.ceil(
        (contract.endDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
      ),
      isExpiringSoon: contract.isExpiringSoon,
      serviceCount: contract.serviceScopes.length,
    }));
  }

  /**
   * Get client services summary
   */
  private async getClientServices(clientId: string): Promise<any[]> {
    const serviceScopes = await this.serviceScopeRepository
      .createQueryBuilder('ss')
      .innerJoinAndSelect('ss.service', 'service')
      .innerJoinAndSelect('ss.contract', 'contract')
      .where('contract.clientId = :clientId', { clientId })
      .andWhere('ss.isActive = :isActive', { isActive: true })
      .andWhere('contract.status IN (:...statuses)', {
        statuses: [ContractStatus.ACTIVE, ContractStatus.RENEWED_ACTIVE],
      })
      .getMany();

    return serviceScopes.map(scope => ({
      id: scope.id,
      serviceName: scope.service.name,
      serviceCategory: scope.service.category,
      contractName: scope.contract.contractName,
      safStatus: scope.safStatus,
      startDate: scope.safServiceStartDate,
      endDate: scope.safServiceEndDate,
      isActive: scope.isActive,
      keyParameters: this.extractKeyParameters(scope.scopeDetails),
    }));
  }

  /**
   * Get client financial summary
   */
  private async getClientFinancials(clientId: string): Promise<any> {
    const transactions = await this.financialRepository.find({
      where: { clientId },
      order: { transactionDate: 'DESC' },
    });

    // Calculate totals
    const totalPaid = transactions
      .filter(t => t.status === FinancialTransactionStatus.COMPLETED)
      .reduce((sum, t) => sum + t.amount, 0);

    const totalPending = transactions
      .filter(t => t.status === FinancialTransactionStatus.PENDING)
      .reduce((sum, t) => sum + t.amount, 0);

    // Get active contracts for total value
    const activeContracts = await this.contractRepository.find({
      where: {
        clientId,
        status: In([ContractStatus.ACTIVE, ContractStatus.RENEWED_ACTIVE]),
      },
    });

    const totalContractValue = activeContracts.reduce(
      (sum, c) => sum + (c.value || 0),
      0
    );

    // Find last payment and next due
    const lastPayment = transactions.find(
      t => t.status === FinancialTransactionStatus.COMPLETED
    );

    const nextDue = transactions.find(
      t => 
        t.status === FinancialTransactionStatus.PENDING &&
        t.dueDate &&
        t.dueDate > new Date()
    );

    // Get recent transactions
    const recentTransactions = transactions.slice(0, 5).map(t => ({
      id: t.id,
      date: t.transactionDate,
      amount: t.amount,
      type: t.type,
      status: t.status,
      description: t.description,
    }));

    return {
      totalContractValue,
      totalPaidAmount: totalPaid,
      totalPendingAmount: totalPending,
      lastPaymentDate: lastPayment?.transactionDate || null,
      nextPaymentDue: nextDue?.dueDate || null,
      recentTransactions,
    };
  }

  /**
   * Get client hardware summary
   */
  private async getClientHardware(clientId: string): Promise<any> {
    const assignments = await this.hardwareAssignmentRepository.find({
      where: { clientId },
      relations: ['hardwareAsset'],
      order: { assignmentDate: 'DESC' },
    });

    const activeAssignments = assignments.filter(
      a => a.status === HardwareAssignmentStatus.ACTIVE
    );

    // Group by asset type
    const assetsByType = assignments.reduce((acc, assignment) => {
      const type = assignment.hardwareAsset.assetType;
      acc[type] = (acc[type] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    // Get recent assignments
    const recentAssignments = assignments.slice(0, 5).map(a => ({
      id: a.id,
      assetName: a.hardwareAsset.deviceName || a.hardwareAsset.assetTag,
      assetType: a.hardwareAsset.assetType,
      serialNumber: a.hardwareAsset.serialNumber,
      assignedDate: a.assignmentDate,
      status: a.hardwareAsset.status,
    }));

    return {
      totalAssignedAssets: assignments.length,
      activeAssignments: activeAssignments.length,
      assetsByType,
      recentAssignments,
    };
  }

  /**
   * Get client team summary
   */
  private async getClientTeam(clientId: string): Promise<any> {
    const teamAssignments = await this.teamAssignmentRepository.find({
      where: { clientId, isActive: true },
      relations: ['user'],
      order: { priority: 'ASC', createdAt: 'ASC' },
    });

    // Group by assignment role
    const membersByRole = teamAssignments.reduce((acc, assignment) => {
      acc[assignment.assignmentRole] = (acc[assignment.assignmentRole] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    // Map team members
    const teamMembers = teamAssignments.map(a => ({
      id: a.user.id,
      name: `${a.user.firstName} ${a.user.lastName}`,
      email: a.user.email,
      role: a.user.role,
      assignmentRole: a.assignmentRole,
      priority: a.priority,
      assignedDate: a.createdAt,
    }));

    return {
      totalTeamMembers: teamAssignments.length,
      membersByRole,
      teamMembers,
    };
  }

  /**
   * Get client performance metrics
   */
  private async getClientMetrics(clientId: string): Promise<any> {
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    // Get current month SLA metrics
    const slaMetrics = await this.slaMetricRepository.find({
      where: {
        clientId,
        metricDate: startOfMonth,
      },
    });

    const currentSLAAchievement = slaMetrics.length > 0
      ? slaMetrics.reduce((sum, m) => sum + m.achievementPercentage, 0) / slaMetrics.length
      : 100;

    // Get ticket counts
    const tickets = await this.ticketRepository.find({
      where: { clientId },
    });

    const openTickets = tickets.filter(t => t.isOpen).length;
    const criticalTickets = tickets.filter(
      t => t.priority === 'critical' && t.isOpen
    ).length;

    const resolvedTickets = tickets.filter(t => t.resolvedDate);
    const avgResolutionTime = resolvedTickets.length > 0
      ? resolvedTickets.reduce((sum, t) => sum + (t.resolutionTimeMinutes || 0), 0) / 
        resolvedTickets.length / 60
      : 0;

    // Get service health from latest performance metrics
    const serviceMetrics = await this.getLatestServiceMetrics(clientId);
    const serviceHealth = serviceMetrics.map(m => ({
      serviceName: m.serviceScope?.service?.name || 'Unknown',
      status: m.getStatus(),
      metric: m.displayName,
      value: m.value,
    }));

    return {
      currentSLAAchievement,
      openTickets,
      criticalTickets,
      avgResolutionTime,
      serviceHealth,
    };
  }

  /**
   * Calculate summary statistics
   */
  private calculateSummary(
    contracts: any[],
    services: any[],
    financials: any,
    metrics: any
  ): any {
    // Determine overall health status
    let healthStatus: 'good' | 'warning' | 'critical' = 'good';
    
    if (metrics.criticalTickets > 0 || metrics.currentSLAAchievement < 90) {
      healthStatus = 'critical';
    } else if (
      metrics.openTickets > 10 || 
      metrics.currentSLAAchievement < 95 ||
      contracts.some(c => c.isExpiringSoon)
    ) {
      healthStatus = 'warning';
    }

    return {
      totalActiveContracts: contracts.length,
      totalActiveServices: services.length,
      totalValue: financials.totalContractValue,
      healthStatus,
      lastUpdated: new Date(),
    };
  }

  /**
   * Extract key parameters from scope details
   */
  private extractKeyParameters(scopeDetails: any): Record<string, any> {
    if (!scopeDetails) return {};

    // Extract most important parameters
    const keyParams: Record<string, any> = {};
    const importantKeys = [
      'endpoints',
      'users',
      'devices',
      'storage',
      'bandwidth',
      'responseSLA',
      'coverage',
    ];

    for (const key of importantKeys) {
      if (scopeDetails[key] !== undefined) {
        keyParams[key] = scopeDetails[key];
      }
    }

    return keyParams;
  }

  /**
   * Get latest service metrics for a client
   */
  private async getLatestServiceMetrics(
    clientId: string
  ): Promise<ServicePerformanceMetric[]> {
    const subquery = this.serviceMetricRepository
      .createQueryBuilder('sm1')
      .select('MAX(sm1.metricDate)', 'maxDate')
      .addSelect('sm1.serviceScopeId')
      .where('sm1.clientId = :clientId', { clientId })
      .groupBy('sm1.serviceScopeId');

    return await this.serviceMetricRepository
      .createQueryBuilder('sm')
      .innerJoin(
        `(${subquery.getQuery()})`,
        'latest',
        'sm.serviceScopeId = latest.serviceScopeId AND sm.metricDate = latest.maxDate'
      )
      .leftJoinAndSelect('sm.serviceScope', 'serviceScope')
      .leftJoinAndSelect('serviceScope.service', 'service')
      .where('sm.clientId = :clientId', { clientId })
      .setParameter('clientId', clientId)
      .getMany();
  }
} 