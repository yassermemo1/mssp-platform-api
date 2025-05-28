/**
 * Service Category Enumeration
 * Matches backend ServiceCategory enum
 */
export enum ServiceCategory {
  SECURITY_OPERATIONS = 'security_operations',
  ENDPOINT_SECURITY = 'endpoint_security',
  NETWORK_SECURITY = 'network_security',
  CLOUD_SECURITY = 'cloud_security',
  INFRASTRUCTURE_SECURITY = 'infrastructure_security',
  DATA_PROTECTION = 'data_protection',
  PRIVACY_COMPLIANCE = 'privacy_compliance',
  INCIDENT_RESPONSE = 'incident_response',
  THREAT_HUNTING = 'threat_hunting',
  FORENSICS = 'forensics',
  COMPLIANCE = 'compliance',
  RISK_ASSESSMENT = 'risk_assessment',
  AUDIT_SERVICES = 'audit_services',
  CONSULTING = 'consulting',
  SECURITY_ARCHITECTURE = 'security_architecture',
  STRATEGY_PLANNING = 'strategy_planning',
  MANAGED_IT = 'managed_it',
  MANAGED_DETECTION_RESPONSE = 'managed_detection_response',
  MANAGED_SIEM = 'managed_siem',
  TRAINING = 'training',
  SECURITY_AWARENESS = 'security_awareness',
  PENETRATION_TESTING = 'penetration_testing',
  VULNERABILITY_ASSESSMENT = 'vulnerability_assessment',
  OTHER = 'other',
}

/**
 * Service Delivery Model Enumeration
 * Matches backend ServiceDeliveryModel enum
 */
export enum ServiceDeliveryModel {
  SERVERLESS = 'serverless',
  SAAS_PLATFORM = 'saas_platform',
  CLOUD_HOSTED = 'cloud_hosted',
  PHYSICAL_SERVERS = 'physical_servers',
  ON_PREMISES_ENGINEER = 'on_premises_engineer',
  CLIENT_INFRASTRUCTURE = 'client_infrastructure',
  REMOTE_SUPPORT = 'remote_support',
  REMOTE_MONITORING = 'remote_monitoring',
  VIRTUAL_DELIVERY = 'virtual_delivery',
  HYBRID = 'hybrid',
  MULTI_CLOUD = 'multi_cloud',
  CONSULTING_ENGAGEMENT = 'consulting_engagement',
  PROFESSIONAL_SERVICES = 'professional_services',
}

/**
 * Scope Definition Field Type
 * Defines the supported field types for dynamic forms
 */
export type ScopeFieldType = 'string' | 'number' | 'boolean' | 'select' | 'textarea' | 'date' | 'email' | 'url';

/**
 * Scope Definition Field Interface
 * Matches backend ScopeDefinitionField interface
 */
export interface ScopeDefinitionField {
  name: string;
  label: string;
  type: ScopeFieldType;
  required?: boolean;
  options?: string[]; // For select type
  min?: number; // For number type
  max?: number; // For number type
  minLength?: number; // For string/textarea type
  maxLength?: number; // For string/textarea type
  placeholder?: string;
  description?: string;
  default?: any;
}

/**
 * Scope Definition Template Interface
 * Matches backend ScopeDefinitionTemplate interface
 */
export interface ScopeDefinitionTemplate {
  fields: ScopeDefinitionField[];
  version?: string;
  description?: string;
}

/**
 * Service Interface
 * Represents a service entity from the backend
 */
export interface Service {
  id: string;
  name: string;
  description: string | null;
  category: ServiceCategory;
  deliveryModel: ServiceDeliveryModel;
  basePrice: number | null;
  isActive: boolean;
  scopeDefinitionTemplate: ScopeDefinitionTemplate | null;
  createdAt: string;
  updatedAt: string;
}

/**
 * Create Service DTO
 * For creating new services
 */
export interface CreateServiceDto {
  name: string;
  description?: string;
  category: ServiceCategory;
  deliveryModel: ServiceDeliveryModel;
  basePrice?: number;
  isActive?: boolean;
  scopeDefinitionTemplate?: ScopeDefinitionTemplate;
}

/**
 * Update Service DTO
 * For updating existing services
 */
export interface UpdateServiceDto {
  name?: string;
  description?: string;
  category?: ServiceCategory;
  deliveryModel?: ServiceDeliveryModel;
  basePrice?: number;
  isActive?: boolean;
  scopeDefinitionTemplate?: ScopeDefinitionTemplate;
}

/**
 * Update Scope Definition Template DTO
 * For updating just the scope definition template
 */
export interface UpdateScopeDefinitionTemplateDto {
  scopeDefinitionTemplate: ScopeDefinitionTemplate;
}

/**
 * Service Query Options
 * For filtering and pagination
 */
export interface ServiceQueryOptions {
  isActive?: boolean;
  category?: ServiceCategory;
  deliveryModel?: ServiceDeliveryModel;
  search?: string;
  page?: number;
  limit?: number;
}

/**
 * Service Statistics Interface
 */
export interface ServiceStatistics {
  total: number;
  active: number;
  inactive: number;
  byCategory: Record<string, number>;
  byDeliveryModel: Record<string, number>;
}

/**
 * API Response wrapper for services
 */
export interface ServiceApiResponse<T> {
  statusCode: number;
  message: string;
  data: T;
  meta?: {
    total: number;
    page: number;
    limit: number;
    filters: Partial<ServiceQueryOptions>;
  };
}

/**
 * Scope Template Response
 * For GET /services/:id/scope-template endpoint
 */
export interface ScopeTemplateResponse {
  scopeDefinitionTemplate: ScopeDefinitionTemplate | null;
}

/**
 * Helper type for form field validation
 */
export interface FieldValidationError {
  field: string;
  message: string;
}

/**
 * Form state for scope field editing
 */
export interface ScopeFieldFormData {
  name: string;
  label: string;
  type: ScopeFieldType;
  required: boolean;
  options: string[];
  min?: number;
  max?: number;
  minLength?: number;
  maxLength?: number;
  placeholder: string;
  description: string;
  default?: any;
}

/**
 * UI State for scope template management
 */
export interface ScopeTemplateUIState {
  isLoading: boolean;
  isSaving: boolean;
  error: string | null;
  hasUnsavedChanges: boolean;
  editingFieldIndex: number | null;
  showAddFieldModal: boolean;
  showDeleteConfirmation: boolean;
  fieldToDelete: number | null;
} 