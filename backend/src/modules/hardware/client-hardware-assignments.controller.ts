import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  Request,
  HttpCode,
  HttpStatus,
  Logger,
  Query,
  ParseIntPipe,
  ParseEnumPipe,
} from '@nestjs/common';
import { ClientHardwareAssignmentsService, PaginatedResult } from './client-hardware-assignments.service';
import { CreateClientHardwareAssignmentDto, UpdateClientHardwareAssignmentDto } from './dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '../../enums/user-role.enum';
import { ClientHardwareAssignment } from '../../entities/client-hardware-assignment.entity';
import { HardwareAssignmentStatus } from '../../enums';

/**
 * ClientHardwareAssignmentsController
 * Handles all HTTP requests for hardware assignment operations
 * All endpoints require authentication via JwtAuthGuard
 * Specific endpoints require additional role-based authorization
 */
@Controller('client-hardware-assignments')
@UseGuards(JwtAuthGuard) // Apply JWT authentication to all endpoints
export class ClientHardwareAssignmentsController {
  private readonly logger = new Logger(ClientHardwareAssignmentsController.name);

  constructor(
    private readonly clientHardwareAssignmentsService: ClientHardwareAssignmentsService,
  ) {}

  /**
   * Assign hardware to a client
   * POST /client-hardware-assignments
   * Requires: ADMIN, MANAGER, ACCOUNT_MANAGER role
   * Returns: 201 Created with the created assignment
   */
  @Post()
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.MANAGER, UserRole.ACCOUNT_MANAGER)
  @HttpCode(HttpStatus.CREATED)
  async assignHardware(
    @Body() createAssignmentDto: CreateClientHardwareAssignmentDto,
    @Request() req: any,
  ): Promise<ClientHardwareAssignment> {
    this.logger.log(
      `POST /client-hardware-assignments - Assigning hardware ${createAssignmentDto.hardwareAssetId} to client ${createAssignmentDto.clientId} by user: ${req.user.email}`,
    );

    return this.clientHardwareAssignmentsService.assignHardwareToClient(
      createAssignmentDto,
      req.user,
    );
  }

  /**
   * Retrieve all assignments with filtering and pagination
   * GET /client-hardware-assignments
   * Requires: Any authenticated user
   * Query parameters:
   * - status: Filter by assignment status
   * - clientId: Filter by client ID
   * - hardwareAssetId: Filter by hardware asset ID
   * - serviceScopeId: Filter by service scope ID
   * - page: Page number (default: 1)
   * - limit: Items per page (default: 10)
   * Returns: 200 OK with paginated assignments
   */
  @Get()
  @HttpCode(HttpStatus.OK)
  async findAll(
    @Query('status', new ParseEnumPipe(HardwareAssignmentStatus, { optional: true })) status?: HardwareAssignmentStatus,
    @Query('clientId') clientId?: string,
    @Query('hardwareAssetId') hardwareAssetId?: string,
    @Query('serviceScopeId') serviceScopeId?: string,
    @Query('page', new ParseIntPipe({ optional: true })) page?: number,
    @Query('limit', new ParseIntPipe({ optional: true })) limit?: number,
    @Request() req?: any,
  ): Promise<PaginatedResult<ClientHardwareAssignment>> {
    this.logger.log(
      `GET /client-hardware-assignments - Retrieving assignments by user: ${req.user.email}`,
    );

    const queryOptions = {
      status,
      clientId,
      hardwareAssetId,
      serviceScopeId,
    };

    const paginationOptions = { page, limit };

    return this.clientHardwareAssignmentsService.findAll(queryOptions, paginationOptions);
  }

  /**
   * Retrieve a single assignment by ID
   * GET /client-hardware-assignments/:id
   * Requires: Any authenticated user
   * Returns: 200 OK with the assignment, or 404 Not Found
   */
  @Get(':id')
  @HttpCode(HttpStatus.OK)
  async findOne(
    @Param('id') id: string,
    @Request() req: any,
  ): Promise<ClientHardwareAssignment> {
    this.logger.log(
      `GET /client-hardware-assignments/${id} - Retrieving assignment by user: ${req.user.email}`,
    );

    return this.clientHardwareAssignmentsService.findOne(id);
  }

  /**
   * Update an existing assignment
   * PATCH /client-hardware-assignments/:id
   * Requires: ADMIN, MANAGER, ACCOUNT_MANAGER role
   * Returns: 200 OK with the updated assignment, or 404 Not Found
   */
  @Patch(':id')
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.MANAGER, UserRole.ACCOUNT_MANAGER)
  @HttpCode(HttpStatus.OK)
  async update(
    @Param('id') id: string,
    @Body() updateAssignmentDto: UpdateClientHardwareAssignmentDto,
    @Request() req: any,
  ): Promise<ClientHardwareAssignment> {
    this.logger.log(
      `PATCH /client-hardware-assignments/${id} - Updating assignment by user: ${req.user.email}`,
    );

    return this.clientHardwareAssignmentsService.update(id, updateAssignmentDto, req.user);
  }

  /**
   * Delete an assignment
   * DELETE /client-hardware-assignments/:id
   * Requires: ADMIN, MANAGER role (more restrictive for deletion)
   * Returns: 204 No Content on success, or 404 Not Found
   */
  @Delete(':id')
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.MANAGER)
  @HttpCode(HttpStatus.NO_CONTENT)
  async remove(
    @Param('id') id: string,
    @Request() req: any,
  ): Promise<void> {
    this.logger.log(
      `DELETE /client-hardware-assignments/${id} - Deleting assignment by user: ${req.user.email}`,
    );

    return this.clientHardwareAssignmentsService.remove(id, req.user);
  }
}

/**
 * Nested routes for convenient access to assignments by related entities
 */

/**
 * ClientsHardwareAssignmentsController
 * Nested routes for client-specific hardware assignments
 * GET /clients/:clientId/hardware-assignments
 */
@Controller('clients/:clientId/hardware-assignments')
@UseGuards(JwtAuthGuard)
export class ClientsHardwareAssignmentsController {
  private readonly logger = new Logger(ClientsHardwareAssignmentsController.name);

  constructor(
    private readonly clientHardwareAssignmentsService: ClientHardwareAssignmentsService,
  ) {}

  /**
   * Retrieve all assignments for a specific client
   * GET /clients/:clientId/hardware-assignments
   * Requires: Any authenticated user
   * Returns: 200 OK with paginated assignments for the client
   */
  @Get()
  @HttpCode(HttpStatus.OK)
  async findAllForClient(
    @Param('clientId') clientId: string,
    @Query('status', new ParseEnumPipe(HardwareAssignmentStatus, { optional: true })) status?: HardwareAssignmentStatus,
    @Query('page', new ParseIntPipe({ optional: true })) page?: number,
    @Query('limit', new ParseIntPipe({ optional: true })) limit?: number,
    @Request() req?: any,
  ): Promise<PaginatedResult<ClientHardwareAssignment>> {
    this.logger.log(
      `GET /clients/${clientId}/hardware-assignments - Retrieving assignments for client by user: ${req.user.email}`,
    );

    const queryOptions = { status };
    const paginationOptions = { page, limit };

    return this.clientHardwareAssignmentsService.findAllForClient(
      clientId,
      queryOptions,
      paginationOptions,
    );
  }
}

/**
 * HardwareAssetsAssignmentsController
 * Nested routes for hardware asset assignment history
 * GET /hardware-assets/:hardwareAssetId/assignments
 */
@Controller('hardware-assets/:hardwareAssetId/assignments')
@UseGuards(JwtAuthGuard)
export class HardwareAssetsAssignmentsController {
  private readonly logger = new Logger(HardwareAssetsAssignmentsController.name);

  constructor(
    private readonly clientHardwareAssignmentsService: ClientHardwareAssignmentsService,
  ) {}

  /**
   * Retrieve all assignments for a specific hardware asset
   * GET /hardware-assets/:hardwareAssetId/assignments
   * Requires: Any authenticated user
   * Returns: 200 OK with paginated assignment history for the hardware asset
   */
  @Get()
  @HttpCode(HttpStatus.OK)
  async findAllForHardwareAsset(
    @Param('hardwareAssetId') hardwareAssetId: string,
    @Query('status', new ParseEnumPipe(HardwareAssignmentStatus, { optional: true })) status?: HardwareAssignmentStatus,
    @Query('page', new ParseIntPipe({ optional: true })) page?: number,
    @Query('limit', new ParseIntPipe({ optional: true })) limit?: number,
    @Request() req?: any,
  ): Promise<PaginatedResult<ClientHardwareAssignment>> {
    this.logger.log(
      `GET /hardware-assets/${hardwareAssetId}/assignments - Retrieving assignments for hardware asset by user: ${req.user.email}`,
    );

    const queryOptions = { status };
    const paginationOptions = { page, limit };

    return this.clientHardwareAssignmentsService.findAllForHardwareAsset(
      hardwareAssetId,
      queryOptions,
      paginationOptions,
    );
  }
}

/**
 * ServiceScopesHardwareAssignmentsController
 * Nested routes for service scope hardware assignments
 * GET /service-scopes/:serviceScopeId/hardware-assignments
 */
@Controller('service-scopes/:serviceScopeId/hardware-assignments')
@UseGuards(JwtAuthGuard)
export class ServiceScopesHardwareAssignmentsController {
  private readonly logger = new Logger(ServiceScopesHardwareAssignmentsController.name);

  constructor(
    private readonly clientHardwareAssignmentsService: ClientHardwareAssignmentsService,
  ) {}

  /**
   * Retrieve all assignments for a specific service scope
   * GET /service-scopes/:serviceScopeId/hardware-assignments
   * Requires: Any authenticated user
   * Returns: 200 OK with paginated assignments for the service scope
   */
  @Get()
  @HttpCode(HttpStatus.OK)
  async findAllForServiceScope(
    @Param('serviceScopeId') serviceScopeId: string,
    @Query('status', new ParseEnumPipe(HardwareAssignmentStatus, { optional: true })) status?: HardwareAssignmentStatus,
    @Query('page', new ParseIntPipe({ optional: true })) page?: number,
    @Query('limit', new ParseIntPipe({ optional: true })) limit?: number,
    @Request() req?: any,
  ): Promise<PaginatedResult<ClientHardwareAssignment>> {
    this.logger.log(
      `GET /service-scopes/${serviceScopeId}/hardware-assignments - Retrieving assignments for service scope by user: ${req.user.email}`,
    );

    const queryOptions = { status };
    const paginationOptions = { page, limit };

    return this.clientHardwareAssignmentsService.findAllForServiceScope(
      serviceScopeId,
      queryOptions,
      paginationOptions,
    );
  }
} 