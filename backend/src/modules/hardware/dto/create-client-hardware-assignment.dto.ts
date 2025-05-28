import {
  IsString,
  IsOptional,
  IsEnum,
  IsDateString,
  IsUUID,
} from 'class-validator';
import { Transform } from 'class-transformer';
import { HardwareAssignmentStatus } from '../../../enums';

/**
 * CreateClientHardwareAssignmentDto
 * Data Transfer Object for creating new hardware assignments to clients
 * Includes comprehensive validation for all fields
 */
export class CreateClientHardwareAssignmentDto {
  /**
   * Hardware asset ID to be assigned
   */
  @IsUUID(4, { message: 'Hardware asset ID must be a valid UUID' })
  hardwareAssetId: string;

  /**
   * Client ID to assign the hardware to
   */
  @IsUUID(4, { message: 'Client ID must be a valid UUID' })
  clientId: string;

  /**
   * Service scope ID to link the assignment to (optional)
   */
  @IsOptional()
  @IsUUID(4, { message: 'Service scope ID must be a valid UUID' })
  serviceScopeId?: string;

  /**
   * Date when the hardware is assigned to the client
   */
  @IsDateString({}, { message: 'Assignment date must be a valid date string (YYYY-MM-DD)' })
  assignmentDate: string;

  /**
   * Status of the hardware assignment (optional, defaults to ACTIVE)
   */
  @IsOptional()
  @IsEnum(HardwareAssignmentStatus, {
    message: `Status must be one of: ${Object.values(HardwareAssignmentStatus).join(', ')}`,
  })
  status?: HardwareAssignmentStatus;

  /**
   * Date when the hardware was returned (optional)
   */
  @IsOptional()
  @IsDateString({}, { message: 'Return date must be a valid date string (YYYY-MM-DD)' })
  returnDate?: string;

  /**
   * Additional notes about the assignment (optional)
   */
  @IsOptional()
  @IsString()
  @Transform(({ value }) => value?.trim() || null)
  notes?: string;
} 