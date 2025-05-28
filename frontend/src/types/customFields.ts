/**
 * Custom Field Entity Types
 * Defines which entities can have custom fields attached
 */
export enum CustomFieldEntityType {
  CLIENT = 'client',
  CONTRACT = 'contract',
  PROPOSAL = 'proposal',
  SERVICE = 'service',
  SERVICE_SCOPE = 'service_scope',
  HARDWARE_ASSET = 'hardware_asset',
  USER = 'user',
  FINANCIAL_TRANSACTION = 'financial_transaction',
  LICENSE_POOL = 'license_pool',
  TEAM_ASSIGNMENT = 'team_assignment',
}

/**
 * Custom Field Types
 * Defines the data types for custom fields
 */
export enum CustomFieldType {
  TEXT_SINGLE_LINE = 'text_single_line',
  TEXT_MULTI_LINE = 'text_multi_line',
  NUMBER_INTEGER = 'number_integer',
  NUMBER_DECIMAL = 'number_decimal',
  BOOLEAN = 'boolean',
  DATE = 'date',
  DATETIME = 'datetime',
  EMAIL = 'email',
  URL = 'url',
  PHONE = 'phone',
  SELECT_SINGLE_DROPDOWN = 'select_single_dropdown',
  SELECT_MULTI_CHECKBOX = 'select_multi_checkbox',
  CURRENCY = 'currency',
  PERCENTAGE = 'percentage',
}

/**
 * Custom Field Definition Interface
 */
export interface CustomFieldDefinition {
  id: string;
  entityType: CustomFieldEntityType;
  name: string;
  label: string;
  fieldType: CustomFieldType;
  selectOptions?: string[];
  isRequired: boolean;
  displayOrder: number;
  placeholderText?: string;
  helpText?: string;
  validationRules?: Record<string, any>;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

/**
 * Create Custom Field Definition DTO
 */
export interface CreateCustomFieldDefinitionDto {
  entityType: CustomFieldEntityType;
  name: string;
  label: string;
  fieldType: CustomFieldType;
  selectOptions?: string[];
  isRequired?: boolean;
  displayOrder?: number;
  placeholderText?: string;
  helpText?: string;
  validationRules?: Record<string, any>;
}

/**
 * Update Custom Field Definition DTO
 */
export interface UpdateCustomFieldDefinitionDto {
  name?: string;
  label?: string;
  fieldType?: CustomFieldType;
  selectOptions?: string[];
  isRequired?: boolean;
  displayOrder?: number;
  placeholderText?: string;
  helpText?: string;
  validationRules?: Record<string, any>;
  isActive?: boolean;
}

/**
 * Custom Field Definition Query Parameters
 */
export interface CustomFieldDefinitionQueryDto {
  entityType?: CustomFieldEntityType;
  isActive?: boolean;
  page?: number;
  limit?: number;
}

/**
 * Entity Type Display Names
 */
export const ENTITY_TYPE_DISPLAY_NAMES: Record<CustomFieldEntityType, string> = {
  [CustomFieldEntityType.CLIENT]: 'Client',
  [CustomFieldEntityType.CONTRACT]: 'Contract',
  [CustomFieldEntityType.PROPOSAL]: 'Proposal',
  [CustomFieldEntityType.SERVICE]: 'Service',
  [CustomFieldEntityType.SERVICE_SCOPE]: 'Service Scope',
  [CustomFieldEntityType.HARDWARE_ASSET]: 'Hardware Asset',
  [CustomFieldEntityType.USER]: 'User',
  [CustomFieldEntityType.FINANCIAL_TRANSACTION]: 'Financial Transaction',
  [CustomFieldEntityType.LICENSE_POOL]: 'License Pool',
  [CustomFieldEntityType.TEAM_ASSIGNMENT]: 'Team Assignment',
};

/**
 * Field Type Display Names
 */
export const FIELD_TYPE_DISPLAY_NAMES: Record<CustomFieldType, string> = {
  [CustomFieldType.TEXT_SINGLE_LINE]: 'Single Line Text',
  [CustomFieldType.TEXT_MULTI_LINE]: 'Multi Line Text',
  [CustomFieldType.NUMBER_INTEGER]: 'Integer Number',
  [CustomFieldType.NUMBER_DECIMAL]: 'Decimal Number',
  [CustomFieldType.BOOLEAN]: 'Yes/No (Boolean)',
  [CustomFieldType.DATE]: 'Date',
  [CustomFieldType.DATETIME]: 'Date & Time',
  [CustomFieldType.EMAIL]: 'Email Address',
  [CustomFieldType.URL]: 'Website URL',
  [CustomFieldType.PHONE]: 'Phone Number',
  [CustomFieldType.SELECT_SINGLE_DROPDOWN]: 'Single Select Dropdown',
  [CustomFieldType.SELECT_MULTI_CHECKBOX]: 'Multi Select Checkboxes',
  [CustomFieldType.CURRENCY]: 'Currency Amount',
  [CustomFieldType.PERCENTAGE]: 'Percentage',
};

/**
 * Field types that require select options
 */
export const FIELD_TYPES_WITH_OPTIONS = [
  CustomFieldType.SELECT_SINGLE_DROPDOWN,
  CustomFieldType.SELECT_MULTI_CHECKBOX,
];

/**
 * Validation rule examples for different field types
 */
export const VALIDATION_RULE_EXAMPLES: Record<CustomFieldType, string> = {
  [CustomFieldType.TEXT_SINGLE_LINE]: '{"minLength": 3, "maxLength": 100, "pattern": "^[a-zA-Z0-9\\\\s]+$"}',
  [CustomFieldType.TEXT_MULTI_LINE]: '{"minLength": 10, "maxLength": 1000}',
  [CustomFieldType.NUMBER_INTEGER]: '{"min": 1, "max": 100}',
  [CustomFieldType.NUMBER_DECIMAL]: '{"min": 0.1, "max": 999.99, "decimalPlaces": 2}',
  [CustomFieldType.BOOLEAN]: '{}',
  [CustomFieldType.DATE]: '{"minDate": "2024-01-01", "maxDate": "2030-12-31"}',
  [CustomFieldType.DATETIME]: '{"minDate": "2024-01-01T00:00:00Z"}',
  [CustomFieldType.EMAIL]: '{}',
  [CustomFieldType.URL]: '{}',
  [CustomFieldType.PHONE]: '{}',
  [CustomFieldType.SELECT_SINGLE_DROPDOWN]: '{}',
  [CustomFieldType.SELECT_MULTI_CHECKBOX]: '{}',
  [CustomFieldType.CURRENCY]: '{"min": 0, "max": 1000000}',
  [CustomFieldType.PERCENTAGE]: '{"min": 0, "max": 100}',
}; 