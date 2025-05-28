import { PartialType } from '@nestjs/mapped-types';
import { CreateContractDto } from './create-contract.dto';

/**
 * UpdateContractDto
 * Data Transfer Object for updating existing contracts
 * 
 * Uses PartialType to make all fields from CreateContractDto optional
 * while maintaining the same validation rules when fields are provided
 * 
 * This approach ensures:
 * - All validation decorators from CreateContractDto are preserved
 * - Fields are optional, allowing partial updates
 * - Type safety is maintained
 * - Consistent validation behavior between create and update operations
 */
export class UpdateContractDto extends PartialType(CreateContractDto) {
  // All fields from CreateContractDto are now optional but retain their validation
  // when provided. No additional fields or overrides needed.
} 