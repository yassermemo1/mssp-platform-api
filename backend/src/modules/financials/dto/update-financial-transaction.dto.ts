import { PartialType } from '@nestjs/mapped-types';
import { CreateFinancialTransactionDto } from './create-financial-transaction.dto';

/**
 * UpdateFinancialTransactionDto
 * Data Transfer Object for updating existing financial transactions
 * Uses PartialType to make all fields from CreateFinancialTransactionDto optional
 * Maintains all validation rules when fields are provided
 */
export class UpdateFinancialTransactionDto extends PartialType(CreateFinancialTransactionDto) {
  // All fields from CreateFinancialTransactionDto are now optional
  // but retain their validation decorators when provided
  // This includes:
  // - type?: FinancialTransactionType
  // - amount?: number
  // - currency?: string
  // - transactionDate?: string
  // - description?: string
  // - status?: FinancialTransactionStatus
  // - referenceId?: string
  // - notes?: string
  // - dueDate?: string
  // - clientId?: string
  // - contractId?: string
  // - serviceScopeId?: string
  // - hardwareAssetId?: string
} 