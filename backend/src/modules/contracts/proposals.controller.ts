import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  UseGuards,
  Request,
  HttpStatus,
  HttpCode,
  ParseUUIDPipe,
  ValidationPipe,
  Logger,
} from '@nestjs/common';
import { ProposalsService } from './proposals.service';
import { CreateProposalDto, UpdateProposalDto, ProposalQueryDto } from './dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '../../enums/user-role.enum';
import { Proposal } from '../../entities/proposal.entity';

/**
 * ProposalsController
 * RESTful API endpoints for comprehensive proposal management
 * 
 * This controller provides a hybrid routing approach:
 * 
 * Nested Routes (for service scope context):
 * - POST /service-scopes/:serviceScopeId/proposals - Create proposal for service scope
 * - GET /service-scopes/:serviceScopeId/proposals - List proposals for service scope
 * 
 * Flat Routes (for individual proposal management):
 * - GET /proposals - List all proposals (admin overview)
 * - GET /proposals/:id - Get proposal details
 * - PATCH /proposals/:id - Update proposal
 * - DELETE /proposals/:id - Delete proposal
 * - GET /proposals/statistics - Get proposal statistics
 * 
 * All endpoints are protected by JWT authentication and role-based access control
 */
@Controller()
@UseGuards(JwtAuthGuard, RolesGuard)
export class ProposalsController {
  private readonly logger = new Logger(ProposalsController.name);

  constructor(private readonly proposalsService: ProposalsService) {}

  // ========================================
  // NESTED ROUTES: Service Scope Context
  // ========================================

  /**
   * Create a new proposal for a specific service scope
   * POST /service-scopes/:serviceScopeId/proposals
   * 
   * Requires: Admin, Manager, or Account Manager role
   * Body: CreateProposalDto with proposal details
   * Returns: Created proposal with 201 status
   */
  @Post('service-scopes/:serviceScopeId/proposals')
  @HttpCode(HttpStatus.CREATED)
  @Roles(UserRole.ADMIN, UserRole.MANAGER, UserRole.ACCOUNT_MANAGER)
  async createProposalForServiceScope(
    @Param('serviceScopeId', ParseUUIDPipe) serviceScopeId: string,
    @Body(ValidationPipe) createProposalDto: CreateProposalDto,
    @Request() req: any,
  ): Promise<{
    statusCode: number;
    message: string;
    data: Proposal;
  }> {
    this.logger.log(`Creating proposal for service scope: ${serviceScopeId}`);
    
    const proposal = await this.proposalsService.createProposalForServiceScope(
      serviceScopeId,
      createProposalDto,
      req.user,
    );
    
    return {
      statusCode: HttpStatus.CREATED,
      message: 'Proposal created successfully',
      data: proposal,
    };
  }

  /**
   * Get all proposals for a specific service scope
   * GET /service-scopes/:serviceScopeId/proposals
   * 
   * Requires: Any authenticated user
   * Query params: proposalType, status, search, page, limit
   * Returns: Paginated list of proposals for the service scope
   */
  @Get('service-scopes/:serviceScopeId/proposals')
  @Roles(
    UserRole.ADMIN,
    UserRole.MANAGER,
    UserRole.PROJECT_MANAGER,
    UserRole.ACCOUNT_MANAGER,
    UserRole.ENGINEER,
  )
  async findProposalsForServiceScope(
    @Param('serviceScopeId', ParseUUIDPipe) serviceScopeId: string,
    @Query(ValidationPipe) queryDto: ProposalQueryDto,
  ): Promise<{
    statusCode: number;
    message: string;
    data: Proposal[];
    meta: {
      count: number;
      page: number;
      limit: number;
      totalPages: number;
    };
  }> {
    this.logger.log(`Fetching proposals for service scope: ${serviceScopeId}`, queryDto);
    
    const result = await this.proposalsService.findAllProposalsForServiceScope(
      serviceScopeId,
      queryDto,
    );
    
    return {
      statusCode: HttpStatus.OK,
      message: 'Proposals retrieved successfully',
      data: result.data,
      meta: {
        count: result.count,
        page: result.page,
        limit: result.limit,
        totalPages: result.totalPages,
      },
    };
  }

  // ========================================
  // FLAT ROUTES: Individual Proposal Management
  // ========================================

  /**
   * Create a new proposal (flat route for direct proposal creation)
   * POST /proposals
   * 
   * Requires: Admin, Manager, or Account Manager role
   * Body: CreateProposalDto with proposal details including serviceScopeId
   * Returns: Created proposal with 201 status
   */
  @Post('proposals')
  @HttpCode(HttpStatus.CREATED)
  @Roles(UserRole.ADMIN, UserRole.MANAGER, UserRole.ACCOUNT_MANAGER)
  async createProposal(
    @Body(ValidationPipe) createProposalDto: CreateProposalDto,
    @Request() req: any,
  ): Promise<{
    statusCode: number;
    message: string;
    data: Proposal;
  }> {
    this.logger.log(`Creating proposal via flat route for service scope: ${createProposalDto.serviceScopeId}`);
    
    const proposal = await this.proposalsService.createProposalForServiceScope(
      createProposalDto.serviceScopeId,
      createProposalDto,
      req.user,
    );
    
    return {
      statusCode: HttpStatus.CREATED,
      message: 'Proposal created successfully',
      data: proposal,
    };
  }

  /**
   * Get all proposals across all service scopes (admin overview)
   * GET /proposals
   * 
   * Requires: Admin or Manager role
   * Query params: proposalType, status, search, page, limit
   * Returns: Paginated list of all proposals
   */
  @Get('proposals')
  @Roles(UserRole.ADMIN, UserRole.MANAGER)
  async findAllProposals(
    @Query(ValidationPipe) queryDto: ProposalQueryDto,
  ): Promise<{
    statusCode: number;
    message: string;
    data: Proposal[];
    meta: {
      count: number;
      page: number;
      limit: number;
      totalPages: number;
    };
  }> {
    this.logger.log('Fetching all proposals with filters', queryDto);
    
    const result = await this.proposalsService.findAllProposals(queryDto);
    
    return {
      statusCode: HttpStatus.OK,
      message: 'All proposals retrieved successfully',
      data: result.data,
      meta: {
        count: result.count,
        page: result.page,
        limit: result.limit,
        totalPages: result.totalPages,
      },
    };
  }

  /**
   * Get proposal statistics for dashboard and analytics
   * GET /proposals/statistics
   * 
   * Requires: Admin or Manager role
   * Query params: clientId (optional) - Filter statistics by specific client
   * Returns: Comprehensive proposal statistics including counts, values, and trends
   */
  @Get('proposals/statistics')
  @Roles(UserRole.ADMIN, UserRole.MANAGER)
  async getProposalStatistics(
    @Query('clientId') clientId?: string,
  ): Promise<{
    statusCode: number;
    message: string;
    data: {
      total: number;
      byStatus: Record<string, number>;
      byType: Record<string, number>;
      totalValue: number;
      averageValue: number;
      expiringSoon: number;
    };
  }> {
    this.logger.log('Fetching proposal statistics', { clientId });
    
    const statistics = await this.proposalsService.getProposalStatistics(clientId);
    
    return {
      statusCode: HttpStatus.OK,
      message: 'Proposal statistics retrieved successfully',
      data: statistics,
    };
  }

  /**
   * Get a single proposal by ID
   * GET /proposals/:id
   * 
   * Requires: Any authenticated user
   * Param: id (UUID) - Proposal ID
   * Returns: Proposal details with relationships
   */
  @Get('proposals/:id')
  @Roles(
    UserRole.ADMIN,
    UserRole.MANAGER,
    UserRole.PROJECT_MANAGER,
    UserRole.ACCOUNT_MANAGER,
    UserRole.ENGINEER,
  )
  async findOneProposal(
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<{
    statusCode: number;
    message: string;
    data: Proposal;
  }> {
    this.logger.log(`Fetching proposal with ID: ${id}`);
    
    const proposal = await this.proposalsService.findOneProposal(id);
    
    return {
      statusCode: HttpStatus.OK,
      message: 'Proposal retrieved successfully',
      data: proposal,
    };
  }

  /**
   * Update an existing proposal
   * PATCH /proposals/:id
   * 
   * Requires: Admin, Manager, or Account Manager role
   * Param: id (UUID) - Proposal ID
   * Body: UpdateProposalDto with fields to update
   * Returns: Updated proposal
   */
  @Patch('proposals/:id')
  @Roles(UserRole.ADMIN, UserRole.MANAGER, UserRole.ACCOUNT_MANAGER)
  async updateProposal(
    @Param('id', ParseUUIDPipe) id: string,
    @Body(ValidationPipe) updateProposalDto: UpdateProposalDto,
    @Request() req: any,
  ): Promise<{
    statusCode: number;
    message: string;
    data: Proposal;
  }> {
    this.logger.log(`Updating proposal with ID: ${id}`);
    
    const proposal = await this.proposalsService.updateProposal(
      id,
      updateProposalDto,
      req.user,
    );
    
    return {
      statusCode: HttpStatus.OK,
      message: 'Proposal updated successfully',
      data: proposal,
    };
  }

  /**
   * Delete a proposal by ID
   * DELETE /proposals/:id
   * 
   * Requires: Admin or Manager role (stricter permissions for deletion)
   * Param: id (UUID) - Proposal ID
   * Returns: Success confirmation with 200 status
   */
  @Delete('proposals/:id')
  @Roles(UserRole.ADMIN, UserRole.MANAGER)
  async removeProposal(
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<{
    statusCode: number;
    message: string;
  }> {
    this.logger.log(`Deleting proposal with ID: ${id}`);
    
    await this.proposalsService.removeProposal(id);
    
    return {
      statusCode: HttpStatus.OK,
      message: 'Proposal deleted successfully',
    };
  }
} 