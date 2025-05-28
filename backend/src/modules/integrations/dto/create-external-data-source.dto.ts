import { IsString, IsEnum, IsUrl, IsOptional, IsObject, IsBoolean, MaxLength } from 'class-validator';
import { ExternalSystemType, ExternalApiAuthenticationType } from '../../../enums';

/**
 * DTO for creating a new external data source
 */
export class CreateExternalDataSourceDto {
  @IsString()
  @MaxLength(255)
  name: string;

  @IsEnum(ExternalSystemType)
  systemType: ExternalSystemType;

  @IsUrl()
  @MaxLength(500)
  baseUrl: string;

  @IsEnum(ExternalApiAuthenticationType)
  authenticationType: ExternalApiAuthenticationType;

  @IsOptional()
  @IsObject()
  credentials?: Record<string, any>;

  @IsOptional()
  @IsObject()
  defaultHeaders?: Record<string, string>;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean = true;
} 