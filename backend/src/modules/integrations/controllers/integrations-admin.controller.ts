import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  Query,
  ParseUUIDPipe
} from '@nestjs/common';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../auth/guards/roles.guard';
import { Roles } from '../../auth/decorators/roles.decorator';
import { UserRole } from '../../../enums';
import { ExternalDataSourceService } from '../services/external-data-source.service';
import { DataSourceQueryService } from '../services/data-source-query.service';
import { CreateExternalDataSourceDto } from '../dto/create-external-data-source.dto';
import { UpdateExternalDataSourceDto } from '../dto/update-external-data-source.dto';
import { CreateDataSourceQueryDto } from '../dto/create-data-source-query.dto';
import { UpdateDataSourceQueryDto } from '../dto/update-data-source-query.dto';

/**
 * IntegrationsAdminController
 * Provides admin endpoints for managing external data sources and queries
 * All endpoints require ADMIN role
 */
@Controller('integrations/admin')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.ADMIN)
export class IntegrationsAdminController {
  constructor(
    private readonly dataSourceService: ExternalDataSourceService,
    private readonly queryService: DataSourceQueryService
  ) {}

  // ===== External Data Source Endpoints =====

  /**
   * Create a new external data source
   */
  @Post('data-sources')
  async createDataSource(@Body() dto: CreateExternalDataSourceDto) {
    return await this.dataSourceService.create(dto);
  }

  /**
   * Get all external data sources
   */
  @Get('data-sources')
  async findAllDataSources() {
    return await this.dataSourceService.findAll();
  }

  /**
   * Get a specific external data source
   */
  @Get('data-sources/:id')
  async findOneDataSource(@Param('id', ParseUUIDPipe) id: string) {
    return await this.dataSourceService.findOne(id);
  }

  /**
   * Update an external data source
   */
  @Patch('data-sources/:id')
  async updateDataSource(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateExternalDataSourceDto
  ) {
    return await this.dataSourceService.update(id, dto);
  }

  /**
   * Delete an external data source
   */
  @Delete('data-sources/:id')
  async removeDataSource(@Param('id', ParseUUIDPipe) id: string) {
    await this.dataSourceService.remove(id);
    return { message: 'Data source deleted successfully' };
  }

  /**
   * Test connection to an external data source
   */
  @Post('data-sources/:id/test')
  async testDataSourceConnection(@Param('id', ParseUUIDPipe) id: string) {
    return await this.dataSourceService.testConnection(id);
  }

  // ===== Data Source Query Endpoints =====

  /**
   * Create a new data source query
   */
  @Post('queries')
  async createQuery(@Body() dto: CreateDataSourceQueryDto) {
    return await this.queryService.create(dto);
  }

  /**
   * Get all data source queries
   */
  @Get('queries')
  async findAllQueries(@Query('dataSourceId') dataSourceId?: string) {
    return await this.queryService.findAll(dataSourceId);
  }

  /**
   * Get a specific data source query
   */
  @Get('queries/:id')
  async findOneQuery(@Param('id', ParseUUIDPipe) id: string) {
    return await this.queryService.findOne(id);
  }

  /**
   * Update a data source query
   */
  @Patch('queries/:id')
  async updateQuery(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateDataSourceQueryDto
  ) {
    return await this.queryService.update(id, dto);
  }

  /**
   * Delete a data source query
   */
  @Delete('queries/:id')
  async removeQuery(@Param('id', ParseUUIDPipe) id: string) {
    await this.queryService.remove(id);
    return { message: 'Query deleted successfully' };
  }

  /**
   * Validate a query template and get required placeholders
   */
  @Get('queries/:id/validate')
  async validateQueryTemplate(@Param('id', ParseUUIDPipe) id: string) {
    return await this.queryService.validateTemplate(id);
  }
} 