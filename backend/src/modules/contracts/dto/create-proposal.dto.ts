import {
  IsString,
  IsUUID,
  IsEnum,
  IsOptional,
  IsNotEmpty,
  Length,
  IsUrl,
  IsNumber,
  IsDateString,
  Min,
  Max,
  Matches,
} from 'class-validator';
import { Transform, Type } from 'class-transformer';
import { ProposalType } from '../../../enums/proposal-type.enum';
import { ProposalStatus } from '../../../enums/proposal-status.enum';

/**
 * CreateProposalDto
 * Data Transfer Object for creating new proposals
 * Includes comprehensive validation for all proposal fields including financial details and assignee
 */
export class CreateProposalDto {
  /**
   * Service Scope ID - must be a valid UUID of an existing service scope
   * This links the proposal to a specific service scope within a contract
   */
  @IsUUID(4, { message: 'Service scope ID must be a valid UUID' })
  @IsNotEmpty()
  serviceScopeId: string;

  /**
   * Type of proposal (technical, financial, combined, etc.)
   * Determines the proposal workflow and approval process
   */
  @IsEnum(ProposalType, {
    message: 'Proposal type must be a valid proposal type',
  })
  @IsNotEmpty()
  proposalType: ProposalType;

  /**
   * Reference to proposal document (URL or file path)
   * Mandatory field linking to the actual proposal document
   */
  @IsString()
  @IsNotEmpty()
  @Length(1, 500, {
    message: 'Document link must be between 1 and 500 characters',
  })
  @Transform(({ value }) => value?.trim())
  documentLink: string;

  /**
   * Proposal version identifier (optional)
   * Supports versioning for proposal revisions
   */
  @IsOptional()
  @IsString()
  @Length(1, 50, {
    message: 'Version must be between 1 and 50 characters',
  })
  @Transform(({ value }) => value?.trim())
  version?: string;

  /**
   * Current status of the proposal (optional, defaults to DRAFT)
   * Tracks the proposal through its lifecycle
   */
  @IsOptional()
  @IsEnum(ProposalStatus, {
    message: 'Status must be a valid proposal status',
  })
  status?: ProposalStatus;

  /**
   * Proposal title or summary (optional)
   * Brief description of the proposal content
   */
  @IsOptional()
  @IsString()
  @Length(1, 255, {
    message: 'Title must be between 1 and 255 characters',
  })
  @Transform(({ value }) => value?.trim())
  title?: string;

  /**
   * Detailed description or executive summary (optional)
   * Can include key points, objectives, or proposal overview
   */
  @IsOptional()
  @IsString()
  @Length(1, 5000, {
    message: 'Description must be between 1 and 5000 characters',
  })
  @Transform(({ value }) => value?.trim())
  description?: string;

  /**
   * Proposal value or cost (optional)
   * Financial amount associated with this proposal
   */
  @IsOptional()
  @IsNumber(
    { maxDecimalPlaces: 2 },
    { message: 'Proposal value must be a number with up to 2 decimal places' },
  )
  @Min(0, { message: 'Proposal value must be non-negative' })
  @Max(999999999999.99, { message: 'Proposal value exceeds maximum allowed' })
  @Type(() => Number)
  proposalValue?: number;

  /**
   * Currency code for the proposal value (optional)
   * ISO 4217 format, defaults to SAR for Saudi Arabia operations
   */
  @IsOptional()
  @IsString()
  @Length(3, 3, { message: 'Currency must be a 3-character ISO 4217 code' })
  @Matches(/^[A-Z]{3}$/, { message: 'Currency must be uppercase letters only (e.g., SAR, USD, EUR)' })
  @Transform(({ value }) => value?.trim().toUpperCase())
  currency?: string;

  /**
   * Proposal validity expiration date (optional)
   * Date until which the proposal terms and pricing remain valid
   * Must be a future date when provided
   */
  @IsOptional()
  @IsDateString({}, { message: 'Valid until date must be a valid ISO date string' })
  validUntilDate?: string;

  /**
   * Expected implementation timeline in days (optional)
   * Estimated duration for proposal implementation
   */
  @IsOptional()
  @IsNumber({}, { message: 'Estimated duration must be a number' })
  @Min(1, { message: 'Estimated duration must be at least 1 day' })
  @Max(3650, { message: 'Estimated duration cannot exceed 10 years (3650 days)' })
  @Type(() => Number)
  estimatedDurationDays?: number;

  /**
   * Proposal submission date (optional)
   * When the proposal was formally submitted
   */
  @IsOptional()
  @IsDateString({}, { message: 'Submitted date must be a valid ISO date string' })
  submittedAt?: string;

  /**
   * Proposal approval date (optional)
   * When the proposal was approved
   */
  @IsOptional()
  @IsDateString({}, { message: 'Approved date must be a valid ISO date string' })
  approvedAt?: string;

  /**
   * User ID assigned to this proposal (optional)
   * Must be a valid UUID of an existing user (sales/account person)
   */
  @IsOptional()
  @IsUUID(4, { message: 'Assignee user ID must be a valid UUID' })
  assigneeUserId?: string;

  /**
   * Additional notes or comments (optional)
   * Can include review feedback, special conditions, or implementation notes
   */
  @IsOptional()
  @IsString()
  @Length(1, 5000, {
    message: 'Notes must be between 1 and 5000 characters',
  })
  @Transform(({ value }) => value?.trim())
  notes?: string;
} 