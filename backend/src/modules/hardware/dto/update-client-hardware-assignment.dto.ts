import { PartialType } from '@nestjs/mapped-types';
import { CreateClientHardwareAssignmentDto } from './create-client-hardware-assignment.dto';

/**
 * UpdateClientHardwareAssignmentDto
 * Data Transfer Object for updating hardware assignments
 * Makes all fields from CreateClientHardwareAssignmentDto optional
 */
export class UpdateClientHardwareAssignmentDto extends PartialType(CreateClientHardwareAssignmentDto) {} 