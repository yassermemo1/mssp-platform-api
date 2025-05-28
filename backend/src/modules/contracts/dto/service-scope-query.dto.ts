import {
  IsOptional,
  IsBoolean,
  IsEnum,
  IsString,
  IsNumber,
  IsUUID,
  Min,
  Max,
  MaxLength,
} from 'class-validator';
import { Transform, Type } from 'class-transformer';
import { SAFStatus } from '../../../enums';

/**
 * ServiceScopeQueryDto
 * Data Transfer Object for querying and filtering service scopes
 * 
 * This DTO provides filtering, searching, and pagination options for service scopes:
 * - Contract filtering
 * - Service filtering
 * - SAF status filtering
 * - Active/inactive filtering
 * - Pagination support
 */
export class ServiceScopeQueryDto {
  /**
   * Filter by specific contract ID
   * Returns only service scopes for the specified contract
   */
  @IsOptional()
  @IsUUID(4, { message: 'Contract ID must be a valid UUID' })
  contractId?: string;

  /**
   * Filter by specific service ID
   * Returns only service scopes for the specified service
   */
  @IsOptional()
  @IsUUID(4, { message: 'Service ID must be a valid UUID' })
  serviceId?: string;

  /**
   * Filter by SAF status
   * Returns only service scopes with the specified SAF status
   */
  @IsOptional()
  @IsEnum(SAFStatus, {
    message: `SAF status must be one of: ${Object.values(SAFStatus).join(', ')}`,
  })
  safStatus?: SAFStatus;

  /**
   * Filter by active status
   * Returns only active or inactive service scopes
   */
  @IsOptional()
  @IsBoolean({ message: 'isActive must be a boolean value' })
  @Transform(({ value }) => {
    if (value === undefined || value === null || value === '') return undefined;
    if (typeof value === 'string') {
      return value.toLowerCase() === 'true';
    }
    return Boolean(value);
  })
  isActive?: boolean;

  /**
   * Search term for filtering service scopes
   * Searches in service names, notes, and scope details
   */
  @IsOptional()
  @IsString({ message: 'Search term must be a string' })
  @MaxLength(255, { message: 'Search term cannot exceed 255 characters' })
  @Transform(({ value }) => value?.trim())
  search?: string;

  /**
   * Filter by minimum price
   * Returns only service scopes with price >= minPrice
   */
  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 2 }, { message: 'Min price must be a number with at most 2 decimal places' })
  @Min(0, { message: 'Min price must be non-negative' })
  @Transform(({ value }) => (value !== undefined && value !== null && value !== '' ? Number(value) : undefined))
  minPrice?: number;

  /**
   * Filter by maximum price
   * Returns only service scopes with price <= maxPrice
   */
  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 2 }, { message: 'Max price must be a number with at most 2 decimal places' })
  @Min(0, { message: 'Max price must be non-negative' })
  @Transform(({ value }) => (value !== undefined && value !== null && value !== '' ? Number(value) : undefined))
  maxPrice?: number;

  /**
   * Page number for pagination (1-based)
   * Defaults to 1 if not specified
   */
  @IsOptional()
  @Type(() => Number)
  @IsNumber({}, { message: 'Page must be a number' })
  @Min(1, { message: 'Page must be at least 1' })
  page?: number = 1;

  /**
   * Number of items per page for pagination
   * Defaults to 50, maximum 100
   */
  @IsOptional()
  @Type(() => Number)
  @IsNumber({}, { message: 'Limit must be a number' })
  @Min(1, { message: 'Limit must be at least 1' })
  @Max(100, { message: 'Limit cannot exceed 100' })
  limit?: number = 50;

  /**
   * Sort field for ordering results
   * Can sort by various fields
   */
  @IsOptional()
  @IsString({ message: 'Sort field must be a string' })
  @IsEnum(
    ['createdAt', 'updatedAt', 'price', 'quantity', 'safStatus'],
    { message: 'Sort field must be one of: createdAt, updatedAt, price, quantity, safStatus' },
  )
  sortBy?: string = 'createdAt';

  /**
   * Sort order for ordering results
   * ASC for ascending, DESC for descending
   */
  @IsOptional()
  @IsString({ message: 'Sort order must be a string' })
  @IsEnum(['ASC', 'DESC'], { message: 'Sort order must be ASC or DESC' })
  sortOrder?: 'ASC' | 'DESC' = 'DESC';
} 