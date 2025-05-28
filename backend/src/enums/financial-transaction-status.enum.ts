/**
 * Financial Transaction Status Enum
 * Tracks the payment and processing status of financial transactions
 * Supports comprehensive financial workflow management
 */
export enum FinancialTransactionStatus {
  PENDING = 'PENDING',
  PROCESSING = 'PROCESSING',
  PAID = 'PAID',
  COMPLETED = 'COMPLETED',
  PARTIALLY_PAID = 'PARTIALLY_PAID',
  OVERDUE = 'OVERDUE',
  CANCELLED = 'CANCELLED',
  REFUNDED = 'REFUNDED',
  DISPUTED = 'DISPUTED',
  FAILED = 'FAILED',
} 