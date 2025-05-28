import React, { useState, useEffect } from 'react';
import { 
  ScopeDefinitionField, 
  DynamicFormData, 
  FormValidationErrors, 
  FieldValue 
} from '../../types/service-scope';
import './DynamicForm.css';

interface DynamicFormProps {
  fields: ScopeDefinitionField[];
  initialData?: DynamicFormData;
  onDataChange: (data: DynamicFormData) => void;
  onValidationChange: (isValid: boolean, errors: FormValidationErrors) => void;
  disabled?: boolean;
  className?: string;
}

const DynamicForm: React.FC<DynamicFormProps> = ({
  fields,
  initialData = {},
  onDataChange,
  onValidationChange,
  disabled = false,
  className = ''
}) => {
  const [formData, setFormData] = useState<DynamicFormData>(initialData);
  const [errors, setErrors] = useState<FormValidationErrors>({});

  // Initialize form data with default values
  useEffect(() => {
    const initializedData: DynamicFormData = { ...initialData };
    
    fields.forEach(field => {
      if (!(field.name in initializedData) && field.default !== undefined) {
        initializedData[field.name] = field.default;
      }
    });
    
    setFormData(initializedData);
  }, [fields, initialData]);

  // Validate a single field
  const validateField = (field: ScopeDefinitionField, value: FieldValue): string | null => {
    // Required field validation
    if (field.required && (value === null || value === undefined || value === '')) {
      return `${field.label} is required`;
    }

    // Skip validation for empty optional fields
    if (!field.required && (value === null || value === undefined || value === '')) {
      return null;
    }

    // Type-specific validation
    switch (field.type) {
      case 'string':
      case 'textarea':
      case 'email':
      case 'url':
        const stringValue = String(value);
        if (field.minLength && stringValue.length < field.minLength) {
          return `${field.label} must be at least ${field.minLength} characters`;
        }
        if (field.maxLength && stringValue.length > field.maxLength) {
          return `${field.label} must not exceed ${field.maxLength} characters`;
        }
        if (field.type === 'email' && stringValue && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(stringValue)) {
          return `${field.label} must be a valid email address`;
        }
        if (field.type === 'url' && stringValue && !/^https?:\/\/.+/.test(stringValue)) {
          return `${field.label} must be a valid URL`;
        }
        break;

      case 'number':
        const numValue = Number(value);
        if (isNaN(numValue)) {
          return `${field.label} must be a valid number`;
        }
        if (field.min !== undefined && numValue < field.min) {
          return `${field.label} must be at least ${field.min}`;
        }
        if (field.max !== undefined && numValue > field.max) {
          return `${field.label} must not exceed ${field.max}`;
        }
        break;

      case 'select':
        if (field.options && !field.options.includes(String(value))) {
          return `${field.label} must be one of the available options`;
        }
        break;

      case 'date':
        if (value && isNaN(Date.parse(String(value)))) {
          return `${field.label} must be a valid date`;
        }
        break;
    }

    return null;
  };

  // Validate all fields
  const validateForm = (data: DynamicFormData): FormValidationErrors => {
    const newErrors: FormValidationErrors = {};
    
    fields.forEach(field => {
      const error = validateField(field, data[field.name]);
      if (error) {
        newErrors[field.name] = error;
      }
    });
    
    return newErrors;
  };

  // Handle field value change
  const handleFieldChange = (fieldName: string, value: FieldValue) => {
    const newData = { ...formData, [fieldName]: value };
    setFormData(newData);
    
    // Validate the form
    const newErrors = validateForm(newData);
    setErrors(newErrors);
    
    // Notify parent components
    onDataChange(newData);
    onValidationChange(Object.keys(newErrors).length === 0, newErrors);
  };

  // Render individual field based on type
  const renderField = (field: ScopeDefinitionField) => {
    const value = formData[field.name] || '';
    const error = errors[field.name];
    const fieldId = `field-${field.name}`;

    const commonProps = {
      id: fieldId,
      disabled,
      className: `form-input ${error ? 'error' : ''}`,
      'aria-describedby': error ? `${fieldId}-error` : undefined,
    };

    switch (field.type) {
      case 'string':
      case 'email':
      case 'url':
        return (
          <input
            {...commonProps}
            type={field.type === 'string' ? 'text' : field.type}
            value={String(value)}
            placeholder={field.placeholder}
            onChange={(e) => handleFieldChange(field.name, e.target.value)}
          />
        );

      case 'number':
        return (
          <input
            {...commonProps}
            type="number"
            value={value === null || value === undefined ? '' : String(value)}
            placeholder={field.placeholder}
            min={field.min}
            max={field.max}
            onChange={(e) => {
              const numValue = e.target.value === '' ? null : Number(e.target.value);
              handleFieldChange(field.name, numValue);
            }}
          />
        );

      case 'textarea':
        return (
          <textarea
            {...commonProps}
            value={String(value)}
            placeholder={field.placeholder}
            rows={4}
            onChange={(e) => handleFieldChange(field.name, e.target.value)}
          />
        );

      case 'boolean':
        return (
          <div className="checkbox-wrapper">
            <input
              {...commonProps}
              type="checkbox"
              checked={Boolean(value)}
              onChange={(e) => handleFieldChange(field.name, e.target.checked)}
            />
            <label htmlFor={fieldId} className="checkbox-label">
              {field.description || 'Enable this option'}
            </label>
          </div>
        );

      case 'select':
        return (
          <select
            {...commonProps}
            value={String(value)}
            onChange={(e) => handleFieldChange(field.name, e.target.value)}
          >
            <option value="">Select {field.label}</option>
            {field.options?.map(option => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
        );

      case 'date':
        return (
          <input
            {...commonProps}
            type="date"
            value={value ? String(value).split('T')[0] : ''}
            onChange={(e) => handleFieldChange(field.name, e.target.value)}
          />
        );

      default:
        return (
          <input
            {...commonProps}
            type="text"
            value={String(value)}
            placeholder={field.placeholder}
            onChange={(e) => handleFieldChange(field.name, e.target.value)}
          />
        );
    }
  };

  return (
    <div className={`dynamic-form ${className}`}>
      {fields.map(field => (
        <div key={field.name} className="form-group">
          <label htmlFor={`field-${field.name}`} className="form-label">
            {field.label}
            {field.required && <span className="required">*</span>}
          </label>
          
          {field.description && (
            <p className="field-description">{field.description}</p>
          )}
          
          {renderField(field)}
          
          {errors[field.name] && (
            <div id={`field-${field.name}-error`} className="error-message">
              {errors[field.name]}
            </div>
          )}
        </div>
      ))}
    </div>
  );
};

export default DynamicForm; 