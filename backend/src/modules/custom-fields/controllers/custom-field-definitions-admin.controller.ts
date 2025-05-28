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
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../auth/guards/roles.guard';
import { Roles } from '../../auth/decorators/roles.decorator';
import { UserRole, CustomFieldEntityType } from '../../../enums';
import { CustomFieldDefinitionService } from '../services/custom-field-definition.service';
import { CreateCustomFieldDefinitionDto } from '../dto/create-custom-field-definition.dto';
import { UpdateCustomFieldDefinitionDto } from '../dto/update-custom-field-definition.dto';

/**
 * Admin Controller for Custom Field Definitions
 * Handles CRUD operations for custom field definitions (Admin only)
 */
@Controller('admin/custom-field-definitions')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.ADMIN)
export class CustomFieldDefinitionsAdminController {
  constructor(
    private readonly customFieldDefinitionService: CustomFieldDefinitionService,
  ) {}

  /**
   * Create a new custom field definition
   * POST /admin/custom-field-definitions
   */
  @Post()
  @HttpCode(HttpStatus.CREATED)
  async create(@Body() createDto: CreateCustomFieldDefinitionDto) {
    return await this.customFieldDefinitionService.create(createDto);
  }

  /**
   * Get all custom field definitions with optional filtering by entity type
   * GET /admin/custom-field-definitions?entityType=CLIENT
   */
  @Get()
  async findAll(@Query('entityType') entityType?: CustomFieldEntityType) {
    return await this.customFieldDefinitionService.findAll(entityType);
  }

  /**
   * Get a specific custom field definition by ID
   * GET /admin/custom-field-definitions/:id
   */
  @Get(':id')
  async findOne(@Param('id') id: string) {
    return await this.customFieldDefinitionService.findOne(id);
  }

  /**
   * Update a custom field definition
   * PATCH /admin/custom-field-definitions/:id
   */
  @Patch(':id')
  async update(
    @Param('id') id: string,
    @Body() updateDto: UpdateCustomFieldDefinitionDto,
  ) {
    return await this.customFieldDefinitionService.update(id, updateDto);
  }

  /**
   * Soft delete a custom field definition
   * DELETE /admin/custom-field-definitions/:id
   */
  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async remove(@Param('id') id: string) {
    await this.customFieldDefinitionService.remove(id);
  }

  /**
   * Hard delete a custom field definition (permanent)
   * DELETE /admin/custom-field-definitions/:id/hard
   */
  @Delete(':id/hard')
  @HttpCode(HttpStatus.NO_CONTENT)
  async hardDelete(@Param('id') id: string) {
    await this.customFieldDefinitionService.hardDelete(id);
  }

  /**
   * Reorder custom field definitions for a specific entity type
   * PATCH /admin/custom-field-definitions/reorder/:entityType
   */
  @Patch('reorder/:entityType')
  @HttpCode(HttpStatus.NO_CONTENT)
  async reorder(
    @Param('entityType') entityType: CustomFieldEntityType,
    @Body() fieldOrders: { id: string; displayOrder: number }[],
  ) {
    await this.customFieldDefinitionService.reorder(entityType, fieldOrders);
  }
} 