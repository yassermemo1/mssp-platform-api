import { IsString, IsEnum, IsOptional, IsNumber, IsBoolean, IsUUID, MaxLength, Min } from 'class-validator';
import { HttpMethod, ExpectedResponseType } from '../../../enums';

/**
 * DTO for creating a new data source query
 */
export class CreateDataSourceQueryDto {
  @IsString()
  @MaxLength(255)
  queryName: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsString()
  @MaxLength(500)
  endpointPath: string;

  @IsEnum(HttpMethod)
  httpMethod: HttpMethod;

  @IsOptional()
  @IsString()
  queryTemplate?: string;

  @IsString()
  @MaxLength(500)
  responseExtractionPath: string;

  @IsEnum(ExpectedResponseType)
  expectedResponseType: ExpectedResponseType;

  @IsOptional()
  @IsNumber()
  @Min(0)
  cacheTTLSeconds?: number;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean = true;

  @IsOptional()
  @IsString()
  notes?: string;

  @IsUUID()
  dataSourceId: string;
} 