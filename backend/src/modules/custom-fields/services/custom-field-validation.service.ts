import { Injectable, BadRequestException } from '@nestjs/common';
import { CustomFieldDefinition } from '../../../entities';
import { CustomFieldType } from '../../../enums';

/**
 * Custom Field Validation Service
 * Handles validation of custom field values against their definitions
 */
@Injectable()
export class CustomFieldValidationService {
  /**
   * Validate custom field data against field definitions
   */
  async validateCustomFieldData(
    customFieldData: Record<string, any>,
    fieldDefinitions: Map<string, CustomFieldDefinition>
  ): Promise<Record<string, any>> {
    const validatedData: Record<string, any> = {};
    const errors: string[] = [];

    // Check required fields
    for (const [fieldName, definition] of fieldDefinitions) {
      if (definition.isRequired && (!customFieldData || !(fieldName in customFieldData) || customFieldData[fieldName] == null)) {
        errors.push(`Required field '${definition.label}' is missing`);
      }
    }

    // Validate provided fields
    if (customFieldData) {
      for (const [fieldName, value] of Object.entries(customFieldData)) {
        const definition = fieldDefinitions.get(fieldName);
        
        if (!definition) {
          errors.push(`Unknown custom field '${fieldName}'`);
          continue;
        }

        if (!definition.isActive) {
          errors.push(`Custom field '${fieldName}' is no longer active`);
          continue;
        }

        try {
          const validatedValue = await this.validateFieldValue(value, definition);
          validatedData[fieldName] = validatedValue;
        } catch (error) {
          errors.push(`Field '${definition.label}': ${error.message}`);
        }
      }
    }

    if (errors.length > 0) {
      throw new BadRequestException(`Custom field validation failed: ${errors.join(', ')}`);
    }

    return validatedData;
  }

  /**
   * Validate a single field value against its definition
   */
  private async validateFieldValue(value: any, definition: CustomFieldDefinition): Promise<any> {
    // Handle null/undefined values
    if (value == null) {
      if (definition.isRequired) {
        throw new Error('Value is required');
      }
      return null;
    }

    // Type-specific validation
    switch (definition.fieldType) {
      case CustomFieldType.TEXT_SINGLE_LINE:
        return this.validateTextSingleLine(value, definition);
      
      case CustomFieldType.TEXT_MULTI_LINE:
        return this.validateTextMultiLine(value, definition);
      
      case CustomFieldType.NUMBER_INTEGER:
        return this.validateNumberInteger(value, definition);
      
      case CustomFieldType.NUMBER_DECIMAL:
        return this.validateNumberDecimal(value, definition);
      
      case CustomFieldType.BOOLEAN:
        return this.validateBoolean(value, definition);
      
      case CustomFieldType.DATE:
        return this.validateDate(value, definition);
      
      case CustomFieldType.DATETIME:
        return this.validateDateTime(value, definition);
      
      case CustomFieldType.EMAIL:
        return this.validateEmail(value, definition);
      
      case CustomFieldType.URL:
        return this.validateUrl(value, definition);
      
      case CustomFieldType.PHONE:
        return this.validatePhone(value, definition);
      
      case CustomFieldType.SELECT_SINGLE_DROPDOWN:
        return this.validateSelectSingle(value, definition);
      
      case CustomFieldType.SELECT_MULTI_CHECKBOX:
        return this.validateSelectMulti(value, definition);
      
      case CustomFieldType.CURRENCY:
        return this.validateCurrency(value, definition);
      
      case CustomFieldType.PERCENTAGE:
        return this.validatePercentage(value, definition);
      
      default:
        return value; // Pass through for unknown types
    }
  }

  private validateTextSingleLine(value: any, definition: CustomFieldDefinition): string {
    const stringValue = String(value);
    
    if (definition.validationRules) {
      const { minLength, maxLength, pattern } = definition.validationRules;
      
      if (minLength && stringValue.length < minLength) {
        throw new Error(`Must be at least ${minLength} characters long`);
      }
      
      if (maxLength && stringValue.length > maxLength) {
        throw new Error(`Must not exceed ${maxLength} characters`);
      }
      
      if (pattern && !new RegExp(pattern).test(stringValue)) {
        throw new Error('Invalid format');
      }
    }
    
    return stringValue;
  }

  private validateTextMultiLine(value: any, definition: CustomFieldDefinition): string {
    const stringValue = String(value);
    
    if (definition.validationRules) {
      const { minLength, maxLength } = definition.validationRules;
      
      if (minLength && stringValue.length < minLength) {
        throw new Error(`Must be at least ${minLength} characters long`);
      }
      
      if (maxLength && stringValue.length > maxLength) {
        throw new Error(`Must not exceed ${maxLength} characters`);
      }
    }
    
    return stringValue;
  }

  private validateNumberInteger(value: any, definition: CustomFieldDefinition): number {
    const numValue = parseInt(value, 10);
    
    if (isNaN(numValue)) {
      throw new Error('Must be a valid integer');
    }
    
    if (definition.validationRules) {
      const { min, max } = definition.validationRules;
      
      if (min !== undefined && numValue < min) {
        throw new Error(`Must be at least ${min}`);
      }
      
      if (max !== undefined && numValue > max) {
        throw new Error(`Must not exceed ${max}`);
      }
    }
    
    return numValue;
  }

  private validateNumberDecimal(value: any, definition: CustomFieldDefinition): number {
    const numValue = parseFloat(value);
    
    if (isNaN(numValue)) {
      throw new Error('Must be a valid number');
    }
    
    if (definition.validationRules) {
      const { min, max, decimalPlaces } = definition.validationRules;
      
      if (min !== undefined && numValue < min) {
        throw new Error(`Must be at least ${min}`);
      }
      
      if (max !== undefined && numValue > max) {
        throw new Error(`Must not exceed ${max}`);
      }
      
      if (decimalPlaces !== undefined) {
        const decimals = (numValue.toString().split('.')[1] || '').length;
        if (decimals > decimalPlaces) {
          throw new Error(`Must not have more than ${decimalPlaces} decimal places`);
        }
      }
    }
    
    return numValue;
  }

  private validateBoolean(value: any, definition: CustomFieldDefinition): boolean {
    if (typeof value === 'boolean') {
      return value;
    }
    
    if (typeof value === 'string') {
      const lowerValue = value.toLowerCase();
      if (lowerValue === 'true' || lowerValue === '1' || lowerValue === 'yes') {
        return true;
      }
      if (lowerValue === 'false' || lowerValue === '0' || lowerValue === 'no') {
        return false;
      }
    }
    
    throw new Error('Must be a valid boolean value');
  }

  private validateDate(value: any, definition: CustomFieldDefinition): Date {
    const date = new Date(value);
    
    if (isNaN(date.getTime())) {
      throw new Error('Must be a valid date');
    }
    
    if (definition.validationRules) {
      const { minDate, maxDate } = definition.validationRules;
      
      if (minDate && date < new Date(minDate)) {
        throw new Error(`Date must be after ${minDate}`);
      }
      
      if (maxDate && date > new Date(maxDate)) {
        throw new Error(`Date must be before ${maxDate}`);
      }
    }
    
    return date;
  }

  private validateDateTime(value: any, definition: CustomFieldDefinition): Date {
    return this.validateDate(value, definition); // Same validation as date
  }

  private validateEmail(value: any, definition: CustomFieldDefinition): string {
    const stringValue = String(value);
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    
    if (!emailRegex.test(stringValue)) {
      throw new Error('Must be a valid email address');
    }
    
    return stringValue;
  }

  private validateUrl(value: any, definition: CustomFieldDefinition): string {
    const stringValue = String(value);
    
    try {
      new URL(stringValue);
    } catch {
      throw new Error('Must be a valid URL');
    }
    
    return stringValue;
  }

  private validatePhone(value: any, definition: CustomFieldDefinition): string {
    const stringValue = String(value);
    // Basic phone validation - can be enhanced based on requirements
    const phoneRegex = /^[\+]?[1-9][\d]{0,15}$/;
    
    if (!phoneRegex.test(stringValue.replace(/[\s\-\(\)]/g, ''))) {
      throw new Error('Must be a valid phone number');
    }
    
    return stringValue;
  }

  private validateSelectSingle(value: any, definition: CustomFieldDefinition): string {
    const stringValue = String(value);
    
    if (!definition.selectOptions || !definition.selectOptions.includes(stringValue)) {
      throw new Error(`Must be one of: ${definition.selectOptions?.join(', ')}`);
    }
    
    return stringValue;
  }

  private validateSelectMulti(value: any, definition: CustomFieldDefinition): string[] {
    if (!Array.isArray(value)) {
      throw new Error('Must be an array of values');
    }
    
    const stringValues = value.map(v => String(v));
    
    if (definition.selectOptions) {
      for (const val of stringValues) {
        if (!definition.selectOptions.includes(val)) {
          throw new Error(`Invalid option '${val}'. Must be one of: ${definition.selectOptions.join(', ')}`);
        }
      }
    }
    
    return stringValues;
  }

  private validateCurrency(value: any, definition: CustomFieldDefinition): number {
    return this.validateNumberDecimal(value, definition);
  }

  private validatePercentage(value: any, definition: CustomFieldDefinition): number {
    const numValue = this.validateNumberDecimal(value, definition);
    
    if (numValue < 0 || numValue > 100) {
      throw new Error('Percentage must be between 0 and 100');
    }
    
    return numValue;
  }
} 