import { PartialType } from '@nestjs/mapped-types';
import { CreateExternalDataSourceDto } from './create-external-data-source.dto';

/**
 * DTO for updating an external data source
 * All fields are optional
 */
export class UpdateExternalDataSourceDto extends PartialType(CreateExternalDataSourceDto) {} 