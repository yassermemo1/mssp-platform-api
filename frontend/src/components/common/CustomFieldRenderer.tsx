import React from 'react';
import {
  CustomFieldDefinition,
  CustomFieldType,
  FIELD_TYPE_DISPLAY_NAMES,
} from '../../types/customFields';
import './CustomFieldRenderer.css';

interface CustomFieldRendererProps {
  definition: CustomFieldDefinition;
  value?: any;
  onChange?: (value: any) => void;
  error?: string;
  disabled?: boolean;
  mode: 'form' | 'display';
}

/**
 * CustomFieldRenderer Component
 * Dynamically renders custom fields based on their type for both forms and display
 */
const CustomFieldRenderer: React.FC<CustomFieldRendererProps> = ({
  definition,
  value,
  onChange,
  error,
  disabled = false,
  mode = 'form',
}) => {
  /**
   * Handle input changes and convert values to appropriate types
   */
  const handleChange = (newValue: any) => {
    if (!onChange) return;

    // Convert values based on field type
    switch (definition.fieldType) {
      case CustomFieldType.NUMBER_INTEGER:
        onChange(newValue ? parseInt(newValue, 10) : null);
        break;
      case CustomFieldType.NUMBER_DECIMAL:
      case CustomFieldType.CURRENCY:
      case CustomFieldType.PERCENTAGE:
        onChange(newValue ? parseFloat(newValue) : null);
        break;
      case CustomFieldType.BOOLEAN:
        onChange(newValue === 'true' || newValue === true);
        break;
      case CustomFieldType.SELECT_MULTI_CHECKBOX:
        // Handle array values for multi-select
        if (Array.isArray(newValue)) {
          onChange(newValue);
        } else {
          // Toggle single value in array
          const currentValues = Array.isArray(value) ? value : [];
          const updatedValues = currentValues.includes(newValue)
            ? currentValues.filter(v => v !== newValue)
            : [...currentValues, newValue];
          onChange(updatedValues);
        }
        break;
      default:
        onChange(newValue || null);
    }
  };

  /**
   * Format value for display mode
   */
  const formatDisplayValue = (val: any): string => {
    if (val === null || val === undefined || val === '') {
      return 'Not specified';
    }

    switch (definition.fieldType) {
      case CustomFieldType.BOOLEAN:
        return val ? 'Yes' : 'No';
      case CustomFieldType.DATE:
        return new Date(val).toLocaleDateString();
      case CustomFieldType.DATETIME:
        return new Date(val).toLocaleString();
      case CustomFieldType.CURRENCY:
        return new Intl.NumberFormat('en-US', {
          style: 'currency',
          currency: 'SAR',
        }).format(val);
      case CustomFieldType.PERCENTAGE:
        return `${val}%`;
      case CustomFieldType.SELECT_MULTI_CHECKBOX:
        return Array.isArray(val) ? val.join(', ') : val;
      case CustomFieldType.EMAIL:
        return mode === 'display' ? val : val;
      case CustomFieldType.URL:
        return mode === 'display' ? val : val;
      case CustomFieldType.PHONE:
        return val;
      default:
        return String(val);
    }
  };

  /**
   * Render form input based on field type
   */
  const renderFormInput = () => {
    const commonProps = {
      id: definition.name,
      name: definition.name,
      disabled,
      className: error ? 'custom-field-input error' : 'custom-field-input',
    };

    switch (definition.fieldType) {
      case CustomFieldType.TEXT_SINGLE_LINE:
        return (
          <input
            {...commonProps}
            type="text"
            value={value || ''}
            onChange={(e) => handleChange(e.target.value)}
            placeholder={definition.placeholderText}
            maxLength={255}
          />
        );

      case CustomFieldType.TEXT_MULTI_LINE:
        return (
          <textarea
            {...commonProps}
            value={value || ''}
            onChange={(e) => handleChange(e.target.value)}
            placeholder={definition.placeholderText}
            rows={3}
            maxLength={1000}
          />
        );

      case CustomFieldType.NUMBER_INTEGER:
        return (
          <input
            {...commonProps}
            type="number"
            value={value || ''}
            onChange={(e) => handleChange(e.target.value)}
            placeholder={definition.placeholderText}
            step="1"
          />
        );

      case CustomFieldType.NUMBER_DECIMAL:
        return (
          <input
            {...commonProps}
            type="number"
            value={value || ''}
            onChange={(e) => handleChange(e.target.value)}
            placeholder={definition.placeholderText}
            step="0.01"
          />
        );

      case CustomFieldType.CURRENCY:
        return (
          <div className="currency-input-wrapper">
            <span className="currency-symbol">SAR</span>
            <input
              {...commonProps}
              type="number"
              value={value || ''}
              onChange={(e) => handleChange(e.target.value)}
              placeholder={definition.placeholderText}
              step="0.01"
              min="0"
            />
          </div>
        );

      case CustomFieldType.PERCENTAGE:
        return (
          <div className="percentage-input-wrapper">
            <input
              {...commonProps}
              type="number"
              value={value || ''}
              onChange={(e) => handleChange(e.target.value)}
              placeholder={definition.placeholderText}
              step="0.1"
              min="0"
              max="100"
            />
            <span className="percentage-symbol">%</span>
          </div>
        );

      case CustomFieldType.BOOLEAN:
        return (
          <select
            {...commonProps}
            value={value === true ? 'true' : value === false ? 'false' : ''}
            onChange={(e) => handleChange(e.target.value)}
          >
            <option value="">Select...</option>
            <option value="true">Yes</option>
            <option value="false">No</option>
          </select>
        );

      case CustomFieldType.DATE:
        return (
          <input
            {...commonProps}
            type="date"
            value={value ? value.split('T')[0] : ''}
            onChange={(e) => handleChange(e.target.value)}
          />
        );

      case CustomFieldType.DATETIME:
        return (
          <input
            {...commonProps}
            type="datetime-local"
            value={value ? value.slice(0, 16) : ''}
            onChange={(e) => handleChange(e.target.value)}
          />
        );

      case CustomFieldType.EMAIL:
        return (
          <input
            {...commonProps}
            type="email"
            value={value || ''}
            onChange={(e) => handleChange(e.target.value)}
            placeholder={definition.placeholderText}
          />
        );

      case CustomFieldType.URL:
        return (
          <input
            {...commonProps}
            type="url"
            value={value || ''}
            onChange={(e) => handleChange(e.target.value)}
            placeholder={definition.placeholderText}
          />
        );

      case CustomFieldType.PHONE:
        return (
          <input
            {...commonProps}
            type="tel"
            value={value || ''}
            onChange={(e) => handleChange(e.target.value)}
            placeholder={definition.placeholderText}
          />
        );

      case CustomFieldType.SELECT_SINGLE_DROPDOWN:
        return (
          <select
            {...commonProps}
            value={value || ''}
            onChange={(e) => handleChange(e.target.value)}
          >
            <option value="">Select an option...</option>
            {definition.selectOptions?.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
        );

      case CustomFieldType.SELECT_MULTI_CHECKBOX:
        const selectedValues = Array.isArray(value) ? value : [];
        return (
          <div className="checkbox-group">
            {definition.selectOptions?.map((option) => (
              <label key={option} className="checkbox-label">
                <input
                  type="checkbox"
                  checked={selectedValues.includes(option)}
                  onChange={() => handleChange(option)}
                  disabled={disabled}
                />
                <span className="checkbox-text">{option}</span>
              </label>
            ))}
          </div>
        );

      default:
        return (
          <input
            {...commonProps}
            type="text"
            value={value || ''}
            onChange={(e) => handleChange(e.target.value)}
            placeholder={definition.placeholderText}
          />
        );
    }
  };

  /**
   * Render display value with appropriate formatting and links
   */
  const renderDisplayValue = () => {
    const displayValue = formatDisplayValue(value);

    // Special handling for certain field types in display mode
    switch (definition.fieldType) {
      case CustomFieldType.EMAIL:
        return value ? (
          <a href={`mailto:${value}`} className="custom-field-link">
            {displayValue}
          </a>
        ) : (
          <span className="custom-field-empty">{displayValue}</span>
        );

      case CustomFieldType.URL:
        return value ? (
          <a href={value} target="_blank" rel="noopener noreferrer" className="custom-field-link">
            {displayValue}
          </a>
        ) : (
          <span className="custom-field-empty">{displayValue}</span>
        );

      case CustomFieldType.PHONE:
        return value ? (
          <a href={`tel:${value}`} className="custom-field-link">
            {displayValue}
          </a>
        ) : (
          <span className="custom-field-empty">{displayValue}</span>
        );

      case CustomFieldType.SELECT_MULTI_CHECKBOX:
        if (Array.isArray(value) && value.length > 0) {
          return (
            <div className="multi-value-display">
              {value.map((val, index) => (
                <span key={index} className="value-tag">
                  {val}
                </span>
              ))}
            </div>
          );
        }
        return <span className="custom-field-empty">{displayValue}</span>;

      default:
        return value ? (
          <span className="custom-field-value">{displayValue}</span>
        ) : (
          <span className="custom-field-empty">{displayValue}</span>
        );
    }
  };

  if (mode === 'display') {
    return (
      <div className="custom-field-display">
        <label className="custom-field-label">{definition.label}</label>
        <div className="custom-field-content">
          {renderDisplayValue()}
          {definition.helpText && (
            <span className="custom-field-help" title={definition.helpText}>
              ℹ️
            </span>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="custom-field-form-group">
      <label htmlFor={definition.name} className="custom-field-label">
        {definition.label}
        {definition.isRequired && <span className="required-indicator"> *</span>}
      </label>
      {renderFormInput()}
      {error && <span className="custom-field-error">{error}</span>}
      {definition.helpText && (
        <span className="custom-field-help-text">{definition.helpText}</span>
      )}
    </div>
  );
};

export default CustomFieldRenderer; 