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
  Put,
} from '@nestjs/common';
import { ServicesService, ServiceQueryOptions } from './services.service';
import { CreateServiceDto, UpdateServiceDto, UpdateScopeDefinitionTemplateDto } from './dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole, ServiceCategory, ServiceDeliveryModel } from '../../enums';

/**
 * ServicesController
 * HTTP endpoints for service catalog management
 * 
 * This controller provides comprehensive RESTful API endpoints for:
 * - GET /services - List all services with filtering and pagination
 * - GET /services/statistics - Get service statistics
 * - GET /services/:id - Get service details
 * - POST /services - Create new service (Admin/Manager only)
 * - PATCH /services/:id - Update service (Admin/Manager only)
 * - DELETE /services/:id - Soft delete service (Admin only)
 * - PATCH /services/:id/reactivate - Reactivate service (Admin only)
 * - GET /services/:id/scope-template - Get scope definition template for a service
 * - PUT /services/:id/scope-template - Update scope definition template for a service
 * 
 * Security:
 * - All endpoints require JWT authentication
 * - Create/Update operations require Admin or Manager role
 * - Delete/Reactivate operations require Admin role only
 * - Read operations are accessible to all authenticated users
 */
@Controller('services')
@UseGuards(JwtAuthGuard, RolesGuard)
export class ServicesController {
  private readonly logger = new Logger(ServicesController.name);

  constructor(private readonly servicesService: ServicesService) {}

  /**
   * Create a new service
   * POST /services
   * 
   * @param createServiceDto - Service creation data
   * @param req - Request object containing authenticated user
   * @returns Created service with 201 status
   */
  @Post()
  @HttpCode(HttpStatus.CREATED)
  @Roles(UserRole.ADMIN, UserRole.MANAGER)
  async create(
    @Body(ValidationPipe) createServiceDto: CreateServiceDto,
    @Request() req,
  ) {
    this.logger.log(`Creating service: ${createServiceDto.name}`);
    
    const service = await this.servicesService.create(createServiceDto, req.user);
    
    return {
      statusCode: HttpStatus.CREATED,
      message: 'Service created successfully',
      data: service,
    };
  }

  /**
   * Get all services with optional filtering and pagination
   * GET /services
   * 
   * Query parameters:
   * - isActive: boolean - Filter by active status
   * - category: ServiceCategory - Filter by service category
   * - deliveryModel: ServiceDeliveryModel - Filter by delivery model
   * - search: string - Search in name and description
   * - page: number - Page number for pagination (default: 1)
   * - limit: number - Items per page (default: 50, max: 100)
   * 
   * @param query - Query parameters for filtering
   * @returns Array of services matching the criteria
   */
  @Get()
  @HttpCode(HttpStatus.OK)
  @Roles(UserRole.ADMIN, UserRole.MANAGER, UserRole.PROJECT_MANAGER, UserRole.ACCOUNT_MANAGER, UserRole.ENGINEER)
  async findAll(@Query() query: any) {
    this.logger.log(`Retrieving services with query: ${JSON.stringify(query)}`);

    // Parse and validate query parameters
    const queryOptions: ServiceQueryOptions = {};

    if (query.isActive !== undefined) {
      queryOptions.isActive = query.isActive === 'true';
    }

    if (query.category && Object.values(ServiceCategory).includes(query.category)) {
      queryOptions.category = query.category as ServiceCategory;
    }

    if (query.deliveryModel && Object.values(ServiceDeliveryModel).includes(query.deliveryModel)) {
      queryOptions.deliveryModel = query.deliveryModel as ServiceDeliveryModel;
    }

    if (query.search && typeof query.search === 'string') {
      queryOptions.search = query.search.trim();
    }

    if (query.page && !isNaN(parseInt(query.page))) {
      queryOptions.page = Math.max(1, parseInt(query.page));
    }

    if (query.limit && !isNaN(parseInt(query.limit))) {
      queryOptions.limit = Math.min(100, Math.max(1, parseInt(query.limit)));
    }

    const services = await this.servicesService.findAll(queryOptions);

    return {
      statusCode: HttpStatus.OK,
      message: 'Services retrieved successfully',
      data: services,
      meta: {
        total: services.length,
        page: queryOptions.page || 1,
        limit: queryOptions.limit || 50,
        filters: {
          isActive: queryOptions.isActive,
          category: queryOptions.category,
          deliveryModel: queryOptions.deliveryModel,
          search: queryOptions.search,
        },
      },
    };
  }

  /**
   * Get service statistics
   * GET /services/statistics
   * 
   * @returns Service statistics including counts by category and delivery model
   */
  @Get('statistics')
  @HttpCode(HttpStatus.OK)
  @Roles(UserRole.ADMIN, UserRole.MANAGER, UserRole.PROJECT_MANAGER)
  async getStatistics() {
    this.logger.log('Retrieving service statistics');

    const statistics = await this.servicesService.getStatistics();

    return {
      statusCode: HttpStatus.OK,
      message: 'Service statistics retrieved successfully',
      data: statistics,
    };
  }

  /**
   * Get a single service by ID
   * GET /services/:id
   * 
   * @param id - Service UUID
   * @returns Service details with related data
   */
  @Get(':id')
  @HttpCode(HttpStatus.OK)
  @Roles(UserRole.ADMIN, UserRole.MANAGER, UserRole.PROJECT_MANAGER, UserRole.ACCOUNT_MANAGER, UserRole.ENGINEER)
  async findOne(@Param('id', ParseUUIDPipe) id: string) {
    this.logger.log(`Retrieving service: ${id}`);

    const service = await this.servicesService.findOne(id);

    return {
      statusCode: HttpStatus.OK,
      message: 'Service retrieved successfully',
      data: service,
    };
  }

  /**
   * Update an existing service
   * PATCH /services/:id
   * 
   * @param id - Service UUID
   * @param updateServiceDto - Service update data
   * @param req - Request object containing authenticated user
   * @returns Updated service
   */
  @Patch(':id')
  @HttpCode(HttpStatus.OK)
  @Roles(UserRole.ADMIN, UserRole.MANAGER)
  async update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body(ValidationPipe) updateServiceDto: UpdateServiceDto,
    @Request() req,
  ) {
    this.logger.log(`Updating service: ${id}`);

    const service = await this.servicesService.update(id, updateServiceDto, req.user);

    return {
      statusCode: HttpStatus.OK,
      message: 'Service updated successfully',
      data: service,
    };
  }

  /**
   * Soft delete a service (set isActive to false)
   * DELETE /services/:id
   * 
   * @param id - Service UUID
   * @param req - Request object containing authenticated user
   * @returns Deactivated service
   */
  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  @Roles(UserRole.ADMIN)
  async remove(@Param('id', ParseUUIDPipe) id: string, @Request() req) {
    this.logger.log(`Soft deleting service: ${id}`);

    const service = await this.servicesService.remove(id, req.user);

    return {
      statusCode: HttpStatus.OK,
      message: 'Service deactivated successfully',
      data: service,
    };
  }

  /**
   * Reactivate a previously deactivated service
   * PATCH /services/:id/reactivate
   * 
   * @param id - Service UUID
   * @param req - Request object containing authenticated user
   * @returns Reactivated service
   */
  @Patch(':id/reactivate')
  @HttpCode(HttpStatus.OK)
  @Roles(UserRole.ADMIN)
  async reactivate(@Param('id', ParseUUIDPipe) id: string, @Request() req) {
    this.logger.log(`Reactivating service: ${id}`);

    const service = await this.servicesService.reactivate(id, req.user);

    return {
      statusCode: HttpStatus.OK,
      message: 'Service reactivated successfully',
      data: service,
    };
  }

  /**
   * Get scope definition template for a specific service
   * GET /services/:id/scope-template
   * 
   * @param id - Service UUID
   * @returns Scope definition template for the service
   */
  @Get(':id/scope-template')
  @HttpCode(HttpStatus.OK)
  @Roles(UserRole.ADMIN, UserRole.MANAGER, UserRole.PROJECT_MANAGER, UserRole.ACCOUNT_MANAGER)
  async getScopeDefinitionTemplate(@Param('id', ParseUUIDPipe) id: string) {
    this.logger.log(`Retrieving scope definition template for service: ${id}`);

    const result = await this.servicesService.getScopeDefinitionTemplate(id);

    return {
      statusCode: HttpStatus.OK,
      message: 'Scope definition template retrieved successfully',
      data: result,
    };
  }

  /**
   * Update scope definition template for a specific service
   * PUT /services/:id/scope-template
   * 
   * @param id - Service UUID
   * @param updateScopeTemplateDto - Scope definition template update data
   * @param req - Request object containing authenticated user
   * @returns Updated service with new scope definition template
   */
  @Put(':id/scope-template')
  @HttpCode(HttpStatus.OK)
  @Roles(UserRole.ADMIN, UserRole.MANAGER)
  async updateScopeDefinitionTemplate(
    @Param('id', ParseUUIDPipe) id: string,
    @Body(ValidationPipe) updateScopeTemplateDto: UpdateScopeDefinitionTemplateDto,
    @Request() req,
  ) {
    this.logger.log(`Updating scope definition template for service: ${id}`);

    const service = await this.servicesService.updateScopeDefinitionTemplate(
      id,
      updateScopeTemplateDto,
      req.user,
    );

    return {
      statusCode: HttpStatus.OK,
      message: 'Scope definition template updated successfully',
      data: {
        id: service.id,
        name: service.name,
        scopeDefinitionTemplate: service.scopeDefinitionTemplate,
        updatedAt: service.updatedAt,
      },
    };
  }
} 