import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { 
  CustomFieldDefinition,
  ENTITY_TYPE_DISPLAY_NAMES,
  UpdateCustomFieldDefinitionDto 
} from '../../../types/customFields';
import { ApiError } from '../../../types/auth';
import { apiService } from '../../../services/apiService';
import CustomFieldDefinitionForm from '../../../components/admin/custom-fields/CustomFieldDefinitionForm';
import './AdminCustomFieldEditPage.css';

/**
 * AdminCustomFieldEditPage Component
 * Page for editing existing custom field definitions
 */
const AdminCustomFieldEditPage: React.FC = () => {
  const { definitionId } = useParams<{ definitionId: string }>();
  const navigate = useNavigate();
  
  const [customField, setCustomField] = useState<CustomFieldDefinition | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  /**
   * Fetch custom field definition details
   */
  const fetchCustomField = useCallback(async () => {
    if (!definitionId) {
      setError('Custom field definition ID is required');
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      
      const fieldData = await apiService.getCustomFieldDefinition(definitionId);
      setCustomField(fieldData);
    } catch (err) {
      const apiError = err as ApiError;
      
      if (apiError.statusCode === 404) {
        setError('Custom field definition not found');
      } else {
        setError(apiError.message || 'Failed to load custom field definition');
      }
      
      console.error('Error fetching custom field definition:', err);
    } finally {
      setLoading(false);
    }
  }, [definitionId]);

  /**
   * Load custom field when component mounts
   */
  useEffect(() => {
    fetchCustomField();
  }, [fetchCustomField]);

  /**
   * Handle form submission
   */
  const handleSubmit = async (data: UpdateCustomFieldDefinitionDto) => {
    if (!definitionId) return;

    try {
      setSubmitting(true);
      setError(null);
      
      const updatedField = await apiService.updateCustomFieldDefinition(definitionId, data);
      setCustomField(updatedField);
      
      // Navigate back to the entity-specific page
      navigate(`/admin/settings/custom-fields/${updatedField.entityType}`);
    } catch (err) {
      const apiError = err as ApiError;
      
      if (apiError.statusCode === 409) {
        setError('A custom field with this name already exists for this entity type.');
      } else if (apiError.statusCode === 400) {
        setError('Please check your input and try again.');
      } else if (apiError.statusCode === 404) {
        setError('Custom field definition not found.');
      } else {
        setError(apiError.message || 'Failed to update custom field definition');
      }
      
      console.error('Error updating custom field definition:', err);
    } finally {
      setSubmitting(false);
    }
  };

  /**
   * Handle cancel action
   */
  const handleCancel = () => {
    if (customField) {
      navigate(`/admin/settings/custom-fields/${customField.entityType}`);
    } else {
      navigate('/admin/settings/custom-fields');
    }
  };

  if (loading) {
    return (
      <div className="admin-custom-field-edit-page">
        <div className="loading-container">
          <div className="loading-spinner"></div>
          <p>Loading custom field definition...</p>
        </div>
      </div>
    );
  }

  if (error && !customField) {
    return (
      <div className="admin-custom-field-edit-page">
        <div className="error-container">
          <h3>Error Loading Custom Field</h3>
          <p>{error}</p>
          <div className="error-actions">
            <button onClick={fetchCustomField} className="retry-button">
              Try Again
            </button>
            <Link to="/admin/settings/custom-fields" className="back-button">
              ← Back to Custom Fields
            </Link>
          </div>
        </div>
      </div>
    );
  }

  if (!customField) {
    return (
      <div className="admin-custom-field-edit-page">
        <div className="error-container">
          <h3>Custom Field Not Found</h3>
          <p>The requested custom field definition could not be found.</p>
          <Link to="/admin/settings/custom-fields" className="back-button">
            ← Back to Custom Fields
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="admin-custom-field-edit-page">
      <div className="page-header">
        <div className="breadcrumb">
          <Link to="/admin/settings/custom-fields">Custom Fields</Link>
          <span className="separator">›</span>
          <Link to={`/admin/settings/custom-fields/${customField.entityType}`}>
            {ENTITY_TYPE_DISPLAY_NAMES[customField.entityType]}
          </Link>
          <span className="separator">›</span>
          <span className="current">Edit {customField.label}</span>
        </div>
        
        <div className="header-content">
          <h1>Edit Custom Field</h1>
          <p className="page-description">
            Modify the custom field definition for {ENTITY_TYPE_DISPLAY_NAMES[customField.entityType].toLowerCase()} entities.
          </p>
        </div>
      </div>

      <div className="form-container">
        <CustomFieldDefinitionForm
          initialData={customField}
          entityType={customField.entityType}
          onSubmit={handleSubmit}
          onCancel={handleCancel}
          loading={submitting}
          error={error}
          isEditMode={true}
        />
      </div>
    </div>
  );
};

export default AdminCustomFieldEditPage; 