import React, { useState, useEffect, useCallback } from 'react';
import { 
  ClientHardwareAssignment,
  CreateClientHardwareAssignmentDto,
  UpdateClientHardwareAssignmentDto,
  HardwareAssignmentStatus,
  HardwareAsset
} from '../../types/hardware';
import { Client } from '../../types/client';
import { ServiceScope } from '../../types/service-scope';
import { apiService } from '../../services/apiService';
import './HardwareAssignmentForm.css';

interface HardwareAssignmentFormProps {
  initialData?: ClientHardwareAssignment | null;
  preselectedAssetId?: string;
  preselectedClientId?: string;
  onSubmit: (data: CreateClientHardwareAssignmentDto | UpdateClientHardwareAssignmentDto) => Promise<void>;
  onCancel: () => void;
  loading?: boolean;
  error?: string | null;
  isEditMode?: boolean;
}

/**
 * HardwareAssignmentForm Component
 * Reusable form for creating and editing hardware assignments
 * Includes asset selection, client selection, and service scope linking
 */
const HardwareAssignmentForm: React.FC<HardwareAssignmentFormProps> = ({
  initialData,
  preselectedAssetId,
  preselectedClientId,
  onSubmit,
  onCancel,
  loading = false,
  error = null,
  isEditMode = false
}) => {
  const [formData, setFormData] = useState<CreateClientHardwareAssignmentDto>({
    hardwareAssetId: preselectedAssetId || '',
    clientId: preselectedClientId || '',
    serviceScopeId: undefined,
    assignmentDate: new Date().toISOString().split('T')[0],
    status: HardwareAssignmentStatus.ACTIVE,
    returnDate: undefined,
    notes: ''
  });

  const [availableAssets, setAvailableAssets] = useState<HardwareAsset[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [serviceScopes, setServiceScopes] = useState<ServiceScope[]>([]);
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});
  const [touched, setTouched] = useState<Record<string, boolean>>({});
  const [loadingData, setLoadingData] = useState(true);

  /**
   * Initialize form data when component mounts or initialData changes
   */
  useEffect(() => {
    if (initialData) {
      setFormData({
        hardwareAssetId: initialData.hardwareAssetId || '',
        clientId: initialData.clientId || '',
        serviceScopeId: initialData.serviceScopeId || undefined,
        assignmentDate: initialData.assignmentDate || '',
        status: initialData.status || HardwareAssignmentStatus.ACTIVE,
        returnDate: initialData.returnDate || undefined,
        notes: initialData.notes || ''
      });
    }
  }, [initialData]);

  /**
   * Load available assets for assignment
   */
  const loadAvailableAssets = useCallback(async () => {
    try {
      const assets = await apiService.getAvailableHardwareAssets();
      setAvailableAssets(assets);
    } catch (err) {
      console.error('Error loading available assets:', err);
    }
  }, []);

  /**
   * Load clients
   */
  const loadClients = useCallback(async () => {
    try {
      const result = await apiService.getClients();
      setClients(result.data);
    } catch (err) {
      console.error('Error loading clients:', err);
    }
  }, []);

  /**
   * Load service scopes for selected client
   */
  const loadServiceScopes = useCallback(async (clientId: string) => {
    if (!clientId) {
      setServiceScopes([]);
      return;
    }

    try {
      const scopes = await apiService.getClientServiceScopes(clientId);
      setServiceScopes(scopes);
    } catch (err) {
      console.error('Error loading service scopes:', err);
      setServiceScopes([]);
    }
  }, []);

  /**
   * Load initial data
   */
  useEffect(() => {
    const loadInitialData = async () => {
      setLoadingData(true);
      await Promise.all([
        loadAvailableAssets(),
        loadClients()
      ]);
      setLoadingData(false);
    };

    loadInitialData();
  }, [loadAvailableAssets, loadClients]);

  /**
   * Load service scopes when client changes
   */
  useEffect(() => {
    if (formData.clientId) {
      loadServiceScopes(formData.clientId);
    } else {
      setServiceScopes([]);
    }
  }, [formData.clientId, loadServiceScopes]);

  /**
   * Handle input changes
   */
  const handleInputChange = (field: keyof CreateClientHardwareAssignmentDto, value: any) => {
    setFormData(prev => {
      const newData = { ...prev, [field]: value };
      
      // Clear service scope if client changes
      if (field === 'clientId' && value !== prev.clientId) {
        newData.serviceScopeId = undefined;
      }
      
      return newData;
    });

    // Clear validation error when user starts typing
    if (validationErrors[field]) {
      setValidationErrors(prev => ({
        ...prev,
        [field]: ''
      }));
    }
  };

  /**
   * Handle field blur (for validation)
   */
  const handleFieldBlur = (field: keyof CreateClientHardwareAssignmentDto) => {
    setTouched(prev => ({
      ...prev,
      [field]: true
    }));
    validateField(field, formData[field]);
  };

  /**
   * Validate individual field
   */
  const validateField = (field: keyof CreateClientHardwareAssignmentDto, value: any): string => {
    let error = '';

    switch (field) {
      case 'hardwareAssetId':
        if (!value || value.trim().length === 0) {
          error = 'Hardware asset is required';
        }
        break;

      case 'clientId':
        if (!value || value.trim().length === 0) {
          error = 'Client is required';
        }
        break;

      case 'assignmentDate':
        if (!value) {
          error = 'Assignment date is required';
        } else if (!isValidDate(value)) {
          error = 'Please enter a valid date';
        }
        break;

      case 'returnDate':
        if (value && !isValidDate(value)) {
          error = 'Please enter a valid return date';
        } else if (value && formData.assignmentDate && new Date(value) < new Date(formData.assignmentDate)) {
          error = 'Return date cannot be before assignment date';
        }
        break;

      case 'status':
        if (!value || !Object.values(HardwareAssignmentStatus).includes(value)) {
          error = 'Please select a valid status';
        }
        break;
    }

    setValidationErrors(prev => ({
      ...prev,
      [field]: error
    }));

    return error;
  };

  /**
   * Validate date string
   */
  const isValidDate = (dateString: string): boolean => {
    const date = new Date(dateString);
    return date instanceof Date && !isNaN(date.getTime());
  };

  /**
   * Validate entire form
   */
  const validateForm = (): boolean => {
    const errors: Record<string, string> = {};
    let isValid = true;

    // Validate required fields
    const requiredFields: (keyof CreateClientHardwareAssignmentDto)[] = [
      'hardwareAssetId',
      'clientId',
      'assignmentDate',
      'status'
    ];

    requiredFields.forEach(field => {
      const error = validateField(field, formData[field]);
      if (error) {
        errors[field] = error;
        isValid = false;
      }
    });

    // Validate optional fields if they have values
    if (formData.returnDate) {
      const error = validateField('returnDate', formData.returnDate);
      if (error) {
        errors.returnDate = error;
        isValid = false;
      }
    }

    setValidationErrors(errors);
    return isValid;
  };

  /**
   * Handle form submission
   */
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Mark all fields as touched
    const allTouched: Record<string, boolean> = {};
    Object.keys(formData).forEach(key => {
      allTouched[key] = true;
    });
    setTouched(allTouched);

    // Validate form
    if (!validateForm()) {
      return;
    }

    // Prepare data for submission
    const submitData: CreateClientHardwareAssignmentDto | UpdateClientHardwareAssignmentDto = {
      ...formData,
      serviceScopeId: formData.serviceScopeId || undefined,
      returnDate: formData.returnDate || undefined,
      notes: formData.notes?.trim() || undefined,
    };

    try {
      await onSubmit(submitData);
    } catch (err) {
      console.error('Form submission error:', err);
    }
  };

  /**
   * Format status for display
   */
  const formatStatus = (status: HardwareAssignmentStatus): string => {
    return status.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
  };

  /**
   * Get field error message
   */
  const getFieldError = (field: keyof CreateClientHardwareAssignmentDto): string => {
    return touched[field] ? validationErrors[field] || '' : '';
  };

  /**
   * Check if field has error
   */
  const hasFieldError = (field: keyof CreateClientHardwareAssignmentDto): boolean => {
    return touched[field] && !!validationErrors[field];
  };

  /**
   * Get selected asset details
   */
  const getSelectedAsset = (): HardwareAsset | undefined => {
    return availableAssets.find(asset => asset.id === formData.hardwareAssetId);
  };

  /**
   * Get selected client details
   */
  const getSelectedClient = (): Client | undefined => {
    return clients.find(client => client.id === formData.clientId);
  };

  if (loadingData) {
    return (
      <div className="hardware-assignment-form">
        <div className="loading-container">
          <div className="loading-spinner"></div>
          <p>Loading form data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="hardware-assignment-form">
      <div className="form-header">
        <h2>{isEditMode ? 'Edit Hardware Assignment' : 'Create New Hardware Assignment'}</h2>
        <p className="form-description">
          {isEditMode 
            ? 'Update the hardware assignment details below.' 
            : 'Assign a hardware asset to a client and optionally link it to a service scope.'
          }
        </p>
      </div>

      {error && (
        <div className="error-message">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="assignment-form">
        <div className="form-grid">
          {/* Asset Selection */}
          <div className="form-section">
            <h3>Hardware Asset</h3>
            
            <div className="form-group">
              <label htmlFor="hardwareAssetId" className="required">Select Asset</label>
              <select
                id="hardwareAssetId"
                value={formData.hardwareAssetId}
                onChange={(e) => handleInputChange('hardwareAssetId', e.target.value)}
                onBlur={() => handleFieldBlur('hardwareAssetId')}
                className={hasFieldError('hardwareAssetId') ? 'error' : ''}
                required
                disabled={isEditMode} // Don't allow changing asset in edit mode
              >
                <option value="">Select a hardware asset...</option>
                {availableAssets.map(asset => (
                  <option key={asset.id} value={asset.id}>
                    {asset.assetTag} - {asset.manufacturer} {asset.model}
                    {asset.serialNumber && ` (SN: ${asset.serialNumber})`}
                  </option>
                ))}
              </select>
              {getFieldError('hardwareAssetId') && (
                <span className="field-error">{getFieldError('hardwareAssetId')}</span>
              )}
            </div>

            {/* Asset Details Display */}
            {getSelectedAsset() && (
              <div className="asset-details-display">
                <h4>Asset Details</h4>
                <div className="asset-info">
                  <div className="info-row">
                    <span className="label">Asset Tag:</span>
                    <span className="value">{getSelectedAsset()?.assetTag}</span>
                  </div>
                  <div className="info-row">
                    <span className="label">Type:</span>
                    <span className="value">{getSelectedAsset()?.assetType.replace(/_/g, ' ')}</span>
                  </div>
                  <div className="info-row">
                    <span className="label">Location:</span>
                    <span className="value">{getSelectedAsset()?.location || 'Not specified'}</span>
                  </div>
                  {getSelectedAsset()?.serialNumber && (
                    <div className="info-row">
                      <span className="label">Serial Number:</span>
                      <span className="value">{getSelectedAsset()?.serialNumber}</span>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Client Selection */}
          <div className="form-section">
            <h3>Client Assignment</h3>
            
            <div className="form-group">
              <label htmlFor="clientId" className="required">Select Client</label>
              <select
                id="clientId"
                value={formData.clientId}
                onChange={(e) => handleInputChange('clientId', e.target.value)}
                onBlur={() => handleFieldBlur('clientId')}
                className={hasFieldError('clientId') ? 'error' : ''}
                required
              >
                <option value="">Select a client...</option>
                {clients.map(client => (
                  <option key={client.id} value={client.id}>
                    {client.companyName}
                  </option>
                ))}
              </select>
              {getFieldError('clientId') && (
                <span className="field-error">{getFieldError('clientId')}</span>
              )}
            </div>

            <div className="form-group">
              <label htmlFor="serviceScopeId">Service Scope (Optional)</label>
              <select
                id="serviceScopeId"
                value={formData.serviceScopeId || ''}
                onChange={(e) => handleInputChange('serviceScopeId', e.target.value || undefined)}
                disabled={!formData.clientId || serviceScopes.length === 0}
              >
                <option value="">General assignment (no specific service scope)</option>
                {serviceScopes.map(scope => (
                  <option key={scope.id} value={scope.id}>
                    {scope.service?.name || `Service Scope ${scope.id}`}
                  </option>
                ))}
              </select>
              {!formData.clientId && (
                <span className="field-help">Select a client first to see available service scopes</span>
              )}
              {formData.clientId && serviceScopes.length === 0 && (
                <span className="field-help">No service scopes available for this client</span>
              )}
            </div>

            {/* Client Details Display */}
            {getSelectedClient() && (
              <div className="client-details-display">
                <h4>Client Details</h4>
                <div className="client-info">
                  <div className="info-row">
                    <span className="label">Company:</span>
                    <span className="value">{getSelectedClient()?.companyName}</span>
                  </div>
                  <div className="info-row">
                    <span className="label">Contact:</span>
                    <span className="value">{getSelectedClient()?.contactName || 'Not specified'}</span>
                  </div>
                  <div className="info-row">
                    <span className="label">Email:</span>
                    <span className="value">{getSelectedClient()?.contactEmail || 'Not specified'}</span>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Assignment Details */}
          <div className="form-section full-width">
            <h3>Assignment Details</h3>
            
            <div className="form-row">
              <div className="form-group">
                <label htmlFor="assignmentDate" className="required">Assignment Date</label>
                <input
                  type="date"
                  id="assignmentDate"
                  value={formData.assignmentDate}
                  onChange={(e) => handleInputChange('assignmentDate', e.target.value)}
                  onBlur={() => handleFieldBlur('assignmentDate')}
                  className={hasFieldError('assignmentDate') ? 'error' : ''}
                  required
                />
                {getFieldError('assignmentDate') && (
                  <span className="field-error">{getFieldError('assignmentDate')}</span>
                )}
              </div>

              <div className="form-group">
                <label htmlFor="status" className="required">Status</label>
                <select
                  id="status"
                  value={formData.status}
                  onChange={(e) => handleInputChange('status', e.target.value as HardwareAssignmentStatus)}
                  onBlur={() => handleFieldBlur('status')}
                  className={hasFieldError('status') ? 'error' : ''}
                  required
                >
                  {Object.values(HardwareAssignmentStatus).map(status => (
                    <option key={status} value={status}>
                      {formatStatus(status)}
                    </option>
                  ))}
                </select>
                {getFieldError('status') && (
                  <span className="field-error">{getFieldError('status')}</span>
                )}
              </div>

              <div className="form-group">
                <label htmlFor="returnDate">Return Date (Optional)</label>
                <input
                  type="date"
                  id="returnDate"
                  value={formData.returnDate || ''}
                  onChange={(e) => handleInputChange('returnDate', e.target.value || undefined)}
                  onBlur={() => handleFieldBlur('returnDate')}
                  className={hasFieldError('returnDate') ? 'error' : ''}
                />
                {getFieldError('returnDate') && (
                  <span className="field-error">{getFieldError('returnDate')}</span>
                )}
              </div>
            </div>

            <div className="form-group">
              <label htmlFor="notes">Notes</label>
              <textarea
                id="notes"
                value={formData.notes}
                onChange={(e) => handleInputChange('notes', e.target.value)}
                onBlur={() => handleFieldBlur('notes')}
                placeholder="Enter any additional notes about this assignment"
                rows={4}
              />
            </div>
          </div>
        </div>

        {/* Form Actions */}
        <div className="form-actions">
          <button
            type="button"
            onClick={onCancel}
            className="btn btn-secondary"
            disabled={loading}
          >
            Cancel
          </button>
          <button
            type="submit"
            className="btn btn-primary"
            disabled={loading}
          >
            {loading ? 'Saving...' : (isEditMode ? 'Update Assignment' : 'Create Assignment')}
          </button>
        </div>
      </form>
    </div>
  );
};

export default HardwareAssignmentForm; 