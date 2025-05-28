import {
  IsString,
  IsUUID,
  IsDateString,
  IsNumber,
  IsEnum,
  IsOptional,
  IsNotEmpty,
  Length,
  Min,
  Max,
  IsUrl,
} from 'class-validator';
import { Transform, Type } from 'class-transformer';
import { ContractStatus } from '../../../enums/contract-status.enum';

/**
 * CreateContractDto
 * Data Transfer Object for creating new contracts
 * Includes comprehensive validation for all contract fields
 */
export class CreateContractDto {
  /**
   * Contract name/identifier - must be unique globally
   * Examples: "MSA - Acme Corp - 2025", "SOW-001-TechStart"
   */
  @IsString()
  @IsNotEmpty()
  @Length(3, 255, {
    message: 'Contract name must be between 3 and 255 characters',
  })
  @Transform(({ value }) => value?.trim())
  contractName: string;

  /**
   * Client ID - must be a valid UUID of an existing client
   */
  @IsUUID(4, { message: 'Client ID must be a valid UUID' })
  @IsNotEmpty()
  clientId: string;

  /**
   * Contract start date
   * Must be a valid ISO date string
   */
  @IsDateString({}, { message: 'Start date must be a valid ISO date string' })
  @IsNotEmpty()
  startDate: string;

  /**
   * Contract end date
   * Must be a valid ISO date string and after start date (validated in service)
   */
  @IsDateString({}, { message: 'End date must be a valid ISO date string' })
  @IsNotEmpty()
  endDate: string;

  /**
   * Renewal date (optional)
   * When contract was last renewed
   */
  @IsOptional()
  @IsDateString({}, { message: 'Renewal date must be a valid ISO date string' })
  renewalDate?: string;

  /**
   * Total contract value (optional)
   * Must be a positive number with up to 2 decimal places
   */
  @IsOptional()
  @IsNumber(
    { maxDecimalPlaces: 2 },
    { message: 'Contract value must be a number with up to 2 decimal places' },
  )
  @Min(0, { message: 'Contract value must be non-negative' })
  @Max(999999999999.99, { message: 'Contract value exceeds maximum allowed' })
  @Type(() => Number)
  value?: number;

  /**
   * Contract status (optional, defaults to DRAFT)
   * Must be a valid ContractStatus enum value
   */
  @IsOptional()
  @IsEnum(ContractStatus, {
    message: 'Status must be a valid contract status',
  })
  status?: ContractStatus;

  /**
   * Document link (optional)
   * URL or file path to contract document
   */
  @IsOptional()
  @IsString()
  @Length(1, 500, {
    message: 'Document link must be between 1 and 500 characters',
  })
  @Transform(({ value }) => value?.trim())
  documentLink?: string;

  /**
   * Additional notes (optional)
   * Free text for special conditions or important details
   */
  @IsOptional()
  @IsString()
  @Length(1, 5000, {
    message: 'Notes must be between 1 and 5000 characters',
  })
  @Transform(({ value }) => value?.trim())
  notes?: string;

  /**
   * Previous contract ID (optional)
   * For renewal tracking - must be a valid UUID of an existing contract
   */
  @IsOptional()
  @IsUUID(4, { message: 'Previous contract ID must be a valid UUID' })
  previousContractId?: string;
} 