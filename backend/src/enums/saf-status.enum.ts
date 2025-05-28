/**
 * Service Activation Form (SAF) Status Enumeration
 * Tracks the lifecycle of service activation forms for each service scope
 * Manages the process from initiation to completion
 */
export enum SAFStatus {
  // Initial states
  NOT_INITIATED = 'not_initiated',
  DRAFT = 'draft',
  
  // Client interaction states
  PENDING_CLIENT_SIGNATURE = 'pending_client_signature',
  SIGNED_BY_CLIENT = 'signed_by_client',
  CLIENT_REVIEW = 'client_review',
  
  // Activation states
  ACTIVATED = 'activated',
  IN_PROGRESS = 'in_progress',
  COMPLETED = 'completed',
  
  // End states
  EXPIRED = 'expired',
  CANCELLED = 'cancelled',
  REJECTED = 'rejected',
} 