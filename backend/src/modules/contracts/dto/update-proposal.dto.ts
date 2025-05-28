import { PartialType } from '@nestjs/mapped-types';
import { CreateProposalDto } from './create-proposal.dto';

/**
 * UpdateProposalDto
 * Data Transfer Object for updating existing proposals
 * 
 * Uses PartialType to make all fields from CreateProposalDto optional
 * while maintaining the same validation rules when fields are provided
 * 
 * This approach ensures:
 * - All validation decorators from CreateProposalDto are preserved
 * - Fields are optional, allowing partial updates
 * - Type safety is maintained
 * - Consistent validation behavior between create and update operations
 * 
 * Note: serviceScopeId should typically not be changed after creation,
 * but it's included for flexibility in case proposals need to be moved
 * between service scopes in exceptional circumstances.
 */
export class UpdateProposalDto extends PartialType(CreateProposalDto) {
  // All fields from CreateProposalDto are now optional but retain their validation
  // when provided. No additional fields or overrides needed.
} 