import {
  IsOptional,
  IsUUID,
  IsEnum,
  IsNumberString,
  IsString,
  Min,
  Max,
} from 'class-validator';
import { Transform, Type } from 'class-transformer';
import { ContractStatus } from '../../../enums/contract-status.enum';

/**
 * ContractQueryDto
 * Data Transfer Object for contract query parameters
 * Handles filtering, pagination, and search functionality
 */
export class ContractQueryDto {
  /**
   * Filter by client ID (optional)
   * Must be a valid UUID
   */
  @IsOptional()
  @IsUUID(4, { message: 'Client ID must be a valid UUID' })
  clientId?: string;

  /**
   * Filter by contract status (optional)
   * Must be a valid ContractStatus enum value
   */
  @IsOptional()
  @IsEnum(ContractStatus, {
    message: 'Status must be a valid contract status',
  })
  status?: ContractStatus;

  /**
   * Filter contracts expiring within specified days (optional)
   * Must be a positive number between 1 and 365
   */
  @IsOptional()
  @IsNumberString({}, { message: 'Expiring soon days must be a number' })
  @Transform(({ value }) => (value ? parseInt(value, 10) : undefined))
  @Type(() => Number)
  @Min(1, { message: 'Expiring soon days must be at least 1' })
  @Max(365, { message: 'Expiring soon days cannot exceed 365' })
  expiringSoonDays?: number;

  /**
   * Search term for contract name (optional)
   * Case-insensitive partial match
   */
  @IsOptional()
  @IsString()
  @Transform(({ value }) => value?.trim())
  search?: string;

  /**
   * Page number for pagination (optional, defaults to 1)
   * Must be a positive number
   */
  @IsOptional()
  @IsNumberString({}, { message: 'Page must be a number' })
  @Transform(({ value }) => (value ? parseInt(value, 10) : 1))
  @Type(() => Number)
  @Min(1, { message: 'Page must be at least 1' })
  page?: number = 1;

  /**
   * Number of items per page (optional, defaults to 10)
   * Must be between 1 and 100
   */
  @IsOptional()
  @IsNumberString({}, { message: 'Limit must be a number' })
  @Transform(({ value }) => (value ? parseInt(value, 10) : 10))
  @Type(() => Number)
  @Min(1, { message: 'Limit must be at least 1' })
  @Max(100, { message: 'Limit cannot exceed 100' })
  limit?: number = 10;
} 