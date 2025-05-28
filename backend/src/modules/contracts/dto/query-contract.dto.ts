import { IsOptional, IsString, IsEnum, IsDateString, IsNumber, Min, Max, IsUUID } from 'class-validator';
import { Type } from 'class-transformer';
import { ContractStatus } from '../../../enums/contract-status.enum';
import { ContractType } from '../../../enums/contract-type.enum';

export enum SortOrder {
  ASC = 'ASC',
  DESC = 'DESC',
}

export class QueryContractDto {
  @IsOptional()
  @IsString()
  search?: string; // For full-text search across multiple fields

  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsString()
  number?: string;

  @IsOptional()
  @IsUUID()
  clientId?: string;

  @IsOptional()
  @IsEnum(ContractStatus)
  status?: ContractStatus;

  @IsOptional()
  @IsEnum(ContractType)
  type?: ContractType;

  @IsOptional()
  @IsDateString()
  startDateFrom?: string;

  @IsOptional()
  @IsDateString()
  startDateTo?: string;

  @IsOptional()
  @IsDateString()
  endDateFrom?: string;

  @IsOptional()
  @IsDateString()
  endDateTo?: string;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  totalValueMin?: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  totalValueMax?: number;

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