import { IsOptional, IsUUID, IsEnum, IsBoolean, IsNumber, Min, Max } from 'class-validator';
import { Transform, Type } from 'class-transformer';
import { ClientAssignmentRole } from '../../../enums';

/**
 * Data Transfer Object for querying team assignments with filtering and pagination
 * Supports filtering by various criteria and includes pagination options
 */
export class QueryTeamAssignmentsDto {
  /**
   * Filter by specific user ID
   */
  @IsOptional()
  @IsUUID('4', { message: 'User ID must be a valid UUID' })
  userId?: string;

  /**
   * Filter by specific client ID
   */
  @IsOptional()
  @IsUUID('4', { message: 'Client ID must be a valid UUID' })
  clientId?: string;

  /**
   * Filter by assignment role
   */
  @IsOptional()
  @IsEnum(ClientAssignmentRole, { message: 'Role must be a valid ClientAssignmentRole' })
  assignmentRole?: ClientAssignmentRole;

  /**
   * Filter by active status
   */
  @IsOptional()
  @Transform(({ value }) => {
    if (value === 'true') return true;
    if (value === 'false') return false;
    return value;
  })
  @IsBoolean({ message: 'isActive must be a boolean value' })
  isActive?: boolean;

  /**
   * Page number for pagination (starts from 1)
   */
  @IsOptional()
  @Type(() => Number)
  @IsNumber({}, { message: 'Page must be a number' })
  @Min(1, { message: 'Page must be at least 1' })
  page?: number = 1;

  /**
   * Number of items per page
   */
  @IsOptional()
  @Type(() => Number)
  @IsNumber({}, { message: 'Limit must be a number' })
  @Min(1, { message: 'Limit must be at least 1' })
  @Max(100, { message: 'Limit must be at most 100' })
  limit?: number = 20;

  /**
   * Whether to include related User and Client entities in the response
   */
  @IsOptional()
  @Transform(({ value }) => {
    if (value === 'true') return true;
    if (value === 'false') return false;
    return value;
  })
  @IsBoolean({ message: 'includeRelations must be a boolean value' })
  includeRelations?: boolean = true;
} 