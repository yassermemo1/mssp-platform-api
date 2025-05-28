import { Client, ClientStatus } from './client';
import { Service, ServiceCategory, ServiceDeliveryModel } from './service';

export interface Contract {
  id: string;
  contractName: string;
  clientId: string;
  startDate: string;
  endDate: string;
  renewalDate?: string | null;
  value?: number | null;
  status: ContractStatus;
  documentLink?: string | null;
  notes?: string | null;
  previousContractId?: string | null;
  createdAt: string;
  updatedAt: string;
  
  // Relationships
  client?: Client;
  previousContract?: Contract | null;
  renewalContracts?: Contract[];
  serviceScopes?: ServiceScope[];
  
  // Virtual properties
  isActive?: boolean;
  isExpiringSoon?: boolean;
  durationInDays?: number;
  isRenewal?: boolean;
}

export interface ServiceScope {
  id: string;
  contractId: string;
  serviceId: string;
  scopeDetails: Record<string, any>;
  price: number;
  quantity: number;
  unit: string;
  safStatus: SAFStatus;
  safServiceStartDate?: string | null;
  safServiceEndDate?: string | null;
  safDocumentLink?: string | null;
  createdAt: string;
  updatedAt: string;
  
  // Relationships
  contract?: Contract;
  service?: Service;
  proposals?: Proposal[];
}

export interface Proposal {
  id: string;
  serviceScopeId: string;
  proposalType: ProposalType;
  documentLink?: string | null;
  version: number;
  status: ProposalStatus;
  createdAt: string;
  updatedAt: string;
  
  // Relationships
  serviceScope?: ServiceScope;
}

export enum ContractStatus {
  DRAFT = 'draft',
  ACTIVE = 'active',
  RENEWED_ACTIVE = 'renewed_active',
  EXPIRED = 'expired',
  TERMINATED = 'terminated',
  CANCELLED = 'cancelled',
}

export enum ClientSourceType {
  REFERRAL = 'referral',
  WEBSITE = 'website',
  COLD_OUTREACH = 'cold_outreach',
  PARTNERSHIP = 'partnership',
  EXISTING_CLIENT = 'existing_client',
  CONFERENCE = 'conference',
  SOCIAL_MEDIA = 'social_media',
  OTHER = 'other',
}

export enum SAFStatus {
  PENDING = 'pending',
  IN_PROGRESS = 'in_progress',
  COMPLETED = 'completed',
  ON_HOLD = 'on_hold',
  CANCELLED = 'cancelled',
}

export enum ProposalType {
  TECHNICAL = 'technical',
  FINANCIAL = 'financial',
  TECHNICAL_FINANCIAL = 'technical_financial',
  ARCHITECTURE = 'architecture',
  IMPLEMENTATION = 'implementation',
  PRICING = 'pricing',
  SCOPE_CHANGE = 'scope_change',
  OTHER = 'other',
}

export enum ProposalStatus {
  DRAFT = 'draft',
  IN_PREPARATION = 'in_preparation',
  SUBMITTED = 'submitted',
  UNDER_REVIEW = 'under_review',
  PENDING_APPROVAL = 'pending_approval',
  PENDING_CLIENT_REVIEW = 'pending_client_review',
  REQUIRES_REVISION = 'requires_revision',
  APPROVED = 'approved',
  REJECTED = 'rejected',
  WITHDRAWN = 'withdrawn',
  ARCHIVED = 'archived',
  ACCEPTED_BY_CLIENT = 'accepted_by_client',
  IN_IMPLEMENTATION = 'in_implementation',
  COMPLETED = 'completed',
}

// API Response Types
export interface ContractApiResponse<T> {
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

export interface CreateContractDto {
  contractName: string;
  clientId: string;
  startDate: string;
  endDate: string;
  renewalDate?: string;
  value?: number;
  status?: ContractStatus;
  documentLink?: string;
  notes?: string;
  previousContractId?: string;
}

export interface UpdateContractDto {
  contractName?: string;
  clientId?: string;
  startDate?: string;
  endDate?: string;
  renewalDate?: string;
  value?: number;
  status?: ContractStatus;
  documentLink?: string;
  notes?: string;
  previousContractId?: string;
}

export interface ContractQueryOptions {
  clientId?: string;
  status?: ContractStatus;
  expiringSoonDays?: number;
  search?: string;
  page?: number;
  limit?: number;
}

export interface ContractStatistics {
  total: number;
  byStatus: Record<string, number>;
  activeContracts: number;
  expiringContracts: number;
}

export interface FileUploadResult {
  filename: string;
  originalName: string;
  path: string;
  size: number;
  mimetype: string;
  url: string;
} 