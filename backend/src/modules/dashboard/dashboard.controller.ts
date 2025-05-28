import { Controller, Get, UseGuards, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '../../enums/user-role.enum';
import { DashboardDataService } from './dashboard-data.service';
import {
  SLADashboardDto,
  TicketDashboardDto,
  ServiceMetricsDashboardDto,
  SubscriptionMetricsDashboardDto,
  ExpirationDashboardDto,
} from './dto';

/**
 * Dashboard Controller
 * Provides aggregated data endpoints for operational dashboards
 * All endpoints are secured and require appropriate roles
 */
@ApiTags('dashboard')
@Controller('dashboard')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth()
export class DashboardController {
  constructor(private readonly dashboardService: DashboardDataService) {}

  /**
   * Get SLA metrics for dashboard
   */
  @Get('sla-metrics')
  @Roles(UserRole.ADMIN, UserRole.MANAGER, UserRole.ACCOUNT_MANAGER, UserRole.PROJECT_MANAGER)
  @ApiOperation({ summary: 'Get SLA dashboard metrics' })
  @ApiResponse({ status: 200, description: 'SLA metrics retrieved successfully', type: SLADashboardDto })
  async getSLAMetrics(): Promise<SLADashboardDto> {
    return this.dashboardService.getSLADashboardData();
  }

  /**
   * Get ticket metrics for dashboard
   */
  @Get('ticket-metrics')
  @Roles(UserRole.ADMIN, UserRole.MANAGER, UserRole.ACCOUNT_MANAGER, UserRole.PROJECT_MANAGER)
  @ApiOperation({ summary: 'Get ticket dashboard metrics' })
  @ApiResponse({ status: 200, description: 'Ticket metrics retrieved successfully', type: TicketDashboardDto })
  async getTicketMetrics(): Promise<TicketDashboardDto> {
    return this.dashboardService.getTicketDashboardData();
  }

  /**
   * Get service performance metrics for dashboard gauges
   */
  @Get('service-metrics')
  @Roles(UserRole.ADMIN, UserRole.MANAGER, UserRole.ACCOUNT_MANAGER, UserRole.PROJECT_MANAGER)
  @ApiOperation({ summary: 'Get service performance metrics' })
  @ApiResponse({ status: 200, description: 'Service metrics retrieved successfully', type: ServiceMetricsDashboardDto })
  async getServiceMetrics(): Promise<ServiceMetricsDashboardDto> {
    return this.dashboardService.getServiceMetricsDashboard();
  }

  /**
   * Get subscription metrics and trends
   */
  @Get('subscription-metrics')
  @Roles(UserRole.ADMIN, UserRole.MANAGER)
  @ApiOperation({ summary: 'Get subscription metrics and trends' })
  @ApiResponse({ status: 200, description: 'Subscription metrics retrieved successfully', type: SubscriptionMetricsDashboardDto })
  async getSubscriptionMetrics(): Promise<SubscriptionMetricsDashboardDto> {
    return this.dashboardService.getSubscriptionMetrics();
  }

  /**
   * Get expiring SAFs and contracts
   */
  @Get('expirations')
  @Roles(UserRole.ADMIN, UserRole.MANAGER, UserRole.ACCOUNT_MANAGER)
  @ApiOperation({ summary: 'Get expiring SAFs and contracts' })
  @ApiResponse({ status: 200, description: 'Expiration data retrieved successfully', type: ExpirationDashboardDto })
  @ApiQuery({ name: 'days', required: false, description: 'Number of days to look ahead (default: 30)' })
  async getExpirations(@Query('days') days?: number): Promise<ExpirationDashboardDto> {
    return this.dashboardService.getExpirationData();
  }

  /**
   * Drill-down endpoint for SLA breaches
   */
  @Get('sla-metrics/breaches')
  @Roles(UserRole.ADMIN, UserRole.MANAGER, UserRole.ACCOUNT_MANAGER, UserRole.PROJECT_MANAGER)
  @ApiOperation({ summary: 'Get detailed list of SLA breaches' })
  @ApiQuery({ name: 'clientId', required: false, description: 'Filter by client ID' })
  @ApiQuery({ name: 'metricType', required: false, description: 'Filter by metric type' })
  @ApiQuery({ name: 'startDate', required: false, description: 'Start date for filtering' })
  @ApiQuery({ name: 'endDate', required: false, description: 'End date for filtering' })
  async getSLABreaches(
    @Query('clientId') clientId?: string,
    @Query('metricType') metricType?: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    // Implementation would filter SLA breaches based on parameters
    // This is a placeholder for drill-down functionality
    return {
      message: 'Drill-down endpoint for SLA breaches',
      filters: { clientId, metricType, startDate, endDate },
    };
  }

  /**
   * Drill-down endpoint for tickets by status/priority
   */
  @Get('tickets/list')
  @Roles(UserRole.ADMIN, UserRole.MANAGER, UserRole.ACCOUNT_MANAGER, UserRole.PROJECT_MANAGER)
  @ApiOperation({ summary: 'Get filtered list of tickets' })
  @ApiQuery({ name: 'status', required: false, description: 'Filter by status' })
  @ApiQuery({ name: 'priority', required: false, description: 'Filter by priority' })
  @ApiQuery({ name: 'clientId', required: false, description: 'Filter by client ID' })
  @ApiQuery({ name: 'service', required: false, description: 'Filter by service' })
  async getTicketsList(
    @Query('status') status?: string,
    @Query('priority') priority?: string,
    @Query('clientId') clientId?: string,
    @Query('service') service?: string,
  ) {
    // Implementation would return filtered tickets
    // This is a placeholder for drill-down functionality
    return {
      message: 'Drill-down endpoint for tickets',
      filters: { status, priority, clientId, service },
    };
  }
} 