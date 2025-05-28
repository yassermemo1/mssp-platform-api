/**
 * Proposal Type Enumeration
 * Categorizes proposals by their primary focus and content type
 * Supports different proposal workflows and approval processes
 */
export enum ProposalType {
  // Core proposal types
  TECHNICAL = 'technical',
  FINANCIAL = 'financial',
  
  // Combined proposals
  TECHNICAL_FINANCIAL = 'technical_financial',
  
  // Specialized proposals
  ARCHITECTURE = 'architecture',
  IMPLEMENTATION = 'implementation',
  PRICING = 'pricing',
  SCOPE_CHANGE = 'scope_change',
  
  // Other
  OTHER = 'other',
} 