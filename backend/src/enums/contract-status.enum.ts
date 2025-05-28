/**
 * Contract Status Enumeration
 * Comprehensive contract lifecycle management including renewal tracking
 * Supports complex contract workflows and status transitions
 */
export enum ContractStatus {
  // Initial states
  DRAFT = 'draft',
  PENDING_APPROVAL = 'pending_approval',
  
  // Active states
  ACTIVE = 'active',
  
  // Renewal states
  RENEWED_ACTIVE = 'renewed_active',
  RENEWED_INACTIVE = 'renewed_inactive',
  
  // End states
  EXPIRED = 'expired',
  TERMINATED = 'terminated',
  CANCELLED = 'cancelled',
  
  // Temporary states
  SUSPENDED = 'suspended',
  ON_HOLD = 'on_hold',
} 