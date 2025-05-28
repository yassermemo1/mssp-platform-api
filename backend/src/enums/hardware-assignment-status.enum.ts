/**
 * Hardware Assignment Status Enumeration
 * Defines the different states of hardware assignments to clients
 */
export enum HardwareAssignmentStatus {
  ACTIVE = 'active',
  RETURNED = 'returned',
  REPLACED = 'replaced',
  LOST = 'lost',
  DAMAGED = 'damaged',
  CANCELLED = 'cancelled',
} 