import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CustomFieldDefinition } from '../../../entities';
import { CustomFieldEntityType } from '../../../enums';
import { CreateCustomFieldDefinitionDto } from '../dto/create-custom-field-definition.dto';
import { UpdateCustomFieldDefinitionDto } from '../dto/update-custom-field-definition.dto';

/**
 * Custom Field Definition Service
 * Handles CRUD operations for custom field definitions
 */
@Injectable()
export class CustomFieldDefinitionService {
  constructor(
    @InjectRepository(CustomFieldDefinition)
    private readonly customFieldDefinitionRepository: Repository<CustomFieldDefinition>,
  ) {}

  /**
   * Create a new custom field definition
   */
  async create(createDto: CreateCustomFieldDefinitionDto): Promise<CustomFieldDefinition> {
    // Check if field name already exists for this entity type
    const existingField = await this.customFieldDefinitionRepository.findOne({
      where: {
        entityType: createDto.entityType,
        name: createDto.name,
      },
    });

    if (existingField) {
      throw new ConflictException(
        `Custom field with name '${createDto.name}' already exists for entity type '${createDto.entityType}'`
      );
    }

    const fieldDefinition = this.customFieldDefinitionRepository.create(createDto);
    return await this.customFieldDefinitionRepository.save(fieldDefinition);
  }

  /**
   * Find all custom field definitions for a specific entity type
   */
  async findByEntityType(
    entityType: CustomFieldEntityType,
    includeInactive = false
  ): Promise<CustomFieldDefinition[]> {
    const whereCondition: any = { entityType };
    
    if (!includeInactive) {
      whereCondition.isActive = true;
    }

    return await this.customFieldDefinitionRepository.find({
      where: whereCondition,
      order: { displayOrder: 'ASC', createdAt: 'ASC' },
    });
  }

  /**
   * Find all custom field definitions (admin view)
   */
  async findAll(entityType?: CustomFieldEntityType): Promise<CustomFieldDefinition[]> {
    const whereCondition: any = {};
    
    if (entityType) {
      whereCondition.entityType = entityType;
    }

    return await this.customFieldDefinitionRepository.find({
      where: whereCondition,
      order: { entityType: 'ASC', displayOrder: 'ASC', createdAt: 'ASC' },
    });
  }

  /**
   * Find a custom field definition by ID
   */
  async findOne(id: string): Promise<CustomFieldDefinition> {
    const fieldDefinition = await this.customFieldDefinitionRepository.findOne({
      where: { id },
    });

    if (!fieldDefinition) {
      throw new NotFoundException(`Custom field definition with ID '${id}' not found`);
    }

    return fieldDefinition;
  }

  /**
   * Update a custom field definition
   */
  async update(id: string, updateDto: UpdateCustomFieldDefinitionDto): Promise<CustomFieldDefinition> {
    const fieldDefinition = await this.findOne(id);

    // Check for name conflicts if name is being changed
    if (updateDto.name && updateDto.name !== fieldDefinition.name) {
      const existingField = await this.customFieldDefinitionRepository.findOne({
        where: {
          entityType: fieldDefinition.entityType,
          name: updateDto.name,
          id: { $ne: id } as any, // Exclude current field
        },
      });

      if (existingField) {
        throw new ConflictException(
          `Custom field with name '${updateDto.name}' already exists for entity type '${fieldDefinition.entityType}'`
        );
      }
    }

    Object.assign(fieldDefinition, updateDto);
    return await this.customFieldDefinitionRepository.save(fieldDefinition);
  }

  /**
   * Soft delete a custom field definition
   */
  async remove(id: string): Promise<void> {
    const fieldDefinition = await this.findOne(id);
    fieldDefinition.isActive = false;
    await this.customFieldDefinitionRepository.save(fieldDefinition);
  }

  /**
   * Hard delete a custom field definition (admin only)
   */
  async hardDelete(id: string): Promise<void> {
    const result = await this.customFieldDefinitionRepository.delete(id);
    if (result.affected === 0) {
      throw new NotFoundException(`Custom field definition with ID '${id}' not found`);
    }
  }

  /**
   * Reorder custom field definitions
   */
  async reorder(entityType: CustomFieldEntityType, fieldOrders: { id: string; displayOrder: number }[]): Promise<void> {
    const updatePromises = fieldOrders.map(({ id, displayOrder }) =>
      this.customFieldDefinitionRepository.update(
        { id, entityType },
        { displayOrder }
      )
    );

    await Promise.all(updatePromises);
  }

  /**
   * Get custom field definitions as a map for quick lookup
   */
  async getFieldDefinitionsMap(entityType: CustomFieldEntityType): Promise<Map<string, CustomFieldDefinition>> {
    const definitions = await this.findByEntityType(entityType);
    const map = new Map<string, CustomFieldDefinition>();
    
    definitions.forEach(def => {
      map.set(def.name, def);
    });
    
    return map;
  }
} 