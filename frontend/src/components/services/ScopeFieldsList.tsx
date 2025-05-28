import React from 'react';
import { ScopeDefinitionField } from '../../types/service';
import './ScopeFieldsList.css';

interface ScopeFieldsListProps {
  fields: ScopeDefinitionField[];
  onEdit: (index: number) => void;
  onDelete: (index: number) => void;
  onMoveUp: (index: number) => void;
  onMoveDown: (index: number) => void;
}

/**
 * ScopeFieldsList Component
 * Displays a list of scope definition fields with management actions
 */
const ScopeFieldsList: React.FC<ScopeFieldsListProps> = ({
  fields,
  onEdit,
  onDelete,
  onMoveUp,
  onMoveDown
}) => {
  /**
   * Get display text for field type
   */
  const getFieldTypeDisplay = (type: string): string => {
    const typeMap: Record<string, string> = {
      string: 'Text',
      number: 'Number',
      boolean: 'Yes/No',
      select: 'Dropdown',
      textarea: 'Long Text',
      date: 'Date',
      email: 'Email',
      url: 'URL'
    };
    return typeMap[type] || type;
  };

  /**
   * Get field type icon
   */
  const getFieldTypeIcon = (type: string): string => {
    const iconMap: Record<string, string> = {
      string: '📝',
      number: '🔢',
      boolean: '☑️',
      select: '📋',
      textarea: '📄',
      date: '📅',
      email: '📧',
      url: '🔗'
    };
    return iconMap[type] || '❓';
  };

  /**
   * Format options for display
   */
  const formatOptions = (options?: string[]): string => {
    if (!options || options.length === 0) return 'N/A';
    if (options.length <= 3) return options.join(', ');
    return `${options.slice(0, 3).join(', ')} (+${options.length - 3} more)`;
  };

  return (
    <div className="scope-fields-list">
      {fields.map((field, index) => (
        <div key={`${field.name}-${index}`} className="field-item">
          <div className="field-content">
            <div className="field-header">
              <div className="field-title">
                <span className="field-icon">{getFieldTypeIcon(field.type)}</span>
                <div className="field-names">
                  <h4 className="field-label">{field.label}</h4>
                  <span className="field-name">({field.name})</span>
                </div>
              </div>
              <div className="field-badges">
                <span className="field-type-badge">{getFieldTypeDisplay(field.type)}</span>
                {field.required && <span className="required-badge">Required</span>}
              </div>
            </div>

            <div className="field-details">
              {field.description && (
                <p className="field-description">{field.description}</p>
              )}
              
              <div className="field-properties">
                {field.type === 'select' && field.options && (
                  <div className="property">
                    <strong>Options:</strong> {formatOptions(field.options)}
                  </div>
                )}
                
                {field.type === 'number' && (field.min !== undefined || field.max !== undefined) && (
                  <div className="property">
                    <strong>Range:</strong> 
                    {field.min !== undefined && ` Min: ${field.min}`}
                    {field.max !== undefined && ` Max: ${field.max}`}
                  </div>
                )}
                
                {(field.type === 'string' || field.type === 'textarea') && 
                 (field.minLength !== undefined || field.maxLength !== undefined) && (
                  <div className="property">
                    <strong>Length:</strong>
                    {field.minLength !== undefined && ` Min: ${field.minLength}`}
                    {field.maxLength !== undefined && ` Max: ${field.maxLength}`}
                  </div>
                )}
                
                {field.placeholder && (
                  <div className="property">
                    <strong>Placeholder:</strong> {field.placeholder}
                  </div>
                )}
                
                {field.default !== undefined && field.default !== null && field.default !== '' && (
                  <div className="property">
                    <strong>Default:</strong> {String(field.default)}
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="field-actions">
            <div className="reorder-actions">
              <button
                onClick={() => onMoveUp(index)}
                disabled={index === 0}
                className="reorder-button"
                title="Move up"
              >
                ↑
              </button>
              <button
                onClick={() => onMoveDown(index)}
                disabled={index === fields.length - 1}
                className="reorder-button"
                title="Move down"
              >
                ↓
              </button>
            </div>
            
            <div className="main-actions">
              <button
                onClick={() => onEdit(index)}
                className="edit-button"
                title="Edit field"
              >
                Edit
              </button>
              <button
                onClick={() => onDelete(index)}
                className="delete-button"
                title="Delete field"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

export default ScopeFieldsList; 