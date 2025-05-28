import React, { useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { 
  CustomFieldEntityType, 
  ENTITY_TYPE_DISPLAY_NAMES,
  CreateCustomFieldDefinitionDto 
} from '../../../types/customFields';
import { ApiError } from '../../../types/auth';
import { apiService } from '../../../services/apiService';
import CustomFieldDefinitionForm from '../../../components/admin/custom-fields/CustomFieldDefinitionForm';
import './AdminCustomFieldCreatePage.css';

/**
 * AdminCustomFieldCreatePage Component
 * Page for creating new custom field definitions
 */
const AdminCustomFieldCreatePage: React.FC = () => {
  const { entityType } = useParams<{ entityType: string }>();
  const navigate = useNavigate();
  
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // Validate entity type
  const isValidEntityType = entityType && Object.values(CustomFieldEntityType).includes(entityType as CustomFieldEntityType);
  const currentEntityType = entityType as CustomFieldEntityType;

  /**
   * Handle form submission
   */
  const handleSubmit = async (data: CreateCustomFieldDefinitionDto) => {
    try {
      setLoading(true);
      setError(null);
      
      await apiService.createCustomFieldDefinition(data);
      
      // Navigate back to the entity-specific page
      navigate(`/admin/settings/custom-fields/${currentEntityType}`);
    } catch (err) {
      const apiError = err as ApiError;
      
      if (apiError.statusCode === 409) {
        setError('A custom field with this name already exists for this entity type.');
      } else if (apiError.statusCode === 400) {
        setError('Please check your input and try again.');
      } else {
        setError(apiError.message || 'Failed to create custom field definition');
      }
      
      console.error('Error creating custom field definition:', err);
    } finally {
      setLoading(false);
    }
  };

  /**
   * Handle cancel action
   */
  const handleCancel = () => {
    navigate(`/admin/settings/custom-fields/${currentEntityType}`);
  };

  if (!isValidEntityType) {
    return (
      <div className="admin-custom-field-create-page">
        <div className="error-container">
          <h3>Invalid Entity Type</h3>
          <p>The specified entity type is not valid.</p>
          <Link to="/admin/settings/custom-fields" className="back-button">
            ← Back to Custom Fields
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="admin-custom-field-create-page">
      <div className="page-header">
        <div className="breadcrumb">
          <Link to="/admin/settings/custom-fields">Custom Fields</Link>
          <span className="separator">›</span>
          <Link to={`/admin/settings/custom-fields/${currentEntityType}`}>
            {ENTITY_TYPE_DISPLAY_NAMES[currentEntityType]}
          </Link>
          <span className="separator">›</span>
          <span className="current">New Field</span>
        </div>
        
        <div className="header-content">
          <h1>Create Custom Field</h1>
          <p className="page-description">
            Define a new custom field for {ENTITY_TYPE_DISPLAY_NAMES[currentEntityType].toLowerCase()} entities.
          </p>
        </div>
      </div>

      <div className="form-container">
        <CustomFieldDefinitionForm
          entityType={currentEntityType}
          onSubmit={handleSubmit}
          onCancel={handleCancel}
          loading={loading}
          error={error}
          isEditMode={false}
        />
      </div>
    </div>
  );
};

export default AdminCustomFieldCreatePage; 