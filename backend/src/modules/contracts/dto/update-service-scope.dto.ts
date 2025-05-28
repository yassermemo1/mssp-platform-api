import {
  IsString,
  IsOptional,
  IsNumber,
  IsObject,
  IsBoolean,
  IsDateString,
  IsEnum,
  IsUUID,
  MaxLength,
  IsPositive,
  Min,
} from 'class-validator';
import { Transform } from 'class-transformer';
import { SAFStatus } from '../../../enums';

/**
 * UpdateServiceScopeDto
 * Data Transfer Object for updating existing service scopes
 * 
 * This DTO allows partial updates to service scope fields:
 * - All fields are optional for flexibility
 * - Maintains the same validation rules as creation
 * - Includes additional fields like isActive and safDocumentLink
 */
export class UpdateServiceScopeDto {
  /**
   * Reference to the service from the catalog
   * Can be changed to a different service if needed
   */
  @IsOptional()
  @IsUUID(4, { message: 'Service ID must be a valid UUID' })
  serviceId?: string;

  /**
   * Flexible scope details for this specific service configuration
   * Can be updated to modify service parameters
   */
  @IsOptional()
  @IsObject({ message: 'Scope details must be a valid object' })
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
  scopeDetails?: Record<string, any>;

  /**
   * Price for this specific service line item within the contract
   */
  @IsOptional()
  @IsNumber(
    { maxDecimalPlaces: 2 },
    { message: 'Price must be a number with at most 2 decimal places' },
  )
  @IsPositive({ message: 'Price must be a positive number' })
  @Transform(({ value }) => (value !== undefined && value !== null ? Number(value) : null))
  price?: number;

  /**
   * Quantity or units for this service (optional)
   */
  @IsOptional()
  @IsNumber({}, { message: 'Quantity must be a number' })
  @Min(1, { message: 'Quantity must be at least 1' })
  @Transform(({ value }) => (value !== undefined && value !== null ? Number(value) : null))
  quantity?: number;

  /**
   * Unit type for the quantity (optional)
   */
  @IsOptional()
  @IsString({ message: 'Unit must be a string' })
  @MaxLength(50, { message: 'Unit cannot exceed 50 characters' })
  @Transform(({ value }) => value?.trim() || null)
  unit?: string;

  /**
   * Additional notes specific to this service scope
   */
  @IsOptional()
  @IsString({ message: 'Notes must be a string' })
  @MaxLength(2000, { message: 'Notes cannot exceed 2000 characters' })
  @Transform(({ value }) => value?.trim() || null)
  notes?: string;

  /**
   * Whether this service scope is currently active
   * Allows for temporary deactivation without removal
   */
  @IsOptional()
  @IsBoolean({ message: 'isActive must be a boolean value' })
  @Transform(({ value }) => {
    if (value === undefined || value === null) return undefined;
    if (typeof value === 'string') {
      return value.toLowerCase() === 'true';
    }
    return Boolean(value);
  })
  isActive?: boolean;

  /**
   * Reference to SAF document (URL or file path)
   * Links to the specific activation form for this service scope
   */
  @IsOptional()
  @IsString({ message: 'SAF document link must be a string' })
  @MaxLength(500, { message: 'SAF document link cannot exceed 500 characters' })
  @Transform(({ value }) => value?.trim() || null)
  safDocumentLink?: string;

  /**
   * Planned service start date from SAF
   */
  @IsOptional()
  @IsDateString({}, { message: 'SAF service start date must be a valid ISO 8601 date' })
  safServiceStartDate?: string;

  /**
   * Planned service end date from SAF
   */
  @IsOptional()
  @IsDateString({}, { message: 'SAF service end date must be a valid ISO 8601 date' })
  safServiceEndDate?: string;

  /**
   * Current status of the Service Activation Form
   */
  @IsOptional()
  @IsEnum(SAFStatus, {
    message: `SAF status must be one of: ${Object.values(SAFStatus).join(', ')}`,
  })
  safStatus?: SAFStatus;

  /**
   * Custom field data - optional
   * Contains values for admin-defined custom fields
   */
  @IsOptional()
  @IsObject()
  customFieldData?: Record<string, any>;
} 