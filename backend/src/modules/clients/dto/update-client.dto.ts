import { PartialType } from '@nestjs/mapped-types';
import { CreateClientDto } from './create-client.dto';

/**
 * Data Transfer Object for updating an existing client
 * Uses PartialType to make all fields from CreateClientDto optional
 * while maintaining the same validation rules for provided fields
 */
export class UpdateClientDto extends PartialType(CreateClientDto) {} 