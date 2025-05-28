import { PartialType } from '@nestjs/mapped-types';
import { IsOptional, IsBoolean } from 'class-validator';
import { CreateTeamAssignmentDto } from './create-team-assignment.dto';

/**
 * Data Transfer Object for updating an existing team assignment
 * Extends CreateTeamAssignmentDto but makes all fields optional
 * Includes additional fields specific to updates like isActive for soft deletion
 */
export class UpdateTeamAssignmentDto extends PartialType(CreateTeamAssignmentDto) {
  /**
   * Whether the assignment is currently active
   * Used for soft deletion and activation/deactivation of assignments
   */
  @IsOptional()
  @IsBoolean({ message: 'isActive must be a boolean value' })
  isActive?: boolean;
} 