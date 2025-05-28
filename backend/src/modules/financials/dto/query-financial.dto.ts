import { IsOptional, IsString, IsEnum, IsDateString, IsNumber, Min, Max, IsUUID } from 'class-validator';
import { Type } from 'class-transformer';
import { TransactionType } from '../../../enums/transaction-type.enum';

export enum SortOrder {
  ASC = 'ASC',
  DESC = 'DESC',
}

export class QueryFinancialDto {
  @IsOptional()
  @IsString()
  search?: string;

  @IsOptional()
  @IsUUID()
  clientId?: string;

  @IsOptional()
  @IsUUID()
  contractId?: string;

  @IsOptional()
  @IsEnum(TransactionType)
  type?: TransactionType;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsDateString()
  transactionDateFrom?: string;

  @IsOptional()
  @IsDateString()
  transactionDateTo?: string;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  amountMin?: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  amountMax?: number;

  @IsOptional()
  @IsString()
  sortBy?: string = 'transactionDate';

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