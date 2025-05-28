import React, { useState, useEffect } from 'react';
import {
  CustomFieldDefinition,
  CustomFieldEntityType,
  CustomFieldType,
  CreateCustomFieldDefinitionDto,
  UpdateCustomFieldDefinitionDto,
  FIELD_TYPE_DISPLAY_NAMES,
  FIELD_TYPES_WITH_OPTIONS,
  VALIDATION_RULE_EXAMPLES,
} from '../../../types/customFields';
import './CustomFieldDefinitionForm.css';

interface CustomFieldDefinitionFormProps {
  initialData?: CustomFieldDefinition;
  entityType: CustomFieldEntityType;
  onSubmit: (data: CreateCustomFieldDefinitionDto | UpdateCustomFieldDefinitionDto) => Promise<void>;
  onCancel: () => void;
  loading?: boolean;
  error?: string | null;
  isEditMode?: boolean;
}

interface FormData {
  name: string;
  label: string;
  fieldType: CustomFieldType | '';
  selectOptions: string[];
  isRequired: boolean;
  displayOrder: number;
  placeholderText: string;
  helpText: string;
  validationRules: string;
  isActive: boolean;
}

interface FormErrors {
  name?: string;
  label?: string;
  fieldType?: string;
  selectOptions?: string;
  displayOrder?: string;
  validationRules?: string;
}

/**
 * CustomFieldDefinitionForm Component
 * Reusable form for creating and editing custom field definitions
 */
const CustomFieldDefinitionForm: React.FC<CustomFieldDefinitionFormProps> = ({
  initialData,
  entityType,
  onSubmit,
  onCancel,
  loading = false,
  error = null,
  isEditMode = false,
}) => {
  const [formData, setFormData] = useState<FormData>({
    name: '',
    label: '',
    fieldType: '',
    selectOptions: [],
    isRequired: false,
    displayOrder: 1,
    placeholderText: '',
    helpText: '',
    validationRules: '',
    isActive: true,
  });

  const [errors, setErrors] = useState<FormErrors>({});
  const [newOption, setNewOption] = useState<string>('');

  /**
   * Initialize form data from initial data
   */
  useEffect(() => {
    if (initialData) {
      setFormData({
        name: initialData.name,
        label: initialData.label,
        fieldType: initialData.fieldType,
        selectOptions: initialData.selectOptions || [],
        isRequired: initialData.isRequired,
        displayOrder: initialData.displayOrder,
        placeholderText: initialData.placeholderText || '',
        helpText: initialData.helpText || '',
        validationRules: initialData.validationRules ? JSON.stringify(initialData.validationRules, null, 2) : '',
        isActive: initialData.isActive,
      });
    }
  }, [initialData]);

  /**
   * Handle input changes
   */
  const handleInputChange = (field: keyof FormData, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    
    // Clear error for this field
    if (errors[field as keyof FormErrors]) {
      setErrors(prev => ({ ...prev, [field]: undefined }));
    }
  };

  /**
   * Generate machine name from label
   */
  const generateMachineName = (label: string): string => {
    return label
      .toLowerCase()
      .replace(/[^a-z0-9\s]/g, '')
      .replace(/\s+/g, '_')
      .replace(/^_+|_+$/g, '');
  };

  /**
   * Handle label change and auto-generate name if not in edit mode
   */
  const handleLabelChange = (label: string) => {
    handleInputChange('label', label);
    
    if (!isEditMode && label) {
      const generatedName = generateMachineName(label);
      handleInputChange('name', generatedName);
    }
  };

  /**
   * Handle field type change
   */
  const handleFieldTypeChange = (fieldType: CustomFieldType) => {
    handleInputChange('fieldType', fieldType);
    
    // Clear select options if field type doesn't support them
    if (!FIELD_TYPES_WITH_OPTIONS.includes(fieldType)) {
      handleInputChange('selectOptions', []);
    }
    
    // Set example validation rules
    if (VALIDATION_RULE_EXAMPLES[fieldType]) {
      handleInputChange('validationRules', VALIDATION_RULE_EXAMPLES[fieldType]);
    }
  };

  /**
   * Add new select option
   */
  const addSelectOption = () => {
    if (newOption.trim() && !formData.selectOptions.includes(newOption.trim())) {
      handleInputChange('selectOptions', [...formData.selectOptions, newOption.trim()]);
      setNewOption('');
    }
  };

  /**
   * Remove select option
   */
  const removeSelectOption = (index: number) => {
    const newOptions = formData.selectOptions.filter((_, i) => i !== index);
    handleInputChange('selectOptions', newOptions);
  };

  /**
   * Validate form data
   */
  const validateForm = (): boolean => {
    const newErrors: FormErrors = {};

    // Name validation
    if (!formData.name.trim()) {
      newErrors.name = 'Name is required';
    } else if (!/^[a-z0-9_]+$/.test(formData.name)) {
      newErrors.name = 'Name must contain only lowercase letters, numbers, and underscores';
    }

    // Label validation
    if (!formData.label.trim()) {
      newErrors.label = 'Label is required';
    }

    // Field type validation
    if (!formData.fieldType) {
      newErrors.fieldType = 'Field type is required';
    }

    // Select options validation
    if (FIELD_TYPES_WITH_OPTIONS.includes(formData.fieldType as CustomFieldType) && formData.selectOptions.length === 0) {
      newErrors.selectOptions = 'At least one option is required for select fields';
    }

    // Display order validation
    if (formData.displayOrder < 1) {
      newErrors.displayOrder = 'Display order must be at least 1';
    }

    // Validation rules validation
    if (formData.validationRules.trim()) {
      try {
        JSON.parse(formData.validationRules);
      } catch {
        newErrors.validationRules = 'Validation rules must be valid JSON';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  /**
   * Handle form submission
   */
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    try {
      const submitData: CreateCustomFieldDefinitionDto | UpdateCustomFieldDefinitionDto = {
        name: formData.name.trim(),
        label: formData.label.trim(),
        fieldType: formData.fieldType as CustomFieldType,
        isRequired: formData.isRequired,
        displayOrder: formData.displayOrder,
        placeholderText: formData.placeholderText.trim() || undefined,
        helpText: formData.helpText.trim() || undefined,
        isActive: formData.isActive,
      };

      // Add entity type for create mode
      if (!isEditMode) {
        (submitData as CreateCustomFieldDefinitionDto).entityType = entityType;
      }

      // Add select options if applicable
      if (FIELD_TYPES_WITH_OPTIONS.includes(formData.fieldType as CustomFieldType)) {
        submitData.selectOptions = formData.selectOptions;
      }

      // Add validation rules if provided
      if (formData.validationRules.trim()) {
        submitData.validationRules = JSON.parse(formData.validationRules);
      }

      await onSubmit(submitData);
    } catch (err) {
      console.error('Form submission error:', err);
    }
  };

  /**
   * Check if field type requires options
   */
  const requiresOptions = FIELD_TYPES_WITH_OPTIONS.includes(formData.fieldType as CustomFieldType);

  return (
    <div className="custom-field-definition-form">
      <form onSubmit={handleSubmit} className="form">
        {error && (
          <div className="error-message">
            <span className="error-icon">⚠️</span>
            {error}
          </div>
        )}

        <div className="form-section">
          <h3>Basic Information</h3>
          
          <div className="form-row">
            <div className="form-group">
              <label htmlFor="label" className="required">
                Field Label
              </label>
              <input
                type="text"
                id="label"
                value={formData.label}
                onChange={(e) => handleLabelChange(e.target.value)}
                placeholder="e.g., Internal Risk Score"
                className={errors.label ? 'error' : ''}
                disabled={loading}
              />
              {errors.label && <span className="field-error">{errors.label}</span>}
              <span className="field-help">The human-readable label shown to users</span>
            </div>

            <div className="form-group">
              <label htmlFor="name" className="required">
                Field Name (Machine Name)
              </label>
              <input
                type="text"
                id="name"
                value={formData.name}
                onChange={(e) => handleInputChange('name', e.target.value)}
                placeholder="e.g., internal_risk_score"
                className={errors.name ? 'error' : ''}
                disabled={loading || isEditMode}
                readOnly={isEditMode}
              />
              {errors.name && <span className="field-error">{errors.name}</span>}
              <span className="field-help">
                {isEditMode 
                  ? 'Machine name cannot be changed after creation'
                  : 'Lowercase letters, numbers, and underscores only'
                }
              </span>
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="fieldType" className="required">
              Field Type
            </label>
            <select
              id="fieldType"
              value={formData.fieldType}
              onChange={(e) => handleFieldTypeChange(e.target.value as CustomFieldType)}
              className={errors.fieldType ? 'error' : ''}
              disabled={loading}
            >
              <option value="">Select field type...</option>
              {Object.entries(FIELD_TYPE_DISPLAY_NAMES).map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
            {errors.fieldType && <span className="field-error">{errors.fieldType}</span>}
          </div>
        </div>

        {requiresOptions && (
          <div className="form-section">
            <h3>Select Options</h3>
            
            <div className="form-group">
              <label>Options</label>
              <div className="options-input">
                <div className="add-option">
                  <input
                    type="text"
                    value={newOption}
                    onChange={(e) => setNewOption(e.target.value)}
                    placeholder="Enter option text..."
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        addSelectOption();
                      }
                    }}
                    disabled={loading}
                  />
                  <button
                    type="button"
                    onClick={addSelectOption}
                    className="add-option-button"
                    disabled={!newOption.trim() || loading}
                  >
                    Add
                  </button>
                </div>
                
                {formData.selectOptions.length > 0 && (
                  <div className="options-list">
                    {formData.selectOptions.map((option, index) => (
                      <div key={index} className="option-item">
                        <span className="option-text">{option}</span>
                        <button
                          type="button"
                          onClick={() => removeSelectOption(index)}
                          className="remove-option-button"
                          disabled={loading}
                        >
                          ×
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
              {errors.selectOptions && <span className="field-error">{errors.selectOptions}</span>}
            </div>
          </div>
        )}

        <div className="form-section">
          <h3>Configuration</h3>
          
          <div className="form-row">
            <div className="form-group">
              <label htmlFor="displayOrder">
                Display Order
              </label>
              <input
                type="number"
                id="displayOrder"
                value={formData.displayOrder}
                onChange={(e) => handleInputChange('displayOrder', parseInt(e.target.value) || 1)}
                min="1"
                className={errors.displayOrder ? 'error' : ''}
                disabled={loading}
              />
              {errors.displayOrder && <span className="field-error">{errors.displayOrder}</span>}
              <span className="field-help">Order in which this field appears in forms</span>
            </div>

            <div className="form-group checkbox-group">
              <label className="checkbox-label">
                <input
                  type="checkbox"
                  checked={formData.isRequired}
                  onChange={(e) => handleInputChange('isRequired', e.target.checked)}
                  disabled={loading}
                />
                <span className="checkbox-text">Required Field</span>
              </label>
              <span className="field-help">Users must provide a value for this field</span>
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label htmlFor="placeholderText">
                Placeholder Text
              </label>
              <input
                type="text"
                id="placeholderText"
                value={formData.placeholderText}
                onChange={(e) => handleInputChange('placeholderText', e.target.value)}
                placeholder="e.g., Enter a value between 1-10"
                disabled={loading}
              />
              <span className="field-help">Hint text shown in empty form fields</span>
            </div>

            <div className="form-group">
              <label htmlFor="helpText">
                Help Text
              </label>
              <input
                type="text"
                id="helpText"
                value={formData.helpText}
                onChange={(e) => handleInputChange('helpText', e.target.value)}
                placeholder="e.g., Rate the client's risk level from 1 (low) to 10 (high)"
                disabled={loading}
              />
              <span className="field-help">Additional help text shown near the field</span>
            </div>
          </div>
        </div>

        <div className="form-section">
          <h3>Validation Rules</h3>
          
          <div className="form-group">
            <label htmlFor="validationRules">
              Validation Rules (JSON)
            </label>
            <textarea
              id="validationRules"
              value={formData.validationRules}
              onChange={(e) => handleInputChange('validationRules', e.target.value)}
              placeholder="Enter validation rules as JSON..."
              rows={4}
              className={errors.validationRules ? 'error' : ''}
              disabled={loading}
            />
            {errors.validationRules && <span className="field-error">{errors.validationRules}</span>}
            <span className="field-help">
              Optional JSON object defining validation rules (e.g., min/max values, patterns)
            </span>
          </div>
        </div>

        {isEditMode && (
          <div className="form-section">
            <h3>Status</h3>
            
            <div className="form-group checkbox-group">
              <label className="checkbox-label">
                <input
                  type="checkbox"
                  checked={formData.isActive}
                  onChange={(e) => handleInputChange('isActive', e.target.checked)}
                  disabled={loading}
                />
                <span className="checkbox-text">Active</span>
              </label>
              <span className="field-help">
                Inactive fields are hidden from forms but preserve existing data
              </span>
            </div>
          </div>
        )}

        <div className="form-actions">
          <button
            type="button"
            onClick={onCancel}
            className="cancel-button"
            disabled={loading}
          >
            Cancel
          </button>
          <button
            type="submit"
            className="submit-button primary-button"
            disabled={loading}
          >
            {loading ? 'Saving...' : (isEditMode ? 'Update Field' : 'Create Field')}
          </button>
        </div>
      </form>
    </div>
  );
};

export default CustomFieldDefinitionForm; 