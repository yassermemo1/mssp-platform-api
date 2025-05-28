import { IsUUID, IsEnum, IsDateString, IsOptional, IsString, IsNumber, Min, Max } from 'class-validator';
import { Type } from 'class-transformer';
import { ClientAssignmentRole } from '../../../enums';

/**
 * Data Transfer Object for creating a new team assignment
 * Validates the required and optional fields for assigning a team member to a client
 */
export class CreateTeamAssignmentDto {
  /**
   * UUID of the user (team member) being assigned
   */
  @IsUUID('4', { message: 'User ID must be a valid UUID' })
  userId: string;

  /**
   * UUID of the client to whom the user is being assigned
   */
  @IsUUID('4', { message: 'Client ID must be a valid UUID' })
  clientId: string;

  /**
   * Role of the user for this client assignment
   */
  @IsEnum(ClientAssignmentRole, { 
    message: 'Assignment role must be a valid ClientAssignmentRole' 
  })
  assignmentRole: ClientAssignmentRole;

  /**
   * Date when the assignment starts (optional, defaults to current date)
   */
  @IsOptional()
  @IsDateString({}, { message: 'Assignment date must be a valid ISO 8601 date string' })
  @Type(() => Date)
  assignmentDate?: string;

  /**
   * End date for the assignment (optional, for temporary assignments)
   */
  @IsOptional()
  @IsDateString({}, { message: 'End date must be a valid ISO 8601 date string' })
  @Type(() => Date)
  endDate?: string;

  /**
   * Additional notes or comments about the assignment
   */
  @IsOptional()
  @IsString({ message: 'Notes must be a string' })
  notes?: string;

  /**
   * Priority level for this assignment (1 = highest priority)
   */
  @IsOptional()
  @IsNumber({}, { message: 'Priority must be a number' })
  @Min(1, { message: 'Priority must be at least 1' })
  @Max(10, { message: 'Priority must be at most 10' })
  priority?: number;
} 