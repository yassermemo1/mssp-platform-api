import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { 
  CustomFieldDefinition, 
  CustomFieldEntityType, 
  ENTITY_TYPE_DISPLAY_NAMES,
  FIELD_TYPE_DISPLAY_NAMES 
} from '../../../types/customFields';
import { ApiError } from '../../../types/auth';
import { apiService } from '../../../services/apiService';
import ConfirmationModal from '../../../components/common/ConfirmationModal';
import './AdminCustomFieldsEntityPage.css';

/**
 * AdminCustomFieldsEntityPage Component
 * Displays and manages custom field definitions for a specific entity type
 */
const AdminCustomFieldsEntityPage: React.FC = () => {
  const { entityType } = useParams<{ entityType: string }>();
  const navigate = useNavigate();
  
  const [customFields, setCustomFields] = useState<CustomFieldDefinition[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [confirmModal, setConfirmModal] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    onConfirm: () => void;
    confirmText?: string;
    confirmVariant?: 'danger' | 'primary';
  }>({
    isOpen: false,
    title: '',
    message: '',
    onConfirm: () => {},
  });

  // Validate entity type
  const isValidEntityType = entityType && Object.values(CustomFieldEntityType).includes(entityType as CustomFieldEntityType);
  const currentEntityType = entityType as CustomFieldEntityType;

  /**
   * Fetch custom field definitions for the entity type
   */
  const fetchCustomFields = useCallback(async () => {
    if (!isValidEntityType) {
      setError('Invalid entity type');
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      
      const response = await apiService.getCustomFieldDefinitions({
        entityType: currentEntityType,
      });
      
      // Sort by display order, then by creation date
      const sortedFields = response.data.sort((a, b) => {
        if (a.displayOrder !== b.displayOrder) {
          return a.displayOrder - b.displayOrder;
        }
        return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
      });
      
      setCustomFields(sortedFields);
    } catch (err) {
      const apiError = err as ApiError;
      setError(apiError.message || 'Failed to load custom field definitions');
      console.error('Error fetching custom fields:', err);
    } finally {
      setLoading(false);
    }
  }, [currentEntityType, isValidEntityType]);

  /**
   * Load custom fields when component mounts or entity type changes
   */
  useEffect(() => {
    fetchCustomFields();
  }, [fetchCustomFields]);

  /**
   * Handle activate/deactivate field
   */
  const handleToggleActive = async (field: CustomFieldDefinition) => {
    const action = field.isActive ? 'deactivate' : 'activate';
    const actionText = field.isActive ? 'Deactivate' : 'Activate';
    
    setConfirmModal({
      isOpen: true,
      title: `${actionText} Custom Field`,
      message: `Are you sure you want to ${action} the field "${field.label}"? ${
        field.isActive 
          ? 'This will hide the field from forms but preserve existing data.' 
          : 'This will make the field available in forms again.'
      }`,
      confirmText: actionText,
      confirmVariant: field.isActive ? 'danger' : 'primary',
      onConfirm: () => performToggleActive(field),
    });
  };

  /**
   * Perform the activate/deactivate action
   */
  const performToggleActive = async (field: CustomFieldDefinition) => {
    try {
      setActionLoading(field.id);
      
      if (field.isActive) {
        await apiService.deactivateCustomFieldDefinition(field.id);
      } else {
        await apiService.activateCustomFieldDefinition(field.id);
      }
      
      // Refresh the list
      await fetchCustomFields();
    } catch (err) {
      const apiError = err as ApiError;
      setError(apiError.message || `Failed to ${field.isActive ? 'deactivate' : 'activate'} field`);
      console.error('Error toggling field status:', err);
    } finally {
      setActionLoading(null);
      setConfirmModal(prev => ({ ...prev, isOpen: false }));
    }
  };

  /**
   * Handle delete field
   */
  const handleDeleteField = (field: CustomFieldDefinition) => {
    setConfirmModal({
      isOpen: true,
      title: 'Delete Custom Field',
      message: `Are you sure you want to delete the field "${field.label}"? This action cannot be undone and will remove all associated data.`,
      confirmText: 'Delete',
      confirmVariant: 'danger',
      onConfirm: () => performDeleteField(field),
    });
  };

  /**
   * Perform the delete action
   */
  const performDeleteField = async (field: CustomFieldDefinition) => {
    try {
      setActionLoading(field.id);
      
      await apiService.deleteCustomFieldDefinition(field.id);
      
      // Refresh the list
      await fetchCustomFields();
    } catch (err) {
      const apiError = err as ApiError;
      setError(apiError.message || 'Failed to delete field');
      console.error('Error deleting field:', err);
    } finally {
      setActionLoading(null);
      setConfirmModal(prev => ({ ...prev, isOpen: false }));
    }
  };

  /**
   * Get status badge component
   */
  const getStatusBadge = (isActive: boolean) => (
    <span className={`status-badge ${isActive ? 'active' : 'inactive'}`}>
      {isActive ? 'Active' : 'Inactive'}
    </span>
  );

  /**
   * Get required badge component
   */
  const getRequiredBadge = (isRequired: boolean) => (
    isRequired ? <span className="required-badge">Required</span> : null
  );

  if (!isValidEntityType) {
    return (
      <div className="admin-custom-fields-entity-page">
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
    <div className="admin-custom-fields-entity-page">
      <div className="page-header">
        <div className="breadcrumb">
          <Link to="/admin/settings/custom-fields">Custom Fields</Link>
          <span className="separator">›</span>
          <span className="current">{ENTITY_TYPE_DISPLAY_NAMES[currentEntityType]}</span>
        </div>
        
        <div className="header-content">
          <h1>{ENTITY_TYPE_DISPLAY_NAMES[currentEntityType]} Custom Fields</h1>
          <p className="page-description">
            Manage custom field definitions for {ENTITY_TYPE_DISPLAY_NAMES[currentEntityType].toLowerCase()} entities.
          </p>
        </div>

        <div className="header-actions">
          <button
            onClick={() => navigate(`/admin/settings/custom-fields/${currentEntityType}/new`)}
            className="add-field-button primary-button"
          >
            + Add New Field
          </button>
        </div>
      </div>

      {error && (
        <div className="error-message">
          <span className="error-icon">⚠️</span>
          {error}
          <button onClick={() => setError(null)} className="dismiss-error">×</button>
        </div>
      )}

      {loading ? (
        <div className="loading-container">
          <div className="loading-spinner"></div>
          <p>Loading custom field definitions...</p>
        </div>
      ) : (
        <div className="fields-content">
          {customFields.length === 0 ? (
            <div className="empty-state">
              <div className="empty-icon">📝</div>
              <h3>No Custom Fields Defined</h3>
              <p>
                No custom fields have been defined for {ENTITY_TYPE_DISPLAY_NAMES[currentEntityType].toLowerCase()} entities yet.
              </p>
              <button
                onClick={() => navigate(`/admin/settings/custom-fields/${currentEntityType}/new`)}
                className="primary-button"
              >
                Create First Field
              </button>
            </div>
          ) : (
            <div className="fields-table-container">
              <table className="fields-table">
                <thead>
                  <tr>
                    <th>Order</th>
                    <th>Label</th>
                    <th>Name</th>
                    <th>Type</th>
                    <th>Status</th>
                    <th>Required</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {customFields.map((field) => (
                    <tr key={field.id} className={!field.isActive ? 'inactive-row' : ''}>
                      <td className="order-cell">{field.displayOrder}</td>
                      <td className="label-cell">
                        <div className="field-label">
                          {field.label}
                          {field.helpText && (
                            <span className="help-indicator" title={field.helpText}>?</span>
                          )}
                        </div>
                      </td>
                      <td className="name-cell">
                        <code>{field.name}</code>
                      </td>
                      <td className="type-cell">
                        {FIELD_TYPE_DISPLAY_NAMES[field.fieldType]}
                      </td>
                      <td className="status-cell">
                        {getStatusBadge(field.isActive)}
                      </td>
                      <td className="required-cell">
                        {getRequiredBadge(field.isRequired)}
                      </td>
                      <td className="actions-cell">
                        <div className="action-buttons">
                          <button
                            onClick={() => navigate(`/admin/settings/custom-fields/edit/${field.id}`)}
                            className="edit-button"
                            title="Edit field"
                          >
                            ✏️
                          </button>
                          <button
                            onClick={() => handleToggleActive(field)}
                            className={`toggle-button ${field.isActive ? 'deactivate' : 'activate'}`}
                            disabled={actionLoading === field.id}
                            title={field.isActive ? 'Deactivate field' : 'Activate field'}
                          >
                            {actionLoading === field.id ? '⏳' : (field.isActive ? '🔒' : '🔓')}
                          </button>
                          <button
                            onClick={() => handleDeleteField(field)}
                            className="delete-button"
                            disabled={actionLoading === field.id}
                            title="Delete field"
                          >
                            🗑️
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      <ConfirmationModal
        isOpen={confirmModal.isOpen}
        title={confirmModal.title}
        message={confirmModal.message}
        onConfirm={confirmModal.onConfirm}
        onCancel={() => setConfirmModal(prev => ({ ...prev, isOpen: false }))}
        confirmText={confirmModal.confirmText}
        confirmVariant={confirmModal.confirmVariant}
      />
    </div>
  );
};

export default AdminCustomFieldsEntityPage; 