/**
 * Ticket Status Enum
 * Defines the possible statuses for tickets
 * Aligns with common ticketing systems (including Jira)
 */
export enum TicketStatus {
  // Initial states
  NEW = 'new',
  OPEN = 'open',
  
  // Active states
  IN_PROGRESS = 'in_progress',
  PENDING = 'pending',
  WAITING_FOR_CUSTOMER = 'waiting_for_customer',
  WAITING_FOR_VENDOR = 'waiting_for_vendor',
  
  // Resolution states
  RESOLVED = 'resolved',
  CLOSED = 'closed',
  
  // Other states
  CANCELLED = 'cancelled',
  REOPENED = 'reopened',
  ON_HOLD = 'on_hold'
} 