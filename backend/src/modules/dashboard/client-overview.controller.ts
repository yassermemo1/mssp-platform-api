import { Controller, Get, Param, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiParam } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '../../enums/user-role.enum';
import { ClientOverviewService } from './client-overview.service';
import { ClientOverviewDto } from './dto/client-overview.dto';

/**
 * Client Overview Controller
 * Provides comprehensive client 360 view data
 */
@ApiTags('client-overview')
@Controller('clients/:clientId/overview')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth()
export class ClientOverviewController {
  constructor(private readonly clientOverviewService: ClientOverviewService) {}

  /**
   * Get complete client overview (360 view)
   */
  @Get()
  @Roles(UserRole.ADMIN, UserRole.MANAGER, UserRole.ACCOUNT_MANAGER, UserRole.PROJECT_MANAGER)
  @ApiOperation({ summary: 'Get complete client overview data' })
  @ApiParam({ name: 'clientId', description: 'Client ID' })
  @ApiResponse({ 
    status: 200, 
    description: 'Client overview retrieved successfully', 
    type: ClientOverviewDto 
  })
  @ApiResponse({ status: 404, description: 'Client not found' })
  async getClientOverview(@Param('clientId') clientId: string): Promise<ClientOverviewDto> {
    return this.clientOverviewService.getClientOverview(clientId);
  }

  /**
   * Alternative endpoint structure - get specific sections
   */
  @Get('profile')
  @Roles(UserRole.ADMIN, UserRole.MANAGER, UserRole.ACCOUNT_MANAGER, UserRole.PROJECT_MANAGER)
  @ApiOperation({ summary: 'Get client profile information only' })
  @ApiParam({ name: 'clientId', description: 'Client ID' })
  async getClientProfile(@Param('clientId') clientId: string) {
    const overview = await this.clientOverviewService.getClientOverview(clientId);
    return overview.profile;
  }

  @Get('contracts')
  @Roles(UserRole.ADMIN, UserRole.MANAGER, UserRole.ACCOUNT_MANAGER, UserRole.PROJECT_MANAGER)
  @ApiOperation({ summary: 'Get client contracts summary' })
  @ApiParam({ name: 'clientId', description: 'Client ID' })
  async getClientContracts(@Param('clientId') clientId: string) {
    const overview = await this.clientOverviewService.getClientOverview(clientId);
    return overview.contracts;
  }

  @Get('services')
  @Roles(UserRole.ADMIN, UserRole.MANAGER, UserRole.ACCOUNT_MANAGER, UserRole.PROJECT_MANAGER)
  @ApiOperation({ summary: 'Get client services summary' })
  @ApiParam({ name: 'clientId', description: 'Client ID' })
  async getClientServices(@Param('clientId') clientId: string) {
    const overview = await this.clientOverviewService.getClientOverview(clientId);
    return overview.services;
  }

  @Get('financials')
  @Roles(UserRole.ADMIN, UserRole.MANAGER, UserRole.ACCOUNT_MANAGER)
  @ApiOperation({ summary: 'Get client financial summary' })
  @ApiParam({ name: 'clientId', description: 'Client ID' })
  async getClientFinancials(@Param('clientId') clientId: string) {
    const overview = await this.clientOverviewService.getClientOverview(clientId);
    return overview.financials;
  }

  @Get('metrics')
  @Roles(UserRole.ADMIN, UserRole.MANAGER, UserRole.ACCOUNT_MANAGER, UserRole.PROJECT_MANAGER)
  @ApiOperation({ summary: 'Get client performance metrics' })
  @ApiParam({ name: 'clientId', description: 'Client ID' })
  async getClientMetrics(@Param('clientId') clientId: string) {
    const overview = await this.clientOverviewService.getClientOverview(clientId);
    return overview.metrics;
  }
} 