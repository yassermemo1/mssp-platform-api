import {
  IsString,
  IsNotEmpty,
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
import { Transform, Type } from 'class-transformer';
import { SAFStatus } from '../../../enums';

/**
 * CreateServiceScopeDto
 * Data Transfer Object for creating new service scopes within contracts
 * 
 * This DTO validates all required fields for service scope creation:
 * - Service ID (required, must reference an existing service)
 * - Scope details (optional, flexible JSONB object for service parameters)
 * - Pricing information (optional but recommended)
 * - SAF (Service Activation Form) details (optional)
 */
export class CreateServiceScopeDto {
  /**
   * Reference to the service from the catalog
   * Must be a valid UUID of an existing active service
   */
  @IsUUID(4, { message: 'Service ID must be a valid UUID' })
  @IsNotEmpty({ message: 'Service ID is required' })
  serviceId: string;

  /**
   * Flexible scope details for this specific service configuration
   * Can contain any service-specific parameters based on the service's scope template
   * Examples:
   * {
   *   "log_sources": "Firewalls\nServers\nWorkstations",
   *   "eps_target": 500,
   *   "coverage": "24/7",
   *   "retention_days": 365
   * }
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
   * Must be a positive number with at most 2 decimal places
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
   * Examples: number of endpoints, hours, devices, etc.
   * Must be a positive integer if provided
   */
  @IsOptional()
  @IsNumber({}, { message: 'Quantity must be a number' })
  @Min(1, { message: 'Quantity must be at least 1' })
  @Transform(({ value }) => (value !== undefined && value !== null ? Number(value) : null))
  quantity?: number;

  /**
   * Unit type for the quantity (optional)
   * Examples: "endpoints", "hours", "devices", "licenses", "users", "monthly", "yearly"
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
   * Planned service start date from SAF
   * When the service is scheduled to begin (ISO 8601 date string)
   */
  @IsOptional()
  @IsDateString({}, { message: 'SAF service start date must be a valid ISO 8601 date' })
  safServiceStartDate?: string;

  /**
   * Planned service end date from SAF
   * When the service is scheduled to end (ISO 8601 date string)
   */
  @IsOptional()
  @IsDateString({}, { message: 'SAF service end date must be a valid ISO 8601 date' })
  safServiceEndDate?: string;

  /**
   * Current status of the Service Activation Form
   * Tracks the SAF lifecycle from initiation to completion
   */
  @IsOptional()
  @IsEnum(SAFStatus, {
    message: `SAF status must be one of: ${Object.values(SAFStatus).join(', ')}`,
  })
  safStatus?: SAFStatus;
} 