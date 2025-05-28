import React from 'react';
import { CustomFieldEntityType } from '../../types/customFields';
import { useCustomFields } from '../../hooks/useCustomFields';
import CustomFieldRenderer from './CustomFieldRenderer';
import './CustomFieldRenderer.css';

interface CustomFieldsDisplayProps {
  entityType: CustomFieldEntityType;
  customFieldData?: Record<string, any>;
  title?: string;
  className?: string;
}

/**
 * CustomFieldsDisplay Component
 * Displays custom field values for an entity in a formatted layout
 */
const CustomFieldsDisplay: React.FC<CustomFieldsDisplayProps> = ({
  entityType,
  customFieldData = {},
  title = 'Additional Information',
  className = '',
}) => {
  const {
    definitions,
    loading,
    error,
    hasCustomFields,
  } = useCustomFields({
    entityType,
    initialValues: customFieldData,
    mode: 'display',
  });

  // Don't render if there are no custom fields defined
  if (!hasCustomFields && !loading) {
    return null;
  }

  // Don't render if no custom field data exists
  const hasData = definitions.some(def => {
    const value = customFieldData[def.name];
    return value !== null && value !== undefined && value !== '' && 
           !(Array.isArray(value) && value.length === 0);
  });

  if (!hasData && !loading) {
    return null;
  }

  if (loading) {
    return (
      <div className={`custom-fields-display-section ${className}`}>
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
      <div className={`custom-fields-display-section ${className}`}>
        <h3>{title}</h3>
        <div className="custom-fields-error">
          Failed to load custom fields: {error}
        </div>
      </div>
    );
  }

  return (
    <div className={`custom-fields-display-section ${className}`}>
      <h3>{title}</h3>
      <div className="custom-fields-display-grid">
        {definitions.map((definition) => {
          const value = customFieldData[definition.name];
          
          // Only render fields that have values
          if (value === null || value === undefined || value === '' || 
              (Array.isArray(value) && value.length === 0)) {
            return null;
          }

          return (
            <CustomFieldRenderer
              key={definition.id}
              definition={definition}
              value={value}
              mode="display"
            />
          );
        })}
      </div>
    </div>
  );
};

export default CustomFieldsDisplay; 