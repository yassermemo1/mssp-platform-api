import {
  IsEnum,
  IsNumber,
  IsString,
  IsDateString,
  IsUUID,
  IsOptional,
  Min,
  MaxLength,
  IsNotEmpty,
  Length,
} from 'class-validator';
import { Transform } from 'class-transformer';
import { FinancialTransactionType, FinancialTransactionStatus } from '../../../enums';

/**
 * CreateFinancialTransactionDto
 * Data Transfer Object for creating new financial transactions
 * Includes comprehensive validation for all fields and optional entity relationships
 */
export class CreateFinancialTransactionDto {
  /**
   * Type of financial transaction (revenue or cost category)
   * Must be a valid FinancialTransactionType enum value
   */
  @IsEnum(FinancialTransactionType, {
    message: 'Transaction type must be a valid FinancialTransactionType',
  })
  @IsNotEmpty()
  type: FinancialTransactionType;

  /**
   * Transaction amount with validation for positive values
   * Supports up to 15 digits with 2 decimal places
   */
  @IsNumber(
    { maxDecimalPlaces: 2 },
    { message: 'Amount must be a number with up to 2 decimal places' },
  )
  @Min(0.01, { message: 'Amount must be greater than 0' })
  @Transform(({ value }) => parseFloat(value))
  amount: number;

  /**
   * Currency code (ISO 4217 format)
   * Defaults to SAR if not provided
   */
  @IsString()
  @Length(3, 3, { message: 'Currency must be exactly 3 characters (ISO 4217)' })
  @IsOptional()
  currency?: string = 'SAR';

  /**
   * Date when the transaction occurred
   * Must be a valid ISO date string
   */
  @IsDateString({}, { message: 'Transaction date must be a valid ISO date string' })
  @IsNotEmpty()
  transactionDate: string;

  /**
   * Description of the transaction
   * Required field for audit and documentation purposes
   */
  @IsString()
  @IsNotEmpty()
  @MaxLength(1000, { message: 'Description cannot exceed 1000 characters' })
  description: string;

  /**
   * Current status of the transaction
   * Must be a valid FinancialTransactionStatus enum value
   */
  @IsEnum(FinancialTransactionStatus, {
    message: 'Status must be a valid FinancialTransactionStatus',
  })
  @IsNotEmpty()
  status: FinancialTransactionStatus;

  /**
   * External reference identifier (optional)
   * Can store invoice numbers, PO numbers, receipt numbers, etc.
   */
  @IsString()
  @MaxLength(100, { message: 'Reference ID cannot exceed 100 characters' })
  @IsOptional()
  referenceId?: string;

  /**
   * Additional notes or comments (optional)
   */
  @IsString()
  @MaxLength(2000, { message: 'Notes cannot exceed 2000 characters' })
  @IsOptional()
  notes?: string;

  /**
   * Due date for pending transactions (optional)
   */
  @IsDateString({}, { message: 'Due date must be a valid ISO date string' })
  @IsOptional()
  dueDate?: string;

  /**
   * Optional foreign key to Client
   * Must be a valid UUID if provided
   */
  @IsUUID(4, { message: 'Client ID must be a valid UUID' })
  @IsOptional()
  clientId?: string;

  /**
   * Optional foreign key to Contract
   * Must be a valid UUID if provided
   */
  @IsUUID(4, { message: 'Contract ID must be a valid UUID' })
  @IsOptional()
  contractId?: string;

  /**
   * Optional foreign key to ServiceScope
   * Must be a valid UUID if provided
   */
  @IsUUID(4, { message: 'Service Scope ID must be a valid UUID' })
  @IsOptional()
  serviceScopeId?: string;

  /**
   * Optional foreign key to HardwareAsset
   * Must be a valid UUID if provided
   */
  @IsUUID(4, { message: 'Hardware Asset ID must be a valid UUID' })
  @IsOptional()
  hardwareAssetId?: string;
} 