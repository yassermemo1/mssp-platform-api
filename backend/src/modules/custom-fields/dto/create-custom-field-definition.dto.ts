import {
  IsString,
  IsEnum,
  IsOptional,
  IsBoolean,
  IsNumber,
  IsArray,
  IsObject,
  MaxLength,
  MinLength,
  Min,
  Max,
} from 'class-validator';
import { CustomFieldEntityType, CustomFieldType } from '../../../enums';

/**
 * Data Transfer Object for creating a custom field definition
 */
export class CreateCustomFieldDefinitionDto {
  /**
   * Entity type that this custom field applies to
   */
  @IsEnum(CustomFieldEntityType, {
    message: 'Entity type must be a valid CustomFieldEntityType',
  })
  entityType: CustomFieldEntityType;

  /**
   * Machine-readable field name (e.g., 'internal_risk_score')
   */
  @IsString()
  @MinLength(1, { message: 'Field name must not be empty' })
  @MaxLength(100, { message: 'Field name must not exceed 100 characters' })
  name: string;

  /**
   * Human-readable field label (e.g., 'Internal Risk Score')
   */
  @IsString()
  @MinLength(1, { message: 'Field label must not be empty' })
  @MaxLength(200, { message: 'Field label must not exceed 200 characters' })
  label: string;

  /**
   * Data type of the custom field
   */
  @IsEnum(CustomFieldType, {
    message: 'Field type must be a valid CustomFieldType',
  })
  fieldType: CustomFieldType;

  /**
   * Options for select/multi-select fields
   */
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  selectOptions?: string[];

  /**
   * Whether this field is required
   */
  @IsOptional()
  @IsBoolean()
  isRequired?: boolean;

  /**
   * Display order for organizing fields in forms
   */
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(9999)
  displayOrder?: number;

  /**
   * Placeholder text for form inputs
   */
  @IsOptional()
  @IsString()
  @MaxLength(255, { message: 'Placeholder text must not exceed 255 characters' })
  placeholderText?: string;

  /**
   * Help text for tooltips or field descriptions
   */
  @IsOptional()
  @IsString()
  helpText?: string;

  /**
   * Validation rules stored as JSON
   */
  @IsOptional()
  @IsObject()
  validationRules?: Record<string, any>;

  /**
   * Default value for the field
   */
  @IsOptional()
  defaultValue?: any;
} 