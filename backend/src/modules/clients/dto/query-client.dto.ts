import { IsOptional, IsString, IsEnum, IsDateString, IsNumber, Min, Max } from 'class-validator';
import { Type } from 'class-transformer';
import { ClientStatus } from '../../../enums/client-status.enum';

export enum SortOrder {
  ASC = 'ASC',
  DESC = 'DESC',
}

export class QueryClientDto {
  @IsOptional()
  @IsString()
  search?: string; // For full-text search across multiple fields

  @IsOptional()
  @IsString()
  companyName?: string;

  @IsOptional()
  @IsString()
  contactName?: string;

  @IsOptional()
  @IsString()
  contactEmail?: string;

  @IsOptional()
  @IsString()
  contactPhone?: string;

  @IsOptional()
  @IsEnum(ClientStatus)
  status?: ClientStatus;

  @IsOptional()
  @IsDateString()
  createdDateFrom?: string;

  @IsOptional()
  @IsDateString()
  createdDateTo?: string;

  @IsOptional()
  @IsString()
  sortBy?: string = 'createdAt';

  @IsOptional()
  @IsEnum(SortOrder)
  sortOrder?: SortOrder = SortOrder.DESC;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  page?: number = 1;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  @Max(100)
  limit?: number = 20;
} 