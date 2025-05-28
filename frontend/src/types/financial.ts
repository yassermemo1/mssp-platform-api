/**
 * Financial Transaction TypeScript types
 * Based on backend DTOs and entities for financial transaction management
 */

import { User } from './auth';
import { Client } from './client';
import { Contract } from './contract';
import { ServiceScope } from './service-scope';
import { HardwareAsset } from './hardware';

/**
 * Financial Transaction Type Enum
 * Categorizes different types of financial transactions for revenue and cost tracking
 */
export enum FinancialTransactionType {
  // Revenue Types
  REVENUE_CONTRACT_PAYMENT = 'REVENUE_CONTRACT_PAYMENT',
  REVENUE_LICENSE_SALE = 'REVENUE_LICENSE_SALE', 
  REVENUE_HARDWARE_SALE = 'REVENUE_HARDWARE_SALE',
  REVENUE_SERVICE_ONE_TIME = 'REVENUE_SERVICE_ONE_TIME',
  REVENUE_CONSULTATION = 'REVENUE_CONSULTATION',
  REVENUE_TRAINING = 'REVENUE_TRAINING',
  REVENUE_SUPPORT = 'REVENUE_SUPPORT',
  
  // Cost Types
  COST_LICENSE_PURCHASE = 'COST_LICENSE_PURCHASE',
  COST_HARDWARE_PURCHASE = 'COST_HARDWARE_PURCHASE',
  COST_OPERATIONAL = 'COST_OPERATIONAL',
  COST_PERSONNEL = 'COST_PERSONNEL',
  COST_INFRASTRUCTURE = 'COST_INFRASTRUCTURE',
  COST_VENDOR_SERVICES = 'COST_VENDOR_SERVICES',
  COST_TRAINING = 'COST_TRAINING',
  
  // Other
  OTHER = 'OTHER',
}

/**
 * Financial Transaction Status Enum
 * Tracks the payment and processing status of financial transactions
 */
export enum FinancialTransactionStatus {
  PENDING = 'PENDING',
  PAID = 'PAID',
  PARTIALLY_PAID = 'PARTIALLY_PAID',
  OVERDUE = 'OVERDUE',
  CANCELLED = 'CANCELLED',
  REFUNDED = 'REFUNDED',
  DISPUTED = 'DISPUTED',
  PROCESSING = 'PROCESSING',
  FAILED = 'FAILED',
}

/**
 * Financial Transaction Entity
 */
export interface FinancialTransaction {
  id: string;
  type: FinancialTransactionType;
  amount: number;
  currency: string;
  transactionDate: string;
  description: string;
  status: FinancialTransactionStatus;
  referenceId?: string;
  notes?: string;
  dueDate?: string;
  clientId?: string;
  contractId?: string;
  serviceScopeId?: string;
  hardwareAssetId?: string;
  recordedByUserId: string;
  createdAt: string;
  updatedAt: string;
  
  // Related entities (when included)
  client?: Client;
  contract?: Contract;
  serviceScope?: ServiceScope;
  hardwareAsset?: HardwareAsset;
  recordedByUser?: User;
}

/**
 * Create Financial Transaction DTO
 */
export interface CreateFinancialTransactionDto {
  type: FinancialTransactionType;
  amount: number;
  currency?: string;
  transactionDate: string;
  description: string;
  status: FinancialTransactionStatus;
  referenceId?: string;
  notes?: string;
  dueDate?: string;
  clientId?: string;
  contractId?: string;
  serviceScopeId?: string;
  hardwareAssetId?: string;
}

/**
 * Update Financial Transaction DTO
 */
export interface UpdateFinancialTransactionDto {
  type?: FinancialTransactionType;
  amount?: number;
  currency?: string;
  transactionDate?: string;
  description?: string;
  status?: FinancialTransactionStatus;
  referenceId?: string;
  notes?: string;
  dueDate?: string;
  clientId?: string;
  contractId?: string;
  serviceScopeId?: string;
  hardwareAssetId?: string;
}

/**
 * Query Financial Transactions DTO
 */
export interface QueryFinancialTransactionsDto {
  type?: FinancialTransactionType;
  status?: FinancialTransactionStatus;
  clientId?: string;
  contractId?: string;
  serviceScopeId?: string;
  hardwareAssetId?: string;
  recordedByUserId?: string;
  transactionDateFrom?: string;
  transactionDateTo?: string;
  page?: number;
  limit?: number;
  includeRelations?: boolean;
}

/**
 * Financial Transaction API Response
 */
export interface FinancialTransactionApiResponse<T> {
  statusCode: number;
  message: string;
  data: T;
  meta?: {
    count: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

/**
 * Paginated Financial Transaction Result
 */
export interface PaginatedFinancialTransactionResult {
  data: FinancialTransaction[];
  meta: {
    count: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

/**
 * Financial Transaction Statistics
 */
export interface FinancialTransactionStatistics {
  totalRevenue: number;
  totalCosts: number;
  netProfit: number;
  pendingAmount: number;
  overdueAmount: number;
  transactionsByType: Array<{
    type: FinancialTransactionType;
    count: number;
    totalAmount: number;
  }>;
  transactionsByStatus: Array<{
    status: FinancialTransactionStatus;
    count: number;
    totalAmount: number;
  }>;
  monthlyTrends: Array<{
    month: string;
    revenue: number;
    costs: number;
    netProfit: number;
  }>;
}

/**
 * Helper functions for financial transaction types
 */
export const FinancialTransactionTypeLabels: Record<FinancialTransactionType, string> = {
  [FinancialTransactionType.REVENUE_CONTRACT_PAYMENT]: 'Contract Payment',
  [FinancialTransactionType.REVENUE_LICENSE_SALE]: 'License Sale',
  [FinancialTransactionType.REVENUE_HARDWARE_SALE]: 'Hardware Sale',
  [FinancialTransactionType.REVENUE_SERVICE_ONE_TIME]: 'One-time Service',
  [FinancialTransactionType.REVENUE_CONSULTATION]: 'Consultation',
  [FinancialTransactionType.REVENUE_TRAINING]: 'Training Revenue',
  [FinancialTransactionType.REVENUE_SUPPORT]: 'Support Revenue',
  [FinancialTransactionType.COST_LICENSE_PURCHASE]: 'License Purchase',
  [FinancialTransactionType.COST_HARDWARE_PURCHASE]: 'Hardware Purchase',
  [FinancialTransactionType.COST_OPERATIONAL]: 'Operational Cost',
  [FinancialTransactionType.COST_PERSONNEL]: 'Personnel Cost',
  [FinancialTransactionType.COST_INFRASTRUCTURE]: 'Infrastructure Cost',
  [FinancialTransactionType.COST_VENDOR_SERVICES]: 'Vendor Services',
  [FinancialTransactionType.COST_TRAINING]: 'Training Cost',
  [FinancialTransactionType.OTHER]: 'Other',
};

export const FinancialTransactionStatusLabels: Record<FinancialTransactionStatus, string> = {
  [FinancialTransactionStatus.PENDING]: 'Pending',
  [FinancialTransactionStatus.PAID]: 'Paid',
  [FinancialTransactionStatus.PARTIALLY_PAID]: 'Partially Paid',
  [FinancialTransactionStatus.OVERDUE]: 'Overdue',
  [FinancialTransactionStatus.CANCELLED]: 'Cancelled',
  [FinancialTransactionStatus.REFUNDED]: 'Refunded',
  [FinancialTransactionStatus.DISPUTED]: 'Disputed',
  [FinancialTransactionStatus.PROCESSING]: 'Processing',
  [FinancialTransactionStatus.FAILED]: 'Failed',
};

/**
 * Check if transaction type is revenue
 */
export const isRevenueType = (type: FinancialTransactionType): boolean => {
  return type.startsWith('REVENUE_');
};

/**
 * Check if transaction type is cost
 */
export const isCostType = (type: FinancialTransactionType): boolean => {
  return type.startsWith('COST_');
};

/**
 * Get revenue transaction types
 */
export const getRevenueTypes = (): FinancialTransactionType[] => {
  return Object.values(FinancialTransactionType).filter(isRevenueType);
};

/**
 * Get cost transaction types
 */
export const getCostTypes = (): FinancialTransactionType[] => {
  return Object.values(FinancialTransactionType).filter(isCostType);
};

/**
 * Get transaction type label
 */
export const getTransactionTypeLabel = (type: FinancialTransactionType): string => {
  return FinancialTransactionTypeLabels[type] || type;
};

/**
 * Get transaction status label
 */
export const getTransactionStatusLabel = (status: FinancialTransactionStatus): string => {
  return FinancialTransactionStatusLabels[status] || status;
}; 