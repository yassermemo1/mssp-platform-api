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
import { HardwareAssetsService, PaginatedResult } from './hardware-assets.service';
import { CreateHardwareAssetDto, UpdateHardwareAssetDto } from './dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '../../enums/user-role.enum';
import { HardwareAsset } from '../../entities/hardware-asset.entity';
import { HardwareAssetType, HardwareAssetStatus } from '../../enums';

/**
 * HardwareAssetsController
 * Handles all HTTP requests for hardware asset CRUD operations
 * All endpoints require authentication via JwtAuthGuard
 * Specific endpoints require additional role-based authorization
 */
@Controller('hardware-assets')
@UseGuards(JwtAuthGuard) // Apply JWT authentication to all endpoints
export class HardwareAssetsController {
  private readonly logger = new Logger(HardwareAssetsController.name);

  constructor(private readonly hardwareAssetsService: HardwareAssetsService) {}

  /**
   * Create a new hardware asset
   * POST /hardware-assets
   * Requires: ADMIN, MANAGER role (asset management is typically restricted)
   * Returns: 201 Created with the created hardware asset
   */
  @Post()
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.MANAGER)
  @HttpCode(HttpStatus.CREATED)
  async create(
    @Body() createHardwareAssetDto: CreateHardwareAssetDto,
    @Request() req: any,
  ): Promise<HardwareAsset> {
    this.logger.log(
      `POST /hardware-assets - Creating hardware asset: ${createHardwareAssetDto.assetTag} by user: ${req.user.email}`,
    );

    return this.hardwareAssetsService.create(createHardwareAssetDto, req.user);
  }

  /**
   * Retrieve all hardware assets with filtering and pagination
   * GET /hardware-assets
   * Requires: Any authenticated user
   * Query parameters:
   * - assetTag: Filter by asset tag (partial match)
   * - serialNumber: Filter by serial number (partial match)
   * - assetType: Filter by asset type (exact match)
   * - status: Filter by status (exact match)
   * - location: Filter by location (partial match)
   * - manufacturer: Filter by manufacturer (partial match)
   * - model: Filter by model (partial match)
   * - page: Page number (default: 1)
   * - limit: Items per page (default: 10)
   * Returns: 200 OK with paginated hardware assets
   */
  @Get()
  @HttpCode(HttpStatus.OK)
  async findAll(
    @Query('assetTag') assetTag?: string,
    @Query('serialNumber') serialNumber?: string,
    @Query('assetType', new ParseEnumPipe(HardwareAssetType, { optional: true })) assetType?: HardwareAssetType,
    @Query('status', new ParseEnumPipe(HardwareAssetStatus, { optional: true })) status?: HardwareAssetStatus,
    @Query('location') location?: string,
    @Query('manufacturer') manufacturer?: string,
    @Query('model') model?: string,
    @Query('page', new ParseIntPipe({ optional: true })) page?: number,
    @Query('limit', new ParseIntPipe({ optional: true })) limit?: number,
    @Request() req?: any,
  ): Promise<PaginatedResult<HardwareAsset>> {
    this.logger.log(
      `GET /hardware-assets - Retrieving hardware assets by user: ${req.user.email}`,
    );

    const queryOptions = {
      assetTag,
      serialNumber,
      assetType,
      status,
      location,
      manufacturer,
      model,
    };

    const paginationOptions = { page, limit };

    return this.hardwareAssetsService.findAll(queryOptions, paginationOptions);
  }

  /**
   * Retrieve available hardware assets for assignment
   * GET /hardware-assets/available
   * Requires: Any authenticated user
   * Returns: 200 OK with available hardware assets
   */
  @Get('available')
  @HttpCode(HttpStatus.OK)
  async findAvailable(@Request() req: any): Promise<HardwareAsset[]> {
    this.logger.log(
      `GET /hardware-assets/available - Retrieving available hardware assets by user: ${req.user.email}`,
    );

    return this.hardwareAssetsService.findAvailable();
  }

  /**
   * Retrieve a single hardware asset by ID
   * GET /hardware-assets/:id
   * Requires: Any authenticated user
   * Returns: 200 OK with the hardware asset, or 404 Not Found
   */
  @Get(':id')
  @HttpCode(HttpStatus.OK)
  async findOne(
    @Param('id') id: string,
    @Request() req: any,
  ): Promise<HardwareAsset> {
    this.logger.log(
      `GET /hardware-assets/${id} - Retrieving hardware asset by user: ${req.user.email}`,
    );

    return this.hardwareAssetsService.findOne(id);
  }

  /**
   * Update an existing hardware asset
   * PATCH /hardware-assets/:id
   * Requires: ADMIN, MANAGER role
   * Returns: 200 OK with the updated hardware asset, or 404 Not Found
   */
  @Patch(':id')
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.MANAGER)
  @HttpCode(HttpStatus.OK)
  async update(
    @Param('id') id: string,
    @Body() updateHardwareAssetDto: UpdateHardwareAssetDto,
    @Request() req: any,
  ): Promise<HardwareAsset> {
    this.logger.log(
      `PATCH /hardware-assets/${id} - Updating hardware asset by user: ${req.user.email}`,
    );

    return this.hardwareAssetsService.update(id, updateHardwareAssetDto, req.user);
  }

  /**
   * Update hardware asset status
   * PATCH /hardware-assets/:id/status
   * Requires: ADMIN, MANAGER role
   * Returns: 200 OK with the updated hardware asset
   */
  @Patch(':id/status')
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.MANAGER)
  @HttpCode(HttpStatus.OK)
  async updateStatus(
    @Param('id') id: string,
    @Body('status', new ParseEnumPipe(HardwareAssetStatus)) status: HardwareAssetStatus,
    @Request() req: any,
  ): Promise<HardwareAsset> {
    this.logger.log(
      `PATCH /hardware-assets/${id}/status - Updating hardware asset status to ${status} by user: ${req.user.email}`,
    );

    return this.hardwareAssetsService.updateStatus(id, status, req.user);
  }

  /**
   * Soft delete a hardware asset (update status to DISPOSED)
   * DELETE /hardware-assets/:id
   * Requires: ADMIN role (most restrictive for asset deletion)
   * Returns: 200 OK with the updated hardware asset (soft deleted)
   */
  @Delete(':id')
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN)
  @HttpCode(HttpStatus.OK)
  async remove(
    @Param('id') id: string,
    @Request() req: any,
  ): Promise<HardwareAsset> {
    this.logger.log(
      `DELETE /hardware-assets/${id} - Soft deleting hardware asset by user: ${req.user.email}`,
    );

    return this.hardwareAssetsService.remove(id, req.user);
  }
} 