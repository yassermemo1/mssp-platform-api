/**
 * Custom Field Type Enum
 * Defines the data types supported for custom fields
 */
export enum CustomFieldType {
  // Text Fields
  TEXT_SINGLE_LINE = 'text_single_line',
  TEXT_MULTI_LINE = 'text_multi_line',
  TEXT_RICH = 'text_rich',
  
  // Numeric Fields
  NUMBER_INTEGER = 'number_integer',
  NUMBER_DECIMAL = 'number_decimal',
  
  // Date/Time Fields
  DATE = 'date',
  DATETIME = 'datetime',
  TIME = 'time',
  
  // Boolean Field
  BOOLEAN = 'boolean',
  
  // Selection Fields
  SELECT_SINGLE_DROPDOWN = 'select_single_dropdown',
  SELECT_MULTI_CHECKBOX = 'select_multi_checkbox',
  
  // Contact Fields
  EMAIL = 'email',
  PHONE = 'phone',
  URL = 'url',
  
  // Reference Fields
  USER_REFERENCE = 'user_reference',
  CLIENT_REFERENCE = 'client_reference',
  
  // File Fields
  FILE_UPLOAD = 'file_upload',
  IMAGE_UPLOAD = 'image_upload',
  
  // Special Fields
  JSON_DATA = 'json_data',
  CURRENCY = 'currency',
  PERCENTAGE = 'percentage',
} 