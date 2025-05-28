import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CustomFieldValue, CustomFieldDefinition } from '../../../entities';
import { CustomFieldEntityType } from '../../../enums';

/**
 * Custom Field Value Service
 * Handles CRUD operations for custom field values (EAV approach)
 */
@Injectable()
export class CustomFieldValueService {
  constructor(
    @InjectRepository(CustomFieldValue)
    private readonly customFieldValueRepository: Repository<CustomFieldValue>,
    @InjectRepository(CustomFieldDefinition)
    private readonly customFieldDefinitionRepository: Repository<CustomFieldDefinition>,
  ) {}

  /**
   * Save custom field values for an entity
   */
  async saveCustomFieldValues(
    entityType: CustomFieldEntityType,
    entityId: string,
    customFieldData: Record<string, any>
  ): Promise<void> {
    // Get field definitions for validation
    const fieldDefinitions = await this.customFieldDefinitionRepository.find({
      where: { entityType, isActive: true },
    });

    const fieldDefinitionMap = new Map<string, CustomFieldDefinition>();
    fieldDefinitions.forEach(def => {
      fieldDefinitionMap.set(def.name, def);
    });

    // Process each custom field value
    for (const [fieldName, value] of Object.entries(customFieldData)) {
      const definition = fieldDefinitionMap.get(fieldName);
      if (!definition) continue;

      // Find existing value or create new one
      let customFieldValue = await this.customFieldValueRepository.findOne({
        where: {
          fieldDefinitionId: definition.id,
          entityType,
          entityId,
        },
      });

      if (!customFieldValue) {
        customFieldValue = this.customFieldValueRepository.create({
          fieldDefinitionId: definition.id,
          entityType,
          entityId,
        });
      }

      // Set the value based on field type
      customFieldValue.setValue(value, definition.fieldType);
      await this.customFieldValueRepository.save(customFieldValue);
    }
  }

  /**
   * Get custom field values for an entity
   */
  async getCustomFieldValues(
    entityType: CustomFieldEntityType,
    entityId: string
  ): Promise<Record<string, any>> {
    const customFieldValues = await this.customFieldValueRepository.find({
      where: { entityType, entityId },
      relations: ['fieldDefinition'],
    });

    const result: Record<string, any> = {};
    customFieldValues.forEach(value => {
      if (value.fieldDefinition) {
        result[value.fieldDefinition.name] = value.getValue();
      }
    });

    return result;
  }

  /**
   * Delete custom field values for an entity
   */
  async deleteCustomFieldValues(
    entityType: CustomFieldEntityType,
    entityId: string
  ): Promise<void> {
    await this.customFieldValueRepository.delete({
      entityType,
      entityId,
    });
  }

  /**
   * Get custom field values for multiple entities
   */
  async getCustomFieldValuesForEntities(
    entityType: CustomFieldEntityType,
    entityIds: string[]
  ): Promise<Record<string, Record<string, any>>> {
    if (entityIds.length === 0) return {};

    const customFieldValues = await this.customFieldValueRepository.find({
      where: { 
        entityType, 
        entityId: { $in: entityIds } as any 
      },
      relations: ['fieldDefinition'],
    });

    const result: Record<string, Record<string, any>> = {};
    
    // Initialize empty objects for all entity IDs
    entityIds.forEach(id => {
      result[id] = {};
    });

    // Populate with actual values
    customFieldValues.forEach(value => {
      if (value.fieldDefinition) {
        if (!result[value.entityId]) {
          result[value.entityId] = {};
        }
        result[value.entityId][value.fieldDefinition.name] = value.getValue();
      }
    });

    return result;
  }
} 