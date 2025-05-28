import {
  IsEnum,
  IsUUID,
  IsDateString,
  IsOptional,
  IsNumberString,
  Min,
  Max,
} from 'class-validator';
import { Transform, Type } from 'class-transformer';
import { FinancialTransactionType, FinancialTransactionStatus } from '../../../enums';

/**
 * QueryFinancialTransactionsDto
 * Data Transfer Object for filtering and pagination of financial transactions
 * Supports comprehensive filtering for financial reporting and analysis
 */
export class QueryFinancialTransactionsDto {
  /**
   * Filter by transaction type
   */
  @IsEnum(FinancialTransactionType, {
    message: 'Type must be a valid FinancialTransactionType',
  })
  @IsOptional()
  type?: FinancialTransactionType;

  /**
   * Filter by transaction status
   */
  @IsEnum(FinancialTransactionStatus, {
    message: 'Status must be a valid FinancialTransactionStatus',
  })
  @IsOptional()
  status?: FinancialTransactionStatus;

  /**
   * Filter by client ID
   */
  @IsUUID(4, { message: 'Client ID must be a valid UUID' })
  @IsOptional()
  clientId?: string;

  /**
   * Filter by contract ID
   */
  @IsUUID(4, { message: 'Contract ID must be a valid UUID' })
  @IsOptional()
  contractId?: string;

  /**
   * Filter by service scope ID
   */
  @IsUUID(4, { message: 'Service Scope ID must be a valid UUID' })
  @IsOptional()
  serviceScopeId?: string;

  /**
   * Filter by hardware asset ID
   */
  @IsUUID(4, { message: 'Hardware Asset ID must be a valid UUID' })
  @IsOptional()
  hardwareAssetId?: string;

  /**
   * Filter by user who recorded the transaction
   */
  @IsUUID(4, { message: 'Recorded By User ID must be a valid UUID' })
  @IsOptional()
  recordedByUserId?: string;

  /**
   * Filter transactions from this date (inclusive)
   */
  @IsDateString({}, { message: 'Transaction date from must be a valid ISO date string' })
  @IsOptional()
  transactionDateFrom?: string;

  /**
   * Filter transactions to this date (inclusive)
   */
  @IsDateString({}, { message: 'Transaction date to must be a valid ISO date string' })
  @IsOptional()
  transactionDateTo?: string;

  /**
   * Page number for pagination (1-based)
   */
  @IsNumberString({}, { message: 'Page must be a number' })
  @Transform(({ value }) => parseInt(value, 10))
  @Min(1, { message: 'Page must be at least 1' })
  @IsOptional()
  page?: number = 1;

  /**
   * Number of items per page
   */
  @IsNumberString({}, { message: 'Limit must be a number' })
  @Transform(({ value }) => parseInt(value, 10))
  @Min(1, { message: 'Limit must be at least 1' })
  @Max(100, { message: 'Limit cannot exceed 100' })
  @IsOptional()
  limit?: number = 20;

  /**
   * Include related entities in the response
   */
  @IsOptional()
  @Transform(({ value }) => value === 'true' || value === true)
  includeRelations?: boolean = false;
} 