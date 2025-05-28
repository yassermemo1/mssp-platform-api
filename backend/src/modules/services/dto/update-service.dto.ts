import { PartialType } from '@nestjs/mapped-types';
import { CreateServiceDto } from './create-service.dto';

/**
 * UpdateServiceDto
 * Data Transfer Object for updating existing services in the catalog
 * 
 * This DTO extends CreateServiceDto using PartialType, making all fields optional
 * while maintaining the same validation rules when fields are provided.
 * 
 * Benefits of using PartialType:
 * - All validation decorators from CreateServiceDto are preserved
 * - All fields become optional automatically
 * - Consistent validation logic between create and update operations
 * - Type safety is maintained
 * 
 * Usage:
 * - PATCH /services/:id with any subset of service fields
 * - Only provided fields will be validated and updated
 * - Validation rules apply only to fields that are present in the request
 */
export class UpdateServiceDto extends PartialType(CreateServiceDto) {
  // No additional fields needed - PartialType handles everything
  // All fields from CreateServiceDto are now optional but retain their validation
} 