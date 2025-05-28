import { PartialType } from '@nestjs/mapped-types';
import { CreateCustomFieldDefinitionDto } from './create-custom-field-definition.dto';

/**
 * Data Transfer Object for updating a custom field definition
 * Extends CreateCustomFieldDefinitionDto with all fields optional
 */
export class UpdateCustomFieldDefinitionDto extends PartialType(CreateCustomFieldDefinitionDto) {} 