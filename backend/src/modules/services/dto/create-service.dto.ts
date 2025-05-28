import {
  IsString,
  IsNotEmpty,
  IsEnum,
  IsOptional,
  IsNumber,
  IsBoolean,
  IsPositive,
  MaxLength,
  MinLength,
  IsObject,
  ValidateNested,
} from 'class-validator';
import { Transform, Type } from 'class-transformer';
import { ServiceCategory, ServiceDeliveryModel } from '../../../enums';
import { ScopeDefinitionTemplate } from '../../../entities/service.entity';

/**
 * CreateServiceDto
 * Data Transfer Object for creating new services in the catalog
 * 
 * This DTO validates all required fields for service creation:
 * - Service name (required, unique)
 * - Description (optional)
 * - Category (required, enum validation)
 * - Delivery model (required, enum validation)
 * - Base price (optional, positive number)
 * - Active status (optional, defaults to true)
 */
export class CreateServiceDto {
  /**
   * Service name - must be unique across the entire catalog
   * Required field with length validation
   */
  @IsString()
  @IsNotEmpty()
  @MinLength(2, { message: 'Service name must be at least 2 characters long' })
  @MaxLength(255, { message: 'Service name cannot exceed 255 characters' })
  @Transform(({ value }) => value?.trim())
  name: string;

  /**
   * Detailed description of the service (optional)
   * Can include service overview, what's included, deliverables, etc.
   */
  @IsOptional()
  @IsString()
  @MaxLength(5000, { message: 'Description cannot exceed 5000 characters' })
  @Transform(({ value }) => value?.trim() || null)
  description?: string;

  /**
   * Service category for organization and filtering
   * Must be a valid ServiceCategory enum value
   */
  @IsEnum(ServiceCategory, {
    message: `Category must be one of: ${Object.values(ServiceCategory).join(', ')}`,
  })
  category: ServiceCategory;

  /**
   * Service delivery model - how the service is delivered to clients
   * Must be a valid ServiceDeliveryModel enum value
   */
  @IsEnum(ServiceDeliveryModel, {
    message: `Delivery model must be one of: ${Object.values(ServiceDeliveryModel).join(', ')}`,
  })
  deliveryModel: ServiceDeliveryModel;

  /**
   * Base price or starting price for this service (optional)
   * Must be a positive number if provided
   */
  @IsOptional()
  @IsNumber(
    { maxDecimalPlaces: 2 },
    { message: 'Base price must be a number with at most 2 decimal places' },
  )
  @IsPositive({ message: 'Base price must be a positive number' })
  @Transform(({ value }) => (value !== undefined && value !== null ? Number(value) : null))
  basePrice?: number;

  /**
   * Whether this service is currently active in the catalog
   * Defaults to true if not specified
   */
  @IsOptional()
  @IsBoolean({ message: 'isActive must be a boolean value' })
  @Transform(({ value }) => {
    if (value === undefined || value === null) return true;
    if (typeof value === 'string') {
      return value.toLowerCase() === 'true';
    }
    return Boolean(value);
  })
  isActive?: boolean = true;

  /**
   * Scope definition template - defines the structure for service scope details
   * Optional JSONB field that specifies what fields, types, and options are available
   * when configuring the scope of this service in a contract
   */
  @IsOptional()
  @IsObject({ message: 'Scope definition template must be a valid object' })
  @Transform(({ value }) => {
    if (value === undefined || value === null || value === '') return null;
    if (typeof value === 'string') {
      try {
        return JSON.parse(value);
      } catch {
        return value; // Let validation handle the error
      }
    }
    return value;
  })
  scopeDefinitionTemplate?: ScopeDefinitionTemplate;
} 