import React, { useState, useEffect } from 'react';
import { 
  HardwareAsset, 
  CreateHardwareAssetDto, 
  UpdateHardwareAssetDto,
  HardwareAssetType,
  HardwareAssetStatus
} from '../../types/hardware';
import './HardwareAssetForm.css';

interface HardwareAssetFormProps {
  initialData?: HardwareAsset | null;
  onSubmit: (data: CreateHardwareAssetDto | UpdateHardwareAssetDto) => Promise<void>;
  onCancel: () => void;
  loading?: boolean;
  error?: string | null;
  isEditMode?: boolean;
}

/**
 * HardwareAssetForm Component
 * Reusable form for creating and editing hardware assets
 * Includes comprehensive validation and user-friendly interface
 */
const HardwareAssetForm: React.FC<HardwareAssetFormProps> = ({
  initialData,
  onSubmit,
  onCancel,
  loading = false,
  error = null,
  isEditMode = false
}) => {
  const [formData, setFormData] = useState<CreateHardwareAssetDto>({
    assetTag: '',
    serialNumber: '',
    deviceName: '',
    manufacturer: '',
    model: '',
    assetType: HardwareAssetType.OTHER,
    status: HardwareAssetStatus.IN_STOCK,
    purchaseDate: '',
    purchaseCost: undefined,
    warrantyExpiryDate: '',
    location: '',
    notes: ''
  });

  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});
  const [touched, setTouched] = useState<Record<string, boolean>>({});

  /**
   * Initialize form data when component mounts or initialData changes
   */
  useEffect(() => {
    if (initialData) {
      setFormData({
        assetTag: initialData.assetTag || '',
        serialNumber: initialData.serialNumber || '',
        deviceName: initialData.deviceName || '',
        manufacturer: initialData.manufacturer || '',
        model: initialData.model || '',
        assetType: initialData.assetType || HardwareAssetType.OTHER,
        status: initialData.status || HardwareAssetStatus.IN_STOCK,
        purchaseDate: initialData.purchaseDate || '',
        purchaseCost: initialData.purchaseCost || undefined,
        warrantyExpiryDate: initialData.warrantyExpiryDate || '',
        location: initialData.location || '',
        notes: initialData.notes || ''
      });
    }
  }, [initialData]);

  /**
   * Handle input changes
   */
  const handleInputChange = (field: keyof CreateHardwareAssetDto, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));

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
  const handleFieldBlur = (field: keyof CreateHardwareAssetDto) => {
    setTouched(prev => ({
      ...prev,
      [field]: true
    }));
    validateField(field, formData[field]);
  };

  /**
   * Validate individual field
   */
  const validateField = (field: keyof CreateHardwareAssetDto, value: any): string => {
    let error = '';

    switch (field) {
      case 'assetTag':
        if (!value || value.trim().length === 0) {
          error = 'Asset tag is required';
        } else if (value.trim().length > 100) {
          error = 'Asset tag must not exceed 100 characters';
        }
        break;

      case 'serialNumber':
        if (value && value.trim().length > 255) {
          error = 'Serial number must not exceed 255 characters';
        }
        break;

      case 'deviceName':
        if (value && value.trim().length > 255) {
          error = 'Device name must not exceed 255 characters';
        }
        break;

      case 'manufacturer':
        if (value && value.trim().length > 100) {
          error = 'Manufacturer must not exceed 100 characters';
        }
        break;

      case 'model':
        if (value && value.trim().length > 100) {
          error = 'Model must not exceed 100 characters';
        }
        break;

      case 'assetType':
        if (!value || !Object.values(HardwareAssetType).includes(value)) {
          error = 'Please select a valid asset type';
        }
        break;

      case 'status':
        if (!value || !Object.values(HardwareAssetStatus).includes(value)) {
          error = 'Please select a valid status';
        }
        break;

      case 'purchaseDate':
        if (value && !isValidDate(value)) {
          error = 'Please enter a valid date';
        }
        break;

      case 'purchaseCost':
        if (value !== undefined && value !== null && value !== '') {
          const numValue = Number(value);
          if (isNaN(numValue) || numValue < 0) {
            error = 'Purchase cost must be a positive number';
          }
        }
        break;

      case 'warrantyExpiryDate':
        if (value && !isValidDate(value)) {
          error = 'Please enter a valid date';
        }
        break;

      case 'location':
        if (value && value.trim().length > 255) {
          error = 'Location must not exceed 255 characters';
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

    // Validate all fields
    Object.keys(formData).forEach(key => {
      const field = key as keyof CreateHardwareAssetDto;
      const error = validateField(field, formData[field]);
      if (error) {
        errors[field] = error;
        isValid = false;
      }
    });

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
    const submitData: CreateHardwareAssetDto | UpdateHardwareAssetDto = {
      ...formData,
      // Convert empty strings to undefined for optional fields
      serialNumber: formData.serialNumber?.trim() || undefined,
      deviceName: formData.deviceName?.trim() || undefined,
      manufacturer: formData.manufacturer?.trim() || undefined,
      model: formData.model?.trim() || undefined,
      purchaseDate: formData.purchaseDate || undefined,
      purchaseCost: formData.purchaseCost || undefined,
      warrantyExpiryDate: formData.warrantyExpiryDate || undefined,
      location: formData.location?.trim() || undefined,
      notes: formData.notes?.trim() || undefined,
    };

    try {
      await onSubmit(submitData);
    } catch (err) {
      // Error handling is done by parent component
      console.error('Form submission error:', err);
    }
  };

  /**
   * Format asset type for display
   */
  const formatAssetType = (assetType: HardwareAssetType): string => {
    return assetType.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
  };

  /**
   * Format status for display
   */
  const formatStatus = (status: HardwareAssetStatus): string => {
    return status.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
  };

  /**
   * Get field error message
   */
  const getFieldError = (field: keyof CreateHardwareAssetDto): string => {
    return touched[field] ? validationErrors[field] || '' : '';
  };

  /**
   * Check if field has error
   */
  const hasFieldError = (field: keyof CreateHardwareAssetDto): boolean => {
    return touched[field] && !!validationErrors[field];
  };

  return (
    <div className="hardware-asset-form">
      <div className="form-header">
        <h2>{isEditMode ? 'Edit Hardware Asset' : 'Create New Hardware Asset'}</h2>
        <p className="form-description">
          {isEditMode 
            ? 'Update the hardware asset information below.' 
            : 'Enter the details for the new hardware asset.'
          }
        </p>
      </div>

      {error && (
        <div className="error-message">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="asset-form">
        <div className="form-grid">
          {/* Basic Information */}
          <div className="form-section">
            <h3>Basic Information</h3>
            
            <div className="form-group">
              <label htmlFor="assetTag" className="required">Asset Tag</label>
              <input
                type="text"
                id="assetTag"
                value={formData.assetTag}
                onChange={(e) => handleInputChange('assetTag', e.target.value)}
                onBlur={() => handleFieldBlur('assetTag')}
                className={hasFieldError('assetTag') ? 'error' : ''}
                placeholder="Enter unique asset tag"
                maxLength={100}
                required
              />
              {getFieldError('assetTag') && (
                <span className="field-error">{getFieldError('assetTag')}</span>
              )}
            </div>

            <div className="form-group">
              <label htmlFor="serialNumber">Serial Number</label>
              <input
                type="text"
                id="serialNumber"
                value={formData.serialNumber}
                onChange={(e) => handleInputChange('serialNumber', e.target.value)}
                onBlur={() => handleFieldBlur('serialNumber')}
                className={hasFieldError('serialNumber') ? 'error' : ''}
                placeholder="Enter serial number"
                maxLength={255}
              />
              {getFieldError('serialNumber') && (
                <span className="field-error">{getFieldError('serialNumber')}</span>
              )}
            </div>

            <div className="form-group">
              <label htmlFor="deviceName">Device Name</label>
              <input
                type="text"
                id="deviceName"
                value={formData.deviceName}
                onChange={(e) => handleInputChange('deviceName', e.target.value)}
                onBlur={() => handleFieldBlur('deviceName')}
                className={hasFieldError('deviceName') ? 'error' : ''}
                placeholder="Enter device name"
                maxLength={255}
              />
              {getFieldError('deviceName') && (
                <span className="field-error">{getFieldError('deviceName')}</span>
              )}
            </div>

            <div className="form-row">
              <div className="form-group">
                <label htmlFor="manufacturer">Manufacturer</label>
                <input
                  type="text"
                  id="manufacturer"
                  value={formData.manufacturer}
                  onChange={(e) => handleInputChange('manufacturer', e.target.value)}
                  onBlur={() => handleFieldBlur('manufacturer')}
                  className={hasFieldError('manufacturer') ? 'error' : ''}
                  placeholder="Enter manufacturer"
                  maxLength={100}
                />
                {getFieldError('manufacturer') && (
                  <span className="field-error">{getFieldError('manufacturer')}</span>
                )}
              </div>

              <div className="form-group">
                <label htmlFor="model">Model</label>
                <input
                  type="text"
                  id="model"
                  value={formData.model}
                  onChange={(e) => handleInputChange('model', e.target.value)}
                  onBlur={() => handleFieldBlur('model')}
                  className={hasFieldError('model') ? 'error' : ''}
                  placeholder="Enter model"
                  maxLength={100}
                />
                {getFieldError('model') && (
                  <span className="field-error">{getFieldError('model')}</span>
                )}
              </div>
            </div>
          </div>

          {/* Classification */}
          <div className="form-section">
            <h3>Classification</h3>
            
            <div className="form-row">
              <div className="form-group">
                <label htmlFor="assetType" className="required">Asset Type</label>
                <select
                  id="assetType"
                  value={formData.assetType}
                  onChange={(e) => handleInputChange('assetType', e.target.value as HardwareAssetType)}
                  onBlur={() => handleFieldBlur('assetType')}
                  className={hasFieldError('assetType') ? 'error' : ''}
                  required
                >
                  {Object.values(HardwareAssetType).map(type => (
                    <option key={type} value={type}>
                      {formatAssetType(type)}
                    </option>
                  ))}
                </select>
                {getFieldError('assetType') && (
                  <span className="field-error">{getFieldError('assetType')}</span>
                )}
              </div>

              <div className="form-group">
                <label htmlFor="status" className="required">Status</label>
                <select
                  id="status"
                  value={formData.status}
                  onChange={(e) => handleInputChange('status', e.target.value as HardwareAssetStatus)}
                  onBlur={() => handleFieldBlur('status')}
                  className={hasFieldError('status') ? 'error' : ''}
                  required
                >
                  {Object.values(HardwareAssetStatus).map(status => (
                    <option key={status} value={status}>
                      {formatStatus(status)}
                    </option>
                  ))}
                </select>
                {getFieldError('status') && (
                  <span className="field-error">{getFieldError('status')}</span>
                )}
              </div>
            </div>

            <div className="form-group">
              <label htmlFor="location">Location</label>
              <input
                type="text"
                id="location"
                value={formData.location}
                onChange={(e) => handleInputChange('location', e.target.value)}
                onBlur={() => handleFieldBlur('location')}
                className={hasFieldError('location') ? 'error' : ''}
                placeholder="Enter current location"
                maxLength={255}
              />
              {getFieldError('location') && (
                <span className="field-error">{getFieldError('location')}</span>
              )}
            </div>
          </div>

          {/* Financial Information */}
          <div className="form-section">
            <h3>Financial Information</h3>
            
            <div className="form-row">
              <div className="form-group">
                <label htmlFor="purchaseDate">Purchase Date</label>
                <input
                  type="date"
                  id="purchaseDate"
                  value={formData.purchaseDate}
                  onChange={(e) => handleInputChange('purchaseDate', e.target.value)}
                  onBlur={() => handleFieldBlur('purchaseDate')}
                  className={hasFieldError('purchaseDate') ? 'error' : ''}
                />
                {getFieldError('purchaseDate') && (
                  <span className="field-error">{getFieldError('purchaseDate')}</span>
                )}
              </div>

              <div className="form-group">
                <label htmlFor="purchaseCost">Purchase Cost (USD)</label>
                <input
                  type="number"
                  id="purchaseCost"
                  value={formData.purchaseCost || ''}
                  onChange={(e) => handleInputChange('purchaseCost', e.target.value ? parseFloat(e.target.value) : undefined)}
                  onBlur={() => handleFieldBlur('purchaseCost')}
                  className={hasFieldError('purchaseCost') ? 'error' : ''}
                  placeholder="0.00"
                  min="0"
                  step="0.01"
                />
                {getFieldError('purchaseCost') && (
                  <span className="field-error">{getFieldError('purchaseCost')}</span>
                )}
              </div>
            </div>

            <div className="form-group">
              <label htmlFor="warrantyExpiryDate">Warranty Expiry Date</label>
              <input
                type="date"
                id="warrantyExpiryDate"
                value={formData.warrantyExpiryDate}
                onChange={(e) => handleInputChange('warrantyExpiryDate', e.target.value)}
                onBlur={() => handleFieldBlur('warrantyExpiryDate')}
                className={hasFieldError('warrantyExpiryDate') ? 'error' : ''}
              />
              {getFieldError('warrantyExpiryDate') && (
                <span className="field-error">{getFieldError('warrantyExpiryDate')}</span>
              )}
            </div>
          </div>

          {/* Additional Information */}
          <div className="form-section full-width">
            <h3>Additional Information</h3>
            
            <div className="form-group">
              <label htmlFor="notes">Notes</label>
              <textarea
                id="notes"
                value={formData.notes}
                onChange={(e) => handleInputChange('notes', e.target.value)}
                onBlur={() => handleFieldBlur('notes')}
                className={hasFieldError('notes') ? 'error' : ''}
                placeholder="Enter any additional notes or comments"
                rows={4}
              />
              {getFieldError('notes') && (
                <span className="field-error">{getFieldError('notes')}</span>
              )}
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
            {loading ? 'Saving...' : (isEditMode ? 'Update Asset' : 'Create Asset')}
          </button>
        </div>
      </form>
    </div>
  );
};

export default HardwareAssetForm; 