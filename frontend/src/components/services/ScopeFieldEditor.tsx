import React, { useState, useEffect, useCallback } from 'react';
import { ScopeDefinitionField, ScopeFieldType, ScopeFieldFormData } from '../../types/service';
import './ScopeFieldEditor.css';

interface ScopeFieldEditorProps {
  field?: ScopeDefinitionField;
  existingFieldNames: string[];
  onSave: (field: ScopeDefinitionField) => void;
  onCancel: () => void;
  isEdit?: boolean;
}

/**
 * ScopeFieldEditor Component
 * Modal for adding/editing scope definition fields
 */
const ScopeFieldEditor: React.FC<ScopeFieldEditorProps> = ({
  field,
  existingFieldNames,
  onSave,
  onCancel,
  isEdit = false
}) => {
  // Form data state
  const [formData, setFormData] = useState<ScopeFieldFormData>({
    name: '',
    label: '',
    type: 'string',
    required: false,
    options: [],
    placeholder: '',
    description: '',
  });

  // UI state
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [optionInput, setOptionInput] = useState<string>('');

  /**
   * Initialize form data
   */
  useEffect(() => {
    if (field) {
      setFormData({
        name: field.name,
        label: field.label,
        type: field.type,
        required: field.required || false,
        options: field.options || [],
        min: field.min,
        max: field.max,
        minLength: field.minLength,
        maxLength: field.maxLength,
        placeholder: field.placeholder || '',
        description: field.description || '',
        default: field.default,
      });
    } else {
      // Reset for new field
      setFormData({
        name: '',
        label: '',
        type: 'string',
        required: false,
        options: [],
        placeholder: '',
        description: '',
      });
    }
    setErrors({});
    setOptionInput('');
  }, [field]);

  /**
   * Validate form data
   */
  const validateForm = useCallback((): boolean => {
    const newErrors: Record<string, string> = {};

    // Name validation
    if (!formData.name.trim()) {
      newErrors.name = 'Field name is required';
    } else if (!/^[a-zA-Z][a-zA-Z0-9_]*$/.test(formData.name)) {
      newErrors.name = 'Field name must start with a letter and contain only letters, numbers, and underscores';
    } else if (!isEdit && existingFieldNames.includes(formData.name)) {
      newErrors.name = 'Field name already exists';
    } else if (isEdit && field && formData.name !== field.name && existingFieldNames.includes(formData.name)) {
      newErrors.name = 'Field name already exists';
    }

    // Label validation
    if (!formData.label.trim()) {
      newErrors.label = 'Field label is required';
    }

    // Type-specific validation
    if (formData.type === 'select' && formData.options.length === 0) {
      newErrors.options = 'At least one option is required for select fields';
    }

    if (formData.type === 'number') {
      if (formData.min !== undefined && formData.max !== undefined && formData.min > formData.max) {
        newErrors.range = 'Minimum value cannot be greater than maximum value';
      }
    }

    if (formData.type === 'string' || formData.type === 'textarea') {
      if (formData.minLength !== undefined && formData.maxLength !== undefined && formData.minLength > formData.maxLength) {
        newErrors.length = 'Minimum length cannot be greater than maximum length';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }, [formData, existingFieldNames, isEdit, field]);

  /**
   * Handle form field changes
   */
  const handleFieldChange = useCallback((field: keyof ScopeFieldFormData, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    
    // Clear related errors
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  }, [errors]);

  /**
   * Handle type change and reset type-specific fields
   */
  const handleTypeChange = useCallback((newType: ScopeFieldType) => {
    setFormData(prev => ({
      ...prev,
      type: newType,
      options: newType === 'select' ? prev.options : [],
      min: newType === 'number' ? prev.min : undefined,
      max: newType === 'number' ? prev.max : undefined,
      minLength: (newType === 'string' || newType === 'textarea') ? prev.minLength : undefined,
      maxLength: (newType === 'string' || newType === 'textarea') ? prev.maxLength : undefined,
      default: undefined, // Reset default when type changes
    }));
    setErrors({});
  }, []);

  /**
   * Add option to select field
   */
  const addOption = useCallback(() => {
    const trimmedOption = optionInput.trim();
    if (trimmedOption && !formData.options.includes(trimmedOption)) {
      setFormData(prev => ({
        ...prev,
        options: [...prev.options, trimmedOption]
      }));
      setOptionInput('');
      if (errors.options) {
        setErrors(prev => ({ ...prev, options: '' }));
      }
    }
  }, [optionInput, formData.options, errors.options]);

  /**
   * Remove option from select field
   */
  const removeOption = useCallback((index: number) => {
    setFormData(prev => ({
      ...prev,
      options: prev.options.filter((_, i) => i !== index)
    }));
  }, []);

  /**
   * Handle form submission
   */
  const handleSubmit = useCallback((e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    // Create field object
    const fieldData: ScopeDefinitionField = {
      name: formData.name.trim(),
      label: formData.label.trim(),
      type: formData.type,
      required: formData.required,
    };

    // Add optional properties based on type
    if (formData.type === 'select' && formData.options.length > 0) {
      fieldData.options = formData.options;
    }

    if (formData.type === 'number') {
      if (formData.min !== undefined) fieldData.min = formData.min;
      if (formData.max !== undefined) fieldData.max = formData.max;
    }

    if (formData.type === 'string' || formData.type === 'textarea') {
      if (formData.minLength !== undefined) fieldData.minLength = formData.minLength;
      if (formData.maxLength !== undefined) fieldData.maxLength = formData.maxLength;
    }

    if (formData.placeholder?.trim()) {
      fieldData.placeholder = formData.placeholder.trim();
    }

    if (formData.description?.trim()) {
      fieldData.description = formData.description.trim();
    }

    if (formData.default !== undefined && formData.default !== null && formData.default !== '') {
      fieldData.default = formData.default;
    }

    onSave(fieldData);
  }, [formData, validateForm, onSave]);

  /**
   * Handle option input key press
   */
  const handleOptionKeyPress = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      addOption();
    }
  }, [addOption]);

  return (
    <div className="scope-field-editor-overlay">
      <div className="scope-field-editor">
        <div className="editor-header">
          <h2>{isEdit ? 'Edit Scope Parameter' : 'Add Scope Parameter'}</h2>
          <button onClick={onCancel} className="close-button">×</button>
        </div>

        <form onSubmit={handleSubmit} className="editor-form">
          {/* Basic Information */}
          <div className="form-section">
            <h3>Basic Information</h3>
            
            <div className="form-group">
              <label htmlFor="field-name">Field Name *</label>
              <input
                type="text"
                id="field-name"
                value={formData.name}
                onChange={(e) => handleFieldChange('name', e.target.value)}
                placeholder="e.g., edr_platform"
                className={errors.name ? 'error' : ''}
              />
              {errors.name && <span className="error-message">{errors.name}</span>}
              <small>Machine-readable name (letters, numbers, underscores only)</small>
            </div>

            <div className="form-group">
              <label htmlFor="field-label">Display Label *</label>
              <input
                type="text"
                id="field-label"
                value={formData.label}
                onChange={(e) => handleFieldChange('label', e.target.value)}
                placeholder="e.g., EDR Platform"
                className={errors.label ? 'error' : ''}
              />
              {errors.label && <span className="error-message">{errors.label}</span>}
              <small>Human-readable label shown in forms</small>
            </div>

            <div className="form-group">
              <label htmlFor="field-type">Field Type *</label>
              <select
                id="field-type"
                value={formData.type}
                onChange={(e) => handleTypeChange(e.target.value as ScopeFieldType)}
              >
                <option value="string">Text Input</option>
                <option value="number">Number Input</option>
                <option value="boolean">Yes/No Checkbox</option>
                <option value="select">Dropdown Selection</option>
                <option value="textarea">Long Text Area</option>
                <option value="date">Date Picker</option>
                <option value="email">Email Input</option>
                <option value="url">URL Input</option>
              </select>
            </div>

            <div className="form-group">
              <label className="checkbox-label">
                <input
                  type="checkbox"
                  checked={formData.required}
                  onChange={(e) => handleFieldChange('required', e.target.checked)}
                />
                Required Field
              </label>
            </div>
          </div>

          {/* Type-specific Configuration */}
          {formData.type === 'select' && (
            <div className="form-section">
              <h3>Dropdown Options</h3>
              
              <div className="form-group">
                <label>Add Options</label>
                <div className="option-input-group">
                  <input
                    type="text"
                    value={optionInput}
                    onChange={(e) => setOptionInput(e.target.value)}
                    onKeyPress={handleOptionKeyPress}
                    placeholder="Enter option value"
                  />
                  <button type="button" onClick={addOption} disabled={!optionInput.trim()}>
                    Add
                  </button>
                </div>
                {errors.options && <span className="error-message">{errors.options}</span>}
              </div>

              {formData.options.length > 0 && (
                <div className="options-list">
                  <label>Current Options:</label>
                  {formData.options.map((option, index) => (
                    <div key={index} className="option-item">
                      <span>{option}</span>
                      <button type="button" onClick={() => removeOption(index)}>
                        Remove
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {formData.type === 'number' && (
            <div className="form-section">
              <h3>Number Constraints</h3>
              
              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="field-min">Minimum Value</label>
                  <input
                    type="number"
                    id="field-min"
                    value={formData.min || ''}
                    onChange={(e) => handleFieldChange('min', e.target.value ? Number(e.target.value) : undefined)}
                    placeholder="No minimum"
                  />
                </div>
                <div className="form-group">
                  <label htmlFor="field-max">Maximum Value</label>
                  <input
                    type="number"
                    id="field-max"
                    value={formData.max || ''}
                    onChange={(e) => handleFieldChange('max', e.target.value ? Number(e.target.value) : undefined)}
                    placeholder="No maximum"
                  />
                </div>
              </div>
              {errors.range && <span className="error-message">{errors.range}</span>}
            </div>
          )}

          {(formData.type === 'string' || formData.type === 'textarea') && (
            <div className="form-section">
              <h3>Text Constraints</h3>
              
              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="field-min-length">Minimum Length</label>
                  <input
                    type="number"
                    id="field-min-length"
                    value={formData.minLength || ''}
                    onChange={(e) => handleFieldChange('minLength', e.target.value ? Number(e.target.value) : undefined)}
                    placeholder="No minimum"
                    min="0"
                  />
                </div>
                <div className="form-group">
                  <label htmlFor="field-max-length">Maximum Length</label>
                  <input
                    type="number"
                    id="field-max-length"
                    value={formData.maxLength || ''}
                    onChange={(e) => handleFieldChange('maxLength', e.target.value ? Number(e.target.value) : undefined)}
                    placeholder="No maximum"
                    min="1"
                  />
                </div>
              </div>
              {errors.length && <span className="error-message">{errors.length}</span>}
            </div>
          )}

          {/* Additional Properties */}
          <div className="form-section">
            <h3>Additional Properties</h3>
            
            <div className="form-group">
              <label htmlFor="field-placeholder">Placeholder Text</label>
              <input
                type="text"
                id="field-placeholder"
                value={formData.placeholder}
                onChange={(e) => handleFieldChange('placeholder', e.target.value)}
                placeholder="Hint text for users"
              />
            </div>

            <div className="form-group">
              <label htmlFor="field-description">Description/Help Text</label>
              <textarea
                id="field-description"
                value={formData.description}
                onChange={(e) => handleFieldChange('description', e.target.value)}
                placeholder="Additional information to help users understand this field"
                rows={3}
              />
            </div>

            <div className="form-group">
              <label htmlFor="field-default">Default Value</label>
              {formData.type === 'boolean' ? (
                <select
                  id="field-default"
                  value={formData.default === undefined ? '' : String(formData.default)}
                  onChange={(e) => handleFieldChange('default', e.target.value === '' ? undefined : e.target.value === 'true')}
                >
                  <option value="">No default</option>
                  <option value="true">Yes</option>
                  <option value="false">No</option>
                </select>
              ) : formData.type === 'select' ? (
                <select
                  id="field-default"
                  value={formData.default || ''}
                  onChange={(e) => handleFieldChange('default', e.target.value || undefined)}
                >
                  <option value="">No default</option>
                  {formData.options.map((option) => (
                    <option key={option} value={option}>{option}</option>
                  ))}
                </select>
              ) : formData.type === 'number' ? (
                <input
                  type="number"
                  id="field-default"
                  value={formData.default || ''}
                  onChange={(e) => handleFieldChange('default', e.target.value ? Number(e.target.value) : undefined)}
                  placeholder="Default value"
                />
              ) : (
                <input
                  type={formData.type === 'date' ? 'date' : formData.type === 'email' ? 'email' : formData.type === 'url' ? 'url' : 'text'}
                  id="field-default"
                  value={formData.default || ''}
                  onChange={(e) => handleFieldChange('default', e.target.value || undefined)}
                  placeholder="Default value"
                />
              )}
            </div>
          </div>

          {/* Form Actions */}
          <div className="form-actions">
            <button type="button" onClick={onCancel} className="cancel-button">
              Cancel
            </button>
            <button type="submit" className="save-button primary">
              {isEdit ? 'Update Parameter' : 'Add Parameter'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ScopeFieldEditor; 