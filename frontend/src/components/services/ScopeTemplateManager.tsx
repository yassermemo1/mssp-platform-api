import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  Service, 
  ScopeDefinitionTemplate, 
  ScopeDefinitionField, 
  ScopeTemplateUIState,
  UpdateScopeDefinitionTemplateDto 
} from '../../types/service';
import { ApiError, UserRole } from '../../types/auth';
import { apiService } from '../../services/apiService';
import { useAuth } from '../../contexts/AuthContext';
import ScopeFieldEditor from './ScopeFieldEditor';
import ScopeFieldsList from './ScopeFieldsList';
import ConfirmationModal from '../common/ConfirmationModal';
import Toast from '../common/Toast';
import './ScopeTemplateManager.css';

/**
 * ScopeTemplateManager Component
 * Main component for managing scope definition templates for services
 * Allows admins to define dynamic form structures for service scope configuration
 */
const ScopeTemplateManager: React.FC = () => {
  const { serviceId } = useParams<{ serviceId: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();

  // Service data
  const [service, setService] = useState<Service | null>(null);
  const [template, setTemplate] = useState<ScopeDefinitionTemplate>({
    fields: [],
    version: '1.0',
    description: ''
  });

  // UI state
  const [uiState, setUIState] = useState<ScopeTemplateUIState>({
    isLoading: true,
    isSaving: false,
    error: null,
    hasUnsavedChanges: false,
    editingFieldIndex: null,
    showAddFieldModal: false,
    showDeleteConfirmation: false,
    fieldToDelete: null
  });

  // Toast state
  const [toast, setToast] = useState<{
    isVisible: boolean;
    message: string;
    type: 'success' | 'error' | 'info' | 'warning';
  }>({
    isVisible: false,
    message: '',
    type: 'success'
  });

  /**
   * Check if user has permission to manage scope templates
   */
  const canManageTemplate = (): boolean => {
    if (!user) return false;
    return [UserRole.ADMIN, UserRole.MANAGER].includes(user.role);
  };

  /**
   * Show toast notification
   */
  const showToast = useCallback((message: string, type: 'success' | 'error' | 'info' | 'warning' = 'success') => {
    setToast({ isVisible: true, message, type });
  }, []);

  /**
   * Hide toast notification
   */
  const hideToast = useCallback(() => {
    setToast(prev => ({ ...prev, isVisible: false }));
  }, []);

  /**
   * Update UI state
   */
  const updateUIState = useCallback((updates: Partial<ScopeTemplateUIState>) => {
    setUIState(prev => ({ ...prev, ...updates }));
  }, []);

  /**
   * Fetch service details and scope template
   */
  const fetchServiceAndTemplate = useCallback(async () => {
    if (!serviceId) {
      updateUIState({ error: 'Service ID is required', isLoading: false });
      return;
    }

    try {
      updateUIState({ isLoading: true, error: null });

      // Fetch service details
      const serviceResponse = await apiService.getService(serviceId);
      setService(serviceResponse.data);

      // Fetch scope template
      const templateResponse = await apiService.getScopeDefinitionTemplate(serviceId);
      const existingTemplate = templateResponse.data.scopeDefinitionTemplate;

      if (existingTemplate) {
        setTemplate(existingTemplate);
      } else {
        // Initialize with empty template
        setTemplate({
          fields: [],
          version: '1.0',
          description: `Scope definition template for ${serviceResponse.data.name}`
        });
      }

      updateUIState({ isLoading: false });
    } catch (err) {
      const apiError = err as ApiError;
      updateUIState({ 
        error: apiError.message || 'Failed to load service and template', 
        isLoading: false 
      });
      console.error('Error fetching service and template:', err);
    }
  }, [serviceId, updateUIState]);

  /**
   * Save scope template
   */
  const saveTemplate = useCallback(async () => {
    if (!serviceId || !canManageTemplate()) return;

    try {
      updateUIState({ isSaving: true, error: null });

      const updateData: UpdateScopeDefinitionTemplateDto = {
        scopeDefinitionTemplate: template
      };

      await apiService.updateScopeDefinitionTemplate(serviceId, updateData);
      
      updateUIState({ 
        isSaving: false, 
        hasUnsavedChanges: false 
      });
      
      showToast('Scope template saved successfully!', 'success');
    } catch (err) {
      const apiError = err as ApiError;
      updateUIState({ 
        isSaving: false, 
        error: apiError.message || 'Failed to save template' 
      });
      showToast('Failed to save scope template', 'error');
      console.error('Error saving template:', err);
    }
  }, [serviceId, template, canManageTemplate, updateUIState, showToast]);

  /**
   * Add new field to template
   */
  const addField = useCallback((field: ScopeDefinitionField) => {
    setTemplate(prev => ({
      ...prev,
      fields: [...prev.fields, field]
    }));
    updateUIState({ 
      hasUnsavedChanges: true, 
      showAddFieldModal: false 
    });
    showToast('Field added successfully', 'success');
  }, [updateUIState, showToast]);

  /**
   * Update existing field in template
   */
  const updateField = useCallback((index: number, field: ScopeDefinitionField) => {
    setTemplate(prev => ({
      ...prev,
      fields: prev.fields.map((f, i) => i === index ? field : f)
    }));
    updateUIState({ 
      hasUnsavedChanges: true, 
      editingFieldIndex: null 
    });
    showToast('Field updated successfully', 'success');
  }, [updateUIState, showToast]);

  /**
   * Remove field from template
   */
  const removeField = useCallback((index: number) => {
    setTemplate(prev => ({
      ...prev,
      fields: prev.fields.filter((_, i) => i !== index)
    }));
    updateUIState({ 
      hasUnsavedChanges: true,
      showDeleteConfirmation: false,
      fieldToDelete: null
    });
    showToast('Field removed successfully', 'success');
  }, [updateUIState, showToast]);

  /**
   * Move field up in the list
   */
  const moveFieldUp = useCallback((index: number) => {
    if (index === 0) return;
    
    setTemplate(prev => {
      const newFields = [...prev.fields];
      [newFields[index - 1], newFields[index]] = [newFields[index], newFields[index - 1]];
      return { ...prev, fields: newFields };
    });
    updateUIState({ hasUnsavedChanges: true });
  }, [updateUIState]);

  /**
   * Move field down in the list
   */
  const moveFieldDown = useCallback((index: number) => {
    setTemplate(prev => {
      if (index === prev.fields.length - 1) return prev;
      
      const newFields = [...prev.fields];
      [newFields[index], newFields[index + 1]] = [newFields[index + 1], newFields[index]];
      return { ...prev, fields: newFields };
    });
    updateUIState({ hasUnsavedChanges: true });
  }, [updateUIState]);

  /**
   * Update template metadata
   */
  const updateTemplateMetadata = useCallback((updates: Partial<ScopeDefinitionTemplate>) => {
    setTemplate(prev => ({ ...prev, ...updates }));
    updateUIState({ hasUnsavedChanges: true });
  }, [updateUIState]);

  // Load data on component mount
  useEffect(() => {
    fetchServiceAndTemplate();
  }, [fetchServiceAndTemplate]);

  // Check permissions
  if (!canManageTemplate()) {
    return (
      <div className="scope-template-manager">
        <div className="permission-denied">
          <h2>Access Denied</h2>
          <p>You don't have permission to manage scope definition templates.</p>
          <button onClick={() => navigate(-1)} className="back-button">
            Go Back
          </button>
        </div>
      </div>
    );
  }

  if (uiState.isLoading) {
    return (
      <div className="scope-template-manager">
        <div className="loading-container">
          <div className="loading-spinner"></div>
          <p>Loading service and scope template...</p>
        </div>
      </div>
    );
  }

  if (uiState.error && !service) {
    return (
      <div className="scope-template-manager">
        <div className="error-container">
          <h2>Error</h2>
          <p>{uiState.error}</p>
          <button onClick={fetchServiceAndTemplate} className="retry-button">
            Retry
          </button>
          <button onClick={() => navigate(-1)} className="back-button">
            Go Back
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="scope-template-manager">
      {/* Header */}
      <div className="template-header">
        <div className="header-left">
          <h1>Scope Definition Template</h1>
          <div className="service-info">
            <h2>{service?.name}</h2>
            <span className="service-category">{service?.category}</span>
          </div>
        </div>
        <div className="header-actions">
          <button 
            onClick={() => navigate(-1)} 
            className="back-button"
          >
            Back to Service
          </button>
          <button 
            onClick={saveTemplate}
            disabled={!uiState.hasUnsavedChanges || uiState.isSaving}
            className="save-button primary"
          >
            {uiState.isSaving ? 'Saving...' : 'Save Template'}
          </button>
        </div>
      </div>

      {/* Template Metadata */}
      <div className="template-metadata">
        <div className="metadata-field">
          <label htmlFor="template-description">Template Description</label>
          <textarea
            id="template-description"
            value={template.description || ''}
            onChange={(e) => updateTemplateMetadata({ description: e.target.value })}
            placeholder="Describe what this template is used for..."
            rows={2}
          />
        </div>
        <div className="metadata-field">
          <label htmlFor="template-version">Version</label>
          <input
            type="text"
            id="template-version"
            value={template.version || ''}
            onChange={(e) => updateTemplateMetadata({ version: e.target.value })}
            placeholder="1.0"
          />
        </div>
      </div>

      {/* Fields Management */}
      <div className="template-content">
        <div className="fields-section">
          <div className="section-header">
            <h3>Scope Parameters ({template.fields.length})</h3>
            <button 
              onClick={() => updateUIState({ showAddFieldModal: true })}
              className="add-field-button primary"
            >
              Add Parameter
            </button>
          </div>

          {template.fields.length === 0 ? (
            <div className="empty-state">
              <p>No scope parameters defined yet.</p>
              <p>Click "Add Parameter" to create your first scope field.</p>
            </div>
          ) : (
            <ScopeFieldsList
              fields={template.fields}
              onEdit={(index) => updateUIState({ editingFieldIndex: index })}
              onDelete={(index) => updateUIState({ 
                showDeleteConfirmation: true, 
                fieldToDelete: index 
              })}
              onMoveUp={moveFieldUp}
              onMoveDown={moveFieldDown}
            />
          )}
        </div>
      </div>

      {/* Field Editor Modal */}
      {(uiState.showAddFieldModal || uiState.editingFieldIndex !== null) && (
        <ScopeFieldEditor
          field={uiState.editingFieldIndex !== null ? template.fields[uiState.editingFieldIndex] : undefined}
          existingFieldNames={template.fields.map(f => f.name)}
          onSave={(field) => {
            if (uiState.editingFieldIndex !== null) {
              updateField(uiState.editingFieldIndex, field);
            } else {
              addField(field);
            }
          }}
          onCancel={() => updateUIState({ 
            showAddFieldModal: false, 
            editingFieldIndex: null 
          })}
          isEdit={uiState.editingFieldIndex !== null}
        />
      )}

      {/* Delete Confirmation Modal */}
      <ConfirmationModal
        isOpen={uiState.showDeleteConfirmation}
        title="Delete Scope Parameter"
        message={`Are you sure you want to delete the parameter "${
          uiState.fieldToDelete !== null ? template.fields[uiState.fieldToDelete]?.label : ''
        }"? This action cannot be undone.`}
        confirmText="Delete Parameter"
        cancelText="Cancel"
        onConfirm={() => {
          if (uiState.fieldToDelete !== null) {
            removeField(uiState.fieldToDelete);
          }
        }}
        onCancel={() => updateUIState({ 
          showDeleteConfirmation: false, 
          fieldToDelete: null 
        })}
        variant="danger"
      />

      {/* Toast Notifications */}
      <Toast
        message={toast.message}
        type={toast.type}
        isVisible={toast.isVisible}
        onClose={hideToast}
      />

      {/* Unsaved Changes Warning */}
      {uiState.hasUnsavedChanges && (
        <div className="unsaved-changes-warning">
          <span>You have unsaved changes</span>
        </div>
      )}
    </div>
  );
};

export default ScopeTemplateManager; 