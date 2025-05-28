import React from 'react';
import { CustomFieldEntityType } from '../../types/customFields';
import { useCustomFields } from '../../hooks/useCustomFields';
import CustomFieldRenderer from './CustomFieldRenderer';
import './CustomFieldRenderer.css';

interface CustomFieldsFormProps {
  entityType: CustomFieldEntityType;
  initialValues?: Record<string, any>;
  onValuesChange?: (values: Record<string, any>) => void;
  onValidationChange?: (isValid: boolean, errors: Record<string, string>) => void;
  disabled?: boolean;
  title?: string;
  className?: string;
}

/**
 * CustomFieldsForm Component
 * Renders custom fields in forms with validation and state management
 */
const CustomFieldsForm: React.FC<CustomFieldsFormProps> = ({
  entityType,
  initialValues = {},
  onValuesChange,
  onValidationChange,
  disabled = false,
  title = 'Additional Information',
  className = '',
}) => {
  const {
    definitions,
    values,
    errors,
    loading,
    error,
    setValue,
    validateFields,
    getFormattedValues,
    hasCustomFields,
  } = useCustomFields({
    entityType,
    initialValues,
    mode: 'form',
  });

  // Notify parent of value changes
  React.useEffect(() => {
    if (onValuesChange) {
      onValuesChange(getFormattedValues());
    }
  }, [values, onValuesChange, getFormattedValues]);

  // Notify parent of validation changes
  React.useEffect(() => {
    if (onValidationChange) {
      const isValid = Object.keys(errors).length === 0;
      onValidationChange(isValid, errors);
    }
  }, [errors, onValidationChange]);

  // Validate fields when values change
  React.useEffect(() => {
    if (hasCustomFields && Object.keys(values).length > 0) {
      validateFields();
    }
  }, [values, validateFields, hasCustomFields]);

  // Don't render if there are no custom fields defined
  if (!hasCustomFields && !loading) {
    return null;
  }

  if (loading) {
    return (
      <div className={`custom-fields-form-section ${className}`}>
        <h3>{title}</h3>
        <div className="custom-fields-loading">
          <div className="custom-fields-loading-spinner"></div>
          Loading custom fields...
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={`custom-fields-form-section ${className}`}>
        <h3>{title}</h3>
        <div className="custom-fields-error">
          Failed to load custom fields: {error}
        </div>
      </div>
    );
  }

  return (
    <div className={`custom-fields-form-section ${className}`}>
      <h3>{title}</h3>
      <div className="custom-fields-form-grid">
        {definitions.map((definition) => (
          <CustomFieldRenderer
            key={definition.id}
            definition={definition}
            value={values[definition.name]}
            onChange={(value) => setValue(definition.name, value)}
            error={errors[definition.name]}
            disabled={disabled}
            mode="form"
          />
        ))}
      </div>
    </div>
  );
};

export default CustomFieldsForm; 