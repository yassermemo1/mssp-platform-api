import { PartialType } from '@nestjs/mapped-types';
import { CreateDataSourceQueryDto } from './create-data-source-query.dto';

/**
 * DTO for updating a data source query
 * All fields are optional
 */
export class UpdateDataSourceQueryDto extends PartialType(CreateDataSourceQueryDto) {} 