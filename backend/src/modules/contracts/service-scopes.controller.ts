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
import { ServiceScopesService } from './service-scopes.service';
import { CreateServiceScopeDto, UpdateServiceScopeDto, ServiceScopeQueryDto } from './dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '../../enums/user-role.enum';
import { ServiceScope } from '../../entities/service-scope.entity';

/**
 * ServiceScopesController
 * RESTful API endpoints for comprehensive service scope management
 * 
 * This controller provides a hybrid routing approach:
 * 
 * Nested Routes (for contract context):
 * - POST /contracts/:contractId/service-scopes - Create service scope for contract
 * - GET /contracts/:contractId/service-scopes - List service scopes for contract
 * 
 * Flat Routes (for individual service scope management):
 * - GET /service-scopes - List all service scopes (admin overview)
 * - GET /service-scopes/:id - Get service scope details
 * - PATCH /service-scopes/:id - Update service scope
 * - DELETE /service-scopes/:id - Delete service scope
 * 
 * All endpoints are protected by JWT authentication and role-based access control
 */
@Controller()
@UseGuards(JwtAuthGuard, RolesGuard)
export class ServiceScopesController {
  private readonly logger = new Logger(ServiceScopesController.name);

  constructor(private readonly serviceScopesService: ServiceScopesService) {}

  // ========================================
  // NESTED ROUTES: Contract Context
  // ========================================

  /**
   * Create a new service scope for a specific contract
   * POST /contracts/:contractId/service-scopes
   * 
   * Requires: Admin, Manager, or Account Manager role
   * Body: CreateServiceScopeDto with service scope details
   * Returns: Created service scope with 201 status
   */
  @Post('contracts/:contractId/service-scopes')
  @HttpCode(HttpStatus.CREATED)
  @Roles(UserRole.ADMIN, UserRole.MANAGER, UserRole.ACCOUNT_MANAGER)
  async createForContract(
    @Param('contractId', ParseUUIDPipe) contractId: string,
    @Body(ValidationPipe) createServiceScopeDto: CreateServiceScopeDto,
    @Request() req: any,
  ): Promise<{
    statusCode: number;
    message: string;
    data: ServiceScope;
  }> {
    this.logger.log(`Creating service scope for contract: ${contractId}`);

    const serviceScope = await this.serviceScopesService.createForContract(
      contractId,
      createServiceScopeDto,
      req.user,
    );

    return {
      statusCode: HttpStatus.CREATED,
      message: 'Service scope created successfully',
      data: serviceScope,
    };
  }

  /**
   * Get all service scopes for a specific contract
   * GET /contracts/:contractId/service-scopes
   * 
   * Requires: Any authenticated user
   * Returns: List of service scopes for the contract
   */
  @Get('contracts/:contractId/service-scopes')
  @Roles(
    UserRole.ADMIN,
    UserRole.MANAGER,
    UserRole.PROJECT_MANAGER,
    UserRole.ACCOUNT_MANAGER,
    UserRole.ENGINEER,
  )
  async findAllForContract(
    @Param('contractId', ParseUUIDPipe) contractId: string,
  ): Promise<{
    statusCode: number;
    message: string;
    data: ServiceScope[];
  }> {
    this.logger.log(`Fetching service scopes for contract: ${contractId}`);

    const serviceScopes = await this.serviceScopesService.findAllForContract(contractId);

    return {
      statusCode: HttpStatus.OK,
      message: 'Service scopes retrieved successfully',
      data: serviceScopes,
    };
  }

  // ========================================
  // FLAT ROUTES: Individual Service Scope Management
  // ========================================

  /**
   * Get all service scopes with filtering and pagination
   * GET /service-scopes
   * 
   * Requires: Any authenticated user
   * Query params: contractId, serviceId, safStatus, isActive, search, minPrice, maxPrice, page, limit, sortBy, sortOrder
   * Returns: Paginated list of service scopes
   */
  @Get('service-scopes')
  @Roles(
    UserRole.ADMIN,
    UserRole.MANAGER,
    UserRole.PROJECT_MANAGER,
    UserRole.ACCOUNT_MANAGER,
    UserRole.ENGINEER,
  )
  async findAll(
    @Query(ValidationPipe) queryDto: ServiceScopeQueryDto,
  ): Promise<{
    statusCode: number;
    message: string;
    data: ServiceScope[];
    meta: {
      count: number;
      page: number;
      limit: number;
      totalPages: number;
    };
  }> {
    this.logger.log('Fetching service scopes with filters', queryDto);

    const result = await this.serviceScopesService.findAll(queryDto);

    return {
      statusCode: HttpStatus.OK,
      message: 'Service scopes retrieved successfully',
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
   * Get a single service scope by ID
   * GET /service-scopes/:id
   * 
   * Requires: Any authenticated user
   * Param: id (UUID) - Service scope ID
   * Returns: Service scope details with relationships
   */
  @Get('service-scopes/:id')
  @Roles(
    UserRole.ADMIN,
    UserRole.MANAGER,
    UserRole.PROJECT_MANAGER,
    UserRole.ACCOUNT_MANAGER,
    UserRole.ENGINEER,
  )
  async findOne(
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<{
    statusCode: number;
    message: string;
    data: ServiceScope;
  }> {
    this.logger.log(`Fetching service scope: ${id}`);

    const serviceScope = await this.serviceScopesService.findOne(id);

    return {
      statusCode: HttpStatus.OK,
      message: 'Service scope retrieved successfully',
      data: serviceScope,
    };
  }

  /**
   * Update an existing service scope
   * PATCH /service-scopes/:id
   * 
   * Requires: Admin, Manager, or Account Manager role
   * Param: id (UUID) - Service scope ID
   * Body: UpdateServiceScopeDto with updated data
   * Returns: Updated service scope with 200 status
   */
  @Patch('service-scopes/:id')
  @HttpCode(HttpStatus.OK)
  @Roles(UserRole.ADMIN, UserRole.MANAGER, UserRole.ACCOUNT_MANAGER)
  async update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body(ValidationPipe) updateServiceScopeDto: UpdateServiceScopeDto,
    @Request() req: any,
  ): Promise<{
    statusCode: number;
    message: string;
    data: ServiceScope;
  }> {
    this.logger.log(`Updating service scope: ${id}`);

    const serviceScope = await this.serviceScopesService.update(
      id,
      updateServiceScopeDto,
      req.user,
    );

    return {
      statusCode: HttpStatus.OK,
      message: 'Service scope updated successfully',
      data: serviceScope,
    };
  }

  /**
   * Soft delete a service scope (set isActive to false)
   * DELETE /service-scopes/:id
   * 
   * Requires: Admin, Manager, or Account Manager role
   * Param: id (UUID) - Service scope ID
   * Returns: Deactivated service scope with 200 status
   */
  @Delete('service-scopes/:id')
  @HttpCode(HttpStatus.OK)
  @Roles(UserRole.ADMIN, UserRole.MANAGER, UserRole.ACCOUNT_MANAGER)
  async remove(
    @Param('id', ParseUUIDPipe) id: string,
    @Request() req: any,
  ): Promise<{
    statusCode: number;
    message: string;
    data: ServiceScope;
  }> {
    this.logger.log(`Soft deleting service scope: ${id}`);

    const serviceScope = await this.serviceScopesService.remove(id, req.user);

    return {
      statusCode: HttpStatus.OK,
      message: 'Service scope deactivated successfully',
      data: serviceScope,
    };
  }

  // ========================================
  // UTILITY ENDPOINTS
  // ========================================

  /**
   * Calculate total value for a contract's service scopes
   * GET /contracts/:contractId/service-scopes/total
   * 
   * Requires: Any authenticated user
   * Param: contractId (UUID) - Contract ID
   * Returns: Total value of all active service scopes
   */
  @Get('contracts/:contractId/service-scopes/total')
  @Roles(
    UserRole.ADMIN,
    UserRole.MANAGER,
    UserRole.PROJECT_MANAGER,
    UserRole.ACCOUNT_MANAGER,
    UserRole.ENGINEER,
  )
  async calculateContractTotal(
    @Param('contractId', ParseUUIDPipe) contractId: string,
  ): Promise<{
    statusCode: number;
    message: string;
    data: {
      contractId: string;
      totalValue: number;
    };
  }> {
    this.logger.log(`Calculating total value for contract: ${contractId}`);

    const totalValue = await this.serviceScopesService.calculateContractTotal(contractId);

    return {
      statusCode: HttpStatus.OK,
      message: 'Contract total calculated successfully',
      data: {
        contractId,
        totalValue,
      },
    };
  }
} 