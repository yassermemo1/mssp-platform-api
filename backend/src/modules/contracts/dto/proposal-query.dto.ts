import {
  IsOptional,
  IsUUID,
  IsEnum,
  IsNumberString,
  IsString,
  IsDateString,
  Min,
  Max,
  Length,
  Matches,
} from 'class-validator';
import { Transform, Type } from 'class-transformer';
import { ProposalType } from '../../../enums/proposal-type.enum';
import { ProposalStatus } from '../../../enums/proposal-status.enum';

/**
 * ProposalQueryDto
 * Data Transfer Object for proposal query parameters
 * Handles comprehensive filtering and pagination for proposal listings
 * Supports global proposal overview and service scope-specific filtering
 */
export class ProposalQueryDto {
  /**
   * Filter by proposal type (optional)
   * Must be a valid ProposalType enum value
   */
  @IsOptional()
  @IsEnum(ProposalType, {
    message: 'Proposal type must be a valid proposal type',
  })
  proposalType?: ProposalType;

  /**
   * Filter by proposal status (optional)
   * Must be a valid ProposalStatus enum value
   */
  @IsOptional()
  @IsEnum(ProposalStatus, {
    message: 'Status must be a valid proposal status',
  })
  status?: ProposalStatus;

  /**
   * Filter by assigned user ID (optional)
   * Must be a valid UUID of an existing user
   */
  @IsOptional()
  @IsUUID(4, { message: 'Assignee user ID must be a valid UUID' })
  assigneeUserId?: string;

  /**
   * Filter by client ID (optional)
   * Must be a valid UUID of an existing client
   * Filters proposals whose service scopes belong to the specified client's contracts
   */
  @IsOptional()
  @IsUUID(4, { message: 'Client ID must be a valid UUID' })
  clientId?: string;

  /**
   * Filter by currency (optional)
   * Must be a valid 3-character ISO 4217 currency code
   */
  @IsOptional()
  @IsString()
  @Length(3, 3, { message: 'Currency must be a 3-character ISO 4217 code' })
  @Matches(/^[A-Z]{3}$/, { message: 'Currency must be uppercase letters only (e.g., SAR, USD, EUR)' })
  @Transform(({ value }) => value?.trim().toUpperCase())
  currency?: string;

  /**
   * Filter by creation date from (optional)
   * ISO date string for filtering proposals created on or after this date
   */
  @IsOptional()
  @IsDateString({}, { message: 'Date from must be a valid ISO date string' })
  dateFrom?: string;

  /**
   * Filter by creation date to (optional)
   * ISO date string for filtering proposals created on or before this date
   */
  @IsOptional()
  @IsDateString({}, { message: 'Date to must be a valid ISO date string' })
  dateTo?: string;

  /**
   * Filter by submission date from (optional)
   * ISO date string for filtering proposals submitted on or after this date
   */
  @IsOptional()
  @IsDateString({}, { message: 'Submitted from date must be a valid ISO date string' })
  submittedDateFrom?: string;

  /**
   * Filter by submission date to (optional)
   * ISO date string for filtering proposals submitted on or before this date
   */
  @IsOptional()
  @IsDateString({}, { message: 'Submitted to date must be a valid ISO date string' })
  submittedDateTo?: string;

  /**
   * Search term for proposal title or description (optional)
   * Case-insensitive partial match across title, description, and notes
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

  /**
   * Sort field (optional, defaults to createdAt)
   * Determines the field used for sorting results
   */
  @IsOptional()
  @IsEnum(['createdAt', 'updatedAt', 'submittedAt', 'approvedAt', 'proposalValue', 'validUntilDate'], {
    message: 'Sort field must be one of: createdAt, updatedAt, submittedAt, approvedAt, proposalValue, validUntilDate',
  })
  sortBy?: string = 'createdAt';

  /**
   * Sort direction (optional, defaults to DESC)
   * Determines the sorting order
   */
  @IsOptional()
  @IsEnum(['ASC', 'DESC'], {
    message: 'Sort direction must be either ASC or DESC',
  })
  sortDirection?: 'ASC' | 'DESC' = 'DESC';
} 