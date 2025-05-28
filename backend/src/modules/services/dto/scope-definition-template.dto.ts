import {
  IsObject,
  IsOptional,
  ValidateNested,
  IsArray,
  IsString,
  IsEnum,
  IsBoolean,
  IsNumber,
  ArrayMinSize,
} from 'class-validator';
import { Transform, Type } from 'class-transformer';
import { ScopeDefinitionTemplate, ScopeDefinitionField } from '../../../entities/service.entity';

/**
 * DTO for validating individual scope definition fields
 */
export class ScopeDefinitionFieldDto implements ScopeDefinitionField {
  @IsString()
  name: string;

  @IsString()
  label: string;

  @IsEnum(['string', 'number', 'boolean', 'select', 'textarea', 'date', 'email', 'url'])
  type: 'string' | 'number' | 'boolean' | 'select' | 'textarea' | 'date' | 'email' | 'url';

  @IsOptional()
  @IsBoolean()
  required?: boolean;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  options?: string[];

  @IsOptional()
  @IsNumber()
  min?: number;

  @IsOptional()
  @IsNumber()
  max?: number;

  @IsOptional()
  @IsNumber()
  minLength?: number;

  @IsOptional()
  @IsNumber()
  maxLength?: number;

  @IsOptional()
  @IsString()
  placeholder?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  default?: any;
}

/**
 * DTO for validating scope definition template
 */
export class ScopeDefinitionTemplateDto implements ScopeDefinitionTemplate {
  @IsArray()
  @ArrayMinSize(1, { message: 'Template must have at least one field' })
  @ValidateNested({ each: true })
  @Type(() => ScopeDefinitionFieldDto)
  fields: ScopeDefinitionFieldDto[];

  @IsOptional()
  @IsString()
  version?: string;

  @IsOptional()
  @IsString()
  description?: string;
}

/**
 * UpdateScopeDefinitionTemplateDto
 * Data Transfer Object for updating service scope definition templates
 * 
 * This DTO is used for the PUT /services/:id/scope-template endpoint
 * to update or replace the entire scope definition template for a service
 */
export class UpdateScopeDefinitionTemplateDto {
  /**
   * Scope definition template - defines the structure for service scope details
   * This field specifies what fields, types, and options are available
   * when configuring the scope of this service in a contract
   */
  @IsObject({ message: 'Scope definition template must be a valid object' })
  @ValidateNested()
  @Type(() => ScopeDefinitionTemplateDto)
  @Transform(({ value }) => {
    if (typeof value === 'string') {
      try {
        return JSON.parse(value);
      } catch {
        return value; // Let validation handle the error
      }
    }
    return value;
  })
  scopeDefinitionTemplate: ScopeDefinitionTemplateDto;
} 