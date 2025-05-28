import React, { useState, useEffect } from 'react';
import { 
  ServiceScope, 
  CreateServiceScopeDto, 
  UpdateServiceScopeDto,
  ServiceScopeFormData,
  DynamicFormData,
  FormValidationErrors
} from '../../types/service-scope';
import { SAFStatus } from '../../types/contract';
import { Service } from '../../types/service';
import { apiService } from '../../services/apiService';
import DynamicForm from '../common/DynamicForm';
import './ServiceScopeForm.css';

interface ServiceScopeFormProps {
  contractId: string;
  serviceScope?: ServiceScope | null;
  onSubmit: (data: CreateServiceScopeDto | UpdateServiceScopeDto) => Promise<void>;
  onCancel: () => void;
  isLoading?: boolean;
}

const ServiceScopeForm: React.FC<ServiceScopeFormProps> = ({
  contractId,
  serviceScope,
  onSubmit,
  onCancel,
  isLoading = false
}) => {
  const [services, setServices] = useState<Service[]>([]);
  const [selectedService, setSelectedService] = useState<Service | null>(null);
  const [formData, setFormData] = useState<ServiceScopeFormData>({
    serviceId: serviceScope?.serviceId || '',
    scopeDetails: serviceScope?.scopeDetails || {},
    price: serviceScope?.price || null,
    quantity: serviceScope?.quantity || null,
    unit: serviceScope?.unit || '',
    notes: serviceScope?.notes || '',
    safServiceStartDate: serviceScope?.safServiceStartDate || '',
    safServiceEndDate: serviceScope?.safServiceEndDate || '',
    safStatus: serviceScope?.safStatus || SAFStatus.PENDING
  });
  const [dynamicFormData, setDynamicFormData] = useState<DynamicFormData>({});
  const [dynamicFormValid, setDynamicFormValid] = useState(true);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loadingServices, setLoadingServices] = useState(true);

  const isEditMode = !!serviceScope;

  // Load services on component mount
  useEffect(() => {
    fetchServices();
  }, []);

  // Load selected service when serviceId changes
  useEffect(() => {
    if (formData.serviceId) {
      const service = services.find(s => s.id === formData.serviceId);
      setSelectedService(service || null);
      
      // Initialize dynamic form data with existing scope details
      if (service && serviceScope?.scopeDetails) {
        setDynamicFormData(serviceScope.scopeDetails);
      }
    } else {
      setSelectedService(null);
      setDynamicFormData({});
    }
  }, [formData.serviceId, services, serviceScope]);

  const fetchServices = async () => {
    try {
      setLoadingServices(true);
      const response = await apiService.getServices({ isActive: true });
      setServices(response.data);
    } catch (error: any) {
      console.error('Failed to fetch services:', error);
    } finally {
      setLoadingServices(false);
    }
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.serviceId) {
      newErrors.serviceId = 'Service is required';
    }

    if (formData.price !== null && formData.price < 0) {
      newErrors.price = 'Price must be non-negative';
    }

    if (formData.quantity !== null && formData.quantity < 1) {
      newErrors.quantity = 'Quantity must be at least 1';
    }

    if (formData.safServiceStartDate && formData.safServiceEndDate) {
      const startDate = new Date(formData.safServiceStartDate);
      const endDate = new Date(formData.safServiceEndDate);
      if (startDate >= endDate) {
        newErrors.safServiceEndDate = 'End date must be after start date';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0 && dynamicFormValid;
  };

  const handleInputChange = (field: keyof ServiceScopeFormData, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    
    // Clear error for this field
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const handleDynamicFormChange = (data: DynamicFormData) => {
    setDynamicFormData(data);
    setFormData(prev => ({ ...prev, scopeDetails: data }));
  };

  const handleDynamicFormValidation = (isValid: boolean, validationErrors: FormValidationErrors) => {
    setDynamicFormValid(isValid);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    const submitData: CreateServiceScopeDto | UpdateServiceScopeDto = {
      serviceId: formData.serviceId,
      scopeDetails: dynamicFormData,
      price: formData.price || undefined,
      quantity: formData.quantity || undefined,
      unit: formData.unit || undefined,
      notes: formData.notes || undefined,
      safServiceStartDate: formData.safServiceStartDate || undefined,
      safServiceEndDate: formData.safServiceEndDate || undefined,
      safStatus: formData.safStatus
    };

    await onSubmit(submitData);
  };

  const formatCurrency = (amount: number | null) => {
    if (!amount) return '';
    return amount.toString();
  };

  const safStatusOptions = [
    { value: SAFStatus.PENDING, label: 'Pending' },
    { value: SAFStatus.IN_PROGRESS, label: 'In Progress' },
    { value: SAFStatus.COMPLETED, label: 'Completed' },
    { value: SAFStatus.ON_HOLD, label: 'On Hold' },
    { value: SAFStatus.CANCELLED, label: 'Cancelled' }
  ];

  return (
    <div className="service-scope-form">
      <div className="form-header">
        <h3>{isEditMode ? 'Edit Service Scope' : 'Add Service Scope'}</h3>
        <p>Configure the service scope details for this contract.</p>
      </div>

      <form onSubmit={handleSubmit} className="scope-form">
        {/* Service Selection */}
        <div className="form-section">
          <h4>Service Selection</h4>
          <div className="form-group">
            <label htmlFor="serviceId" className="form-label">
              Service <span className="required">*</span>
            </label>
            <select
              id="serviceId"
              value={formData.serviceId}
              onChange={(e) => handleInputChange('serviceId', e.target.value)}
              disabled={isLoading || loadingServices || isEditMode}
              className={`form-input ${errors.serviceId ? 'error' : ''}`}
            >
              <option value="">Select a service</option>
              {services.map(service => (
                <option key={service.id} value={service.id}>
                  {service.name} - {service.category}
                </option>
              ))}
            </select>
            {errors.serviceId && <div className="error-message">{errors.serviceId}</div>}
          </div>

          {selectedService && (
            <div className="service-info">
              <h5>Service Information</h5>
              <p><strong>Description:</strong> {selectedService.description}</p>
              <p><strong>Category:</strong> {selectedService.category}</p>
              <p><strong>Delivery Model:</strong> {selectedService.deliveryModel}</p>
              <p><strong>Base Price:</strong> ${selectedService.basePrice}</p>
            </div>
          )}
        </div>

        {/* Dynamic Scope Configuration */}
        {selectedService?.scopeDefinitionTemplate && (
          <div className="form-section">
            <h4>Scope Configuration</h4>
            <p className="section-description">
              Configure the specific parameters for this service based on the service template.
            </p>
            <DynamicForm
              fields={selectedService.scopeDefinitionTemplate.fields}
              initialData={dynamicFormData}
              onDataChange={handleDynamicFormChange}
              onValidationChange={handleDynamicFormValidation}
              disabled={isLoading}
            />
          </div>
        )}

        {/* Pricing and Quantity */}
        <div className="form-section">
          <h4>Pricing & Quantity</h4>
          <div className="form-row">
            <div className="form-group">
              <label htmlFor="price" className="form-label">Price</label>
              <input
                type="number"
                id="price"
                value={formatCurrency(formData.price)}
                onChange={(e) => handleInputChange('price', e.target.value ? Number(e.target.value) : null)}
                disabled={isLoading}
                className={`form-input ${errors.price ? 'error' : ''}`}
                placeholder="0.00"
                min="0"
                step="0.01"
              />
              {errors.price && <div className="error-message">{errors.price}</div>}
            </div>

            <div className="form-group">
              <label htmlFor="quantity" className="form-label">Quantity</label>
              <input
                type="number"
                id="quantity"
                value={formData.quantity || ''}
                onChange={(e) => handleInputChange('quantity', e.target.value ? Number(e.target.value) : null)}
                disabled={isLoading}
                className={`form-input ${errors.quantity ? 'error' : ''}`}
                placeholder="1"
                min="1"
              />
              {errors.quantity && <div className="error-message">{errors.quantity}</div>}
            </div>

            <div className="form-group">
              <label htmlFor="unit" className="form-label">Unit</label>
              <input
                type="text"
                id="unit"
                value={formData.unit}
                onChange={(e) => handleInputChange('unit', e.target.value)}
                disabled={isLoading}
                className="form-input"
                placeholder="e.g., endpoints, hours, licenses"
              />
            </div>
          </div>

          {formData.price && formData.quantity && (
            <div className="total-value">
              <strong>Total Value: ${(formData.price * formData.quantity).toFixed(2)}</strong>
            </div>
          )}
        </div>

        {/* SAF Information */}
        <div className="form-section">
          <h4>Service Activation Form (SAF)</h4>
          <div className="form-row">
            <div className="form-group">
              <label htmlFor="safServiceStartDate" className="form-label">Service Start Date</label>
              <input
                type="date"
                id="safServiceStartDate"
                value={formData.safServiceStartDate}
                onChange={(e) => handleInputChange('safServiceStartDate', e.target.value)}
                disabled={isLoading}
                className="form-input"
              />
            </div>

            <div className="form-group">
              <label htmlFor="safServiceEndDate" className="form-label">Service End Date</label>
              <input
                type="date"
                id="safServiceEndDate"
                value={formData.safServiceEndDate}
                onChange={(e) => handleInputChange('safServiceEndDate', e.target.value)}
                disabled={isLoading}
                className={`form-input ${errors.safServiceEndDate ? 'error' : ''}`}
              />
              {errors.safServiceEndDate && <div className="error-message">{errors.safServiceEndDate}</div>}
            </div>

            <div className="form-group">
              <label htmlFor="safStatus" className="form-label">SAF Status</label>
              <select
                id="safStatus"
                value={formData.safStatus}
                onChange={(e) => handleInputChange('safStatus', e.target.value as SAFStatus)}
                disabled={isLoading}
                className="form-input"
              >
                {safStatusOptions.map(option => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Notes */}
        <div className="form-section">
          <div className="form-group">
            <label htmlFor="notes" className="form-label">Notes</label>
            <textarea
              id="notes"
              value={formData.notes}
              onChange={(e) => handleInputChange('notes', e.target.value)}
              disabled={isLoading}
              className="form-input"
              rows={4}
              placeholder="Additional notes or special requirements..."
            />
          </div>
        </div>

        {/* Form Actions */}
        <div className="form-actions">
          <button
            type="button"
            onClick={onCancel}
            disabled={isLoading}
            className="btn btn-secondary"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={isLoading || !dynamicFormValid || Object.keys(errors).length > 0}
            className="btn btn-primary"
          >
            {isLoading ? 'Saving...' : (isEditMode ? 'Update Service Scope' : 'Add Service Scope')}
          </button>
        </div>
      </form>
    </div>
  );
};

export default ServiceScopeForm; 