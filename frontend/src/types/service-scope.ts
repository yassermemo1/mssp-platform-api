import { SAFStatus, ProposalType, ProposalStatus } from './contract';

/**
 * Service Scope Interfaces
 */
export interface ServiceScope {
  id: string;
  contractId: string;
  serviceId: string;
  scopeDetails: Record<string, any> | null;
  price: number | null;
  quantity: number | null;
  unit: string | null;
  notes: string | null;
  isActive: boolean;
  safDocumentLink: string | null;
  safServiceStartDate: string | null;
  safServiceEndDate: string | null;
  safStatus: SAFStatus | null;
  createdAt: string;
  updatedAt: string;
  
  // Relationships
  contract?: Contract;
  service?: Service;
  proposals?: Proposal[];
  
  // Virtual properties
  totalValue?: number | null;
  displayName?: string;
  serviceDurationInDays?: number | null;
}

export interface Service {
  id: string;
  name: string;
  description: string;
  category: string;
  deliveryModel: string;
  basePrice: number;
  isActive: boolean;
  scopeDefinitionTemplate: ScopeDefinitionTemplate | null;
  createdAt: string;
  updatedAt: string;
}

export interface ScopeDefinitionTemplate {
  fields: ScopeDefinitionField[];
  version: string;
  description: string;
}

export interface ScopeDefinitionField {
  name: string;
  label: string;
  type: 'string' | 'number' | 'boolean' | 'select' | 'textarea' | 'date' | 'email' | 'url';
  required?: boolean;
  options?: string[];
  min?: number;
  max?: number;
  minLength?: number;
  maxLength?: number;
  placeholder?: string;
  description?: string;
  default?: any;
}

/**
 * Proposal Interfaces
 */
export interface Proposal {
  id: string;
  serviceScopeId: string;
  proposalType: ProposalType;
  documentLink: string;
  version: string | null;
  status: ProposalStatus;
  title: string | null;
  description: string | null;
  proposalValue: number | null;
  currency: string | null;
  validUntilDate: string | null;
  estimatedDurationDays: number | null;
  submittedAt: string | null;
  approvedAt: string | null;
  assigneeUserId: string | null;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
  
  // Relationships
  serviceScope?: ServiceScope;
  assigneeUser?: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    fullName?: string;
  };
  
  // Virtual properties
  isDraft?: boolean;
  isSubmitted?: boolean;
  isApproved?: boolean;
  isFinal?: boolean;
  isExpired?: boolean;
  displayName?: string;
  formattedValue?: string;
  daysSinceCreation?: number;
  daysSinceSubmission?: number | null;
}

/**
 * Service Scope DTOs
 */
export interface CreateServiceScopeDto {
  serviceId: string;
  scopeDetails?: Record<string, any>;
  price?: number;
  quantity?: number;
  unit?: string;
  notes?: string;
  safServiceStartDate?: string;
  safServiceEndDate?: string;
  safStatus?: SAFStatus;
}

export interface UpdateServiceScopeDto {
  serviceId?: string;
  scopeDetails?: Record<string, any>;
  price?: number;
  quantity?: number;
  unit?: string;
  notes?: string;
  isActive?: boolean;
  safDocumentLink?: string;
  safServiceStartDate?: string;
  safServiceEndDate?: string;
  safStatus?: SAFStatus;
}

/**
 * Proposal DTOs
 */
export interface CreateProposalDto {
  serviceScopeId: string;
  proposalType: ProposalType;
  documentLink: string;
  version?: string;
  status?: ProposalStatus;
  title?: string;
  description?: string;
  proposalValue?: number;
  currency?: string;
  validUntilDate?: string;
  estimatedDurationDays?: number;
  submittedAt?: string;
  approvedAt?: string;
  assigneeUserId?: string;
  notes?: string;
}

export interface UpdateProposalDto {
  proposalType?: ProposalType;
  documentLink?: string;
  version?: string;
  status?: ProposalStatus;
  title?: string;
  description?: string;
  proposalValue?: number;
  currency?: string;
  validUntilDate?: string;
  estimatedDurationDays?: number;
  submittedAt?: string;
  approvedAt?: string;
  assigneeUserId?: string;
  notes?: string;
}

/**
 * Query Options
 */
export interface ServiceScopeQueryOptions {
  contractId?: string;
  serviceId?: string;
  safStatus?: SAFStatus;
  isActive?: boolean;
  search?: string;
  page?: number;
  limit?: number;
}

export interface ProposalQueryOptions {
  serviceScopeId?: string;
  proposalType?: ProposalType;
  status?: ProposalStatus;
  assigneeUserId?: string;
  clientId?: string;
  currency?: string;
  dateFrom?: string;
  dateTo?: string;
  submittedDateFrom?: string;
  submittedDateTo?: string;
  search?: string;
  page?: number;
  limit?: number;
  sortBy?: string;
  sortDirection?: 'ASC' | 'DESC';
}

/**
 * Form Validation Interfaces
 */
export interface ServiceScopeFormData {
  serviceId: string;
  scopeDetails: Record<string, any>;
  price: number | null;
  quantity: number | null;
  unit: string;
  notes: string;
  safServiceStartDate: string;
  safServiceEndDate: string;
  safStatus: SAFStatus;
}

export interface ProposalFormData {
  proposalType: ProposalType;
  title: string;
  description: string;
  proposalValue: number | null;
  currency: string;
  validUntilDate: string;
  estimatedDurationDays: number | null;
  version: string;
  status: ProposalStatus;
  assigneeUserId: string | null;
  notes: string;
  documentFile?: File;
}

/**
 * Dynamic Form Field Value Types
 */
export type FieldValue = string | number | boolean | Date | string[] | null;

export interface DynamicFormData {
  [fieldName: string]: FieldValue;
}

/**
 * Form Validation Errors
 */
export interface FormValidationErrors {
  [fieldName: string]: string;
}

/**
 * Component State Interfaces
 */
export interface ServiceScopeManagerState {
  serviceScopes: ServiceScope[];
  selectedServiceScope: ServiceScope | null;
  isLoading: boolean;
  error: string | null;
  showCreateForm: boolean;
  showEditForm: boolean;
}

export interface ProposalManagerState {
  proposals: Proposal[];
  selectedProposal: Proposal | null;
  isLoading: boolean;
  error: string | null;
  showCreateForm: boolean;
  showEditForm: boolean;
}

// Re-export types from contract.ts to avoid circular dependencies
export interface Contract {
  id: string;
  contractName: string;
  clientId: string;
  startDate: string;
  endDate: string;
  renewalDate?: string | null;
  value?: number | null;
  status: string;
  documentLink?: string | null;
  notes?: string | null;
  previousContractId?: string | null;
  createdAt: string;
  updatedAt: string;
  
  // Relationships
  client?: {
    id: string;
    companyName: string;
    email?: string;
  };
} 