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
  Res,
} from '@nestjs/common';
import { Response } from 'express';
import { ClientsService } from './clients.service';
import { CreateClientDto, UpdateClientDto, QueryClientDto } from './dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '../../enums/user-role.enum';
import { Client } from '../../entities/client.entity';

/**
 * ClientsController
 * Handles all HTTP requests for client CRUD operations
 * All endpoints require authentication via JwtAuthGuard
 * Specific endpoints require additional role-based authorization
 */
@Controller('clients')
@UseGuards(JwtAuthGuard) // Apply JWT authentication to all endpoints
export class ClientsController {
  private readonly logger = new Logger(ClientsController.name);

  constructor(private readonly clientsService: ClientsService) {}

  /**
   * Create a new client
   * POST /clients
   * Requires: ADMIN, MANAGER, or ACCOUNT_MANAGER role
   * Returns: 201 Created with the created client
   */
  @Post()
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.MANAGER, UserRole.ACCOUNT_MANAGER)
  @HttpCode(HttpStatus.CREATED)
  async create(
    @Body() createClientDto: CreateClientDto,
    @Request() req: any,
  ): Promise<Client> {
    this.logger.log(
      `POST /clients - Creating client: ${createClientDto.companyName} by user: ${req.user.email}`,
    );

    return this.clientsService.create(createClientDto, req.user);
  }

  /**
   * Retrieve all clients with advanced filtering
   * GET /clients
   * Requires: Any authenticated user
   * Returns: 200 OK with paginated array of clients
   */
  @Get()
  @HttpCode(HttpStatus.OK)
  async findAll(
    @Query() queryDto: QueryClientDto,
    @Request() req: any,
  ): Promise<{ data: Client[], total: number, page: number, limit: number }> {
    this.logger.log(
      `GET /clients - Retrieving clients with filters by user: ${req.user.email}`,
    );

    return this.clientsService.findAll(queryDto);
  }

  /**
   * Export clients to CSV
   * GET /clients/export/csv
   * Requires: ADMIN or MANAGER role
   * Returns: CSV file download
   */
  @Get('export/csv')
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.MANAGER)
  @HttpCode(HttpStatus.OK)
  async exportToCsv(
    @Query() queryDto: QueryClientDto,
    @Res() res: Response,
    @Request() req: any,
  ): Promise<void> {
    this.logger.log(
      `GET /clients/export/csv - Exporting clients to CSV by user: ${req.user.email}`,
    );

    const csvData = await this.clientsService.exportToCsv(queryDto);
    
    const timestamp = new Date().toISOString().split('T')[0];
    const filename = `clients_export_${timestamp}.csv`;
    
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.send(csvData);
  }

  /**
   * Retrieve a single client by ID
   * GET /clients/:id
   * Requires: Any authenticated user
   * Returns: 200 OK with the client, or 404 Not Found
   */
  @Get(':id')
  @HttpCode(HttpStatus.OK)
  async findOne(
    @Param('id') id: string,
    @Request() req: any,
  ): Promise<Client> {
    this.logger.log(
      `GET /clients/${id} - Retrieving client by user: ${req.user.email}`,
    );

    return this.clientsService.findOne(id);
  }

  /**
   * Update an existing client
   * PATCH /clients/:id
   * Requires: ADMIN, MANAGER, or ACCOUNT_MANAGER role
   * Returns: 200 OK with the updated client, or 404 Not Found
   */
  @Patch(':id')
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.MANAGER, UserRole.ACCOUNT_MANAGER)
  @HttpCode(HttpStatus.OK)
  async update(
    @Param('id') id: string,
    @Body() updateClientDto: UpdateClientDto,
    @Request() req: any,
  ): Promise<Client> {
    this.logger.log(
      `PATCH /clients/${id} - Updating client by user: ${req.user.email}`,
    );

    return this.clientsService.update(id, updateClientDto, req.user);
  }

  /**
   * Delete a client
   * DELETE /clients/:id
   * Requires: ADMIN or MANAGER role (more restrictive than create/update)
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
      `DELETE /clients/${id} - Deleting client by user: ${req.user.email}`,
    );

    return this.clientsService.remove(id, req.user);
  }

  /**
   * Get all service scopes for a specific client
   * GET /clients/:id/service-scopes
   * Requires: Any authenticated user
   * Returns: 200 OK with array of service scopes for the client
   */
  @Get(':id/service-scopes')
  @HttpCode(HttpStatus.OK)
  async getServiceScopes(
    @Param('id') id: string,
    @Request() req: any,
  ): Promise<any[]> {
    this.logger.log(
      `GET /clients/${id}/service-scopes - Retrieving service scopes for client by user: ${req.user.email}`,
    );

    return this.clientsService.getServiceScopes(id);
  }
} 