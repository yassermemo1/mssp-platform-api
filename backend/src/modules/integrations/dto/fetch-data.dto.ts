import { IsOptional, IsObject } from 'class-validator';

/**
 * DTO for fetching data from external sources
 */
export class FetchDataDto {
  @IsOptional()
  @IsObject()
  contextVariables?: Record<string, any>;
} 