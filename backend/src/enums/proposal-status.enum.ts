/**
 * Proposal Status Enumeration
 * Tracks the lifecycle of proposals from creation to final disposition
 * Supports approval workflows and status transitions
 */
export enum ProposalStatus {
  // Initial states
  DRAFT = 'draft',
  IN_PREPARATION = 'in_preparation',
  
  // Submission states
  SUBMITTED = 'submitted',
  UNDER_REVIEW = 'under_review',
  
  // Review states
  PENDING_APPROVAL = 'pending_approval',
  PENDING_CLIENT_REVIEW = 'pending_client_review',
  REQUIRES_REVISION = 'requires_revision',
  
  // Final states
  APPROVED = 'approved',
  REJECTED = 'rejected',
  WITHDRAWN = 'withdrawn',
  ARCHIVED = 'archived',
  
  // Implementation states
  ACCEPTED_BY_CLIENT = 'accepted_by_client',
  IN_IMPLEMENTATION = 'in_implementation',
  COMPLETED = 'completed',
} 