/**
 * Financial Transaction Type Enum
 * Categorizes different types of financial transactions for revenue and cost tracking
 * Supports comprehensive financial reporting and analysis
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