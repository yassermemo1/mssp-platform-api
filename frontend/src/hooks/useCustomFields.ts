import { useState, useEffect, useCallback } from 'react';
import { 
  CustomFieldDefinition, 
  CustomFieldEntityType,
  CustomFieldType 
} from '../types/customFields';
import { apiService } from '../services/apiService';

interface UseCustomFieldsOptions {
  entityType: CustomFieldEntityType;
  initialValues?: Record<string, any>;
  mode?: 'form' | 'display';
}

interface UseCustomFieldsReturn {
  definitions: CustomFieldDefinition[];
  values: Record<string, any>;
  errors: Record<string, string>;
  loading: boolean;
  error: string | null;
  setValue: (fieldName: string, value: any) => void;
  setValues: (values: Record<string, any>) => void;
  validateFields: () => boolean;
  clearErrors: () => void;
  getFormattedValues: () => Record<string, any>;
  hasCustomFields: boolean;
}

/**
 * Custom hook for managing custom fields in forms and display components
 */
export const useCustomFields = ({
  entityType,
  initialValues = {},
  mode = 'form'
}: UseCustomFieldsOptions): UseCustomFieldsReturn => {
  const [definitions, setDefinitions] = useState<CustomFieldDefinition[]>([]);
  const [values, setValues] = useState<Record<string, any>>(initialValues);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  /**
   * Fetch custom field definitions for the entity type
   */
  const fetchDefinitions = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await apiService.getCustomFieldDefinitions({
        entityType,
        isActive: true,
      });
      
      // Sort by display order
      const sortedDefinitions = response.data.sort((a, b) => a.displayOrder - b.displayOrder);
      setDefinitions(sortedDefinitions);
      
    } catch (err: any) {
      setError(err.message || 'Failed to load custom field definitions');
      console.error('Error fetching custom field definitions:', err);
    } finally {
      setLoading(false);
    }
  }, [entityType]);

  /**
   * Load definitions when component mounts or entity type changes
   */
  useEffect(() => {
    fetchDefinitions();
  }, [fetchDefinitions]);

  /**
   * Update values when initial values change
   */
  useEffect(() => {
    setValues(initialValues);
  }, [initialValues]);

  /**
   * Set a single field value
   */
  const setValue = useCallback((fieldName: string, value: any) => {
    setValues(prev => ({
      ...prev,
      [fieldName]: value
    }));
    
    // Clear error for this field
    if (errors[fieldName]) {
      setErrors(prev => ({
        ...prev,
        [fieldName]: ''
      }));
    }
  }, [errors]);

  /**
   * Set multiple field values
   */
  const setValuesCallback = useCallback((newValues: Record<string, any>) => {
    setValues(newValues);
    setErrors({});
  }, []);

  /**
   * Validate all custom fields
   */
  const validateFields = useCallback((): boolean => {
    const newErrors: Record<string, string> = {};

    definitions.forEach(definition => {
      const value = values[definition.name];
      
      // Check required fields
      if (definition.isRequired) {
        if (value === null || value === undefined || value === '') {
          newErrors[definition.name] = `${definition.label} is required`;
          return;
        }
        
        // Special handling for array values (multi-select)
        if (definition.fieldType === CustomFieldType.SELECT_MULTI_CHECKBOX) {
          if (!Array.isArray(value) || value.length === 0) {
            newErrors[definition.name] = `${definition.label} is required`;
            return;
          }
        }
      }

      // Skip validation if field is empty and not required
      if (value === null || value === undefined || value === '') {
        return;
      }

      // Type-specific validation
      switch (definition.fieldType) {
        case CustomFieldType.EMAIL:
          const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
          if (!emailRegex.test(value)) {
            newErrors[definition.name] = 'Please enter a valid email address';
          }
          break;

        case CustomFieldType.URL:
          try {
            new URL(value);
          } catch {
            newErrors[definition.name] = 'Please enter a valid URL';
          }
          break;

        case CustomFieldType.NUMBER_INTEGER:
          if (!Number.isInteger(Number(value))) {
            newErrors[definition.name] = 'Please enter a valid integer';
          }
          break;

        case CustomFieldType.NUMBER_DECIMAL:
        case CustomFieldType.CURRENCY:
        case CustomFieldType.PERCENTAGE:
          if (isNaN(Number(value))) {
            newErrors[definition.name] = 'Please enter a valid number';
          }
          break;

        case CustomFieldType.PERCENTAGE:
          const percentValue = Number(value);
          if (percentValue < 0 || percentValue > 100) {
            newErrors[definition.name] = 'Percentage must be between 0 and 100';
          }
          break;
      }

      // Custom validation rules
      if (definition.validationRules && typeof definition.validationRules === 'object') {
        const rules = definition.validationRules;
        
        // Min/Max length for text fields
        if (rules.minLength && value.length < rules.minLength) {
          newErrors[definition.name] = `Minimum length is ${rules.minLength} characters`;
        }
        if (rules.maxLength && value.length > rules.maxLength) {
          newErrors[definition.name] = `Maximum length is ${rules.maxLength} characters`;
        }
        
        // Min/Max value for numeric fields
        if (rules.min !== undefined && Number(value) < rules.min) {
          newErrors[definition.name] = `Minimum value is ${rules.min}`;
        }
        if (rules.max !== undefined && Number(value) > rules.max) {
          newErrors[definition.name] = `Maximum value is ${rules.max}`;
        }
        
        // Pattern validation
        if (rules.pattern) {
          const regex = new RegExp(rules.pattern);
          if (!regex.test(value)) {
            newErrors[definition.name] = `Invalid format for ${definition.label}`;
          }
        }
        
        // Date range validation
        if (rules.minDate && new Date(value) < new Date(rules.minDate)) {
          newErrors[definition.name] = `Date must be after ${rules.minDate}`;
        }
        if (rules.maxDate && new Date(value) > new Date(rules.maxDate)) {
          newErrors[definition.name] = `Date must be before ${rules.maxDate}`;
        }
      }
    });

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }, [definitions, values]);

  /**
   * Clear all validation errors
   */
  const clearErrors = useCallback(() => {
    setErrors({});
  }, []);

  /**
   * Get formatted values for submission (removes empty values, formats types)
   */
  const getFormattedValues = useCallback((): Record<string, any> => {
    const formattedValues: Record<string, any> = {};

    definitions.forEach(definition => {
      const value = values[definition.name];
      
      // Skip empty values
      if (value === null || value === undefined || value === '') {
        return;
      }

      // Skip empty arrays
      if (Array.isArray(value) && value.length === 0) {
        return;
      }

      // Format based on field type
      switch (definition.fieldType) {
        case CustomFieldType.NUMBER_INTEGER:
          formattedValues[definition.name] = parseInt(value, 10);
          break;
        case CustomFieldType.NUMBER_DECIMAL:
        case CustomFieldType.CURRENCY:
        case CustomFieldType.PERCENTAGE:
          formattedValues[definition.name] = parseFloat(value);
          break;
        case CustomFieldType.BOOLEAN:
          formattedValues[definition.name] = value === true || value === 'true';
          break;
        case CustomFieldType.DATE:
        case CustomFieldType.DATETIME:
          formattedValues[definition.name] = value;
          break;
        default:
          formattedValues[definition.name] = value;
      }
    });

    return formattedValues;
  }, [definitions, values]);

  return {
    definitions,
    values,
    errors,
    loading,
    error,
    setValue,
    setValues: setValuesCallback,
    validateFields,
    clearErrors,
    getFormattedValues,
    hasCustomFields: definitions.length > 0,
  };
}; 