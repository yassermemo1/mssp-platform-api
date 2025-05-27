import React, { useState, useEffect } from 'react';
import { CreateClientDto, UpdateClientDto, ClientStatus, Client } from '../../types/client';
import './ClientForm.css';

interface ClientFormProps {
  initialData?: Client | null;
  onSubmit: (data: CreateClientDto | UpdateClientDto) => Promise<void>;
  onCancel: () => void;
  loading: boolean;
  error: string | null;
  isEditMode?: boolean;
}

/**
 * ClientForm Component
 * Reusable form for creating and editing clients
 * Handles validation, state management, and user feedback
 */
const ClientForm: React.FC<ClientFormProps> = ({
  initialData,
  onSubmit,
  onCancel,
  loading,
  error,
  isEditMode = false
}) => {
  // Form state
  const [formData, setFormData] = useState<CreateClientDto>({
    companyName: '',
    contactName: '',
    contactEmail: '',
    contactPhone: '',
    address: '',
    industry: '',
    status: ClientStatus.PROSPECT,
  });

  // UI state
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  /**
   * Initialize form data when component mounts or initialData changes
   */
  useEffect(() => {
    if (initialData) {
      setFormData({
        companyName: initialData.companyName,
        contactName: initialData.contactName,
        contactEmail: initialData.contactEmail,
        contactPhone: initialData.contactPhone || '',
        address: initialData.address || '',
        industry: initialData.industry || '',
        status: initialData.status,
      });
    }
  }, [initialData]);

  /**
   * Handle input changes
   */
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    
    // Clear field error when user starts typing
    if (fieldErrors[name]) {
      setFieldErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  /**
   * Validate form data
   */
  const validateForm = (): boolean => {
    const errors: Record<string, string> = {};

    // Required fields
    if (!formData.companyName.trim()) {
      errors.companyName = 'Company name is required';
    } else if (formData.companyName.length < 2) {
      errors.companyName = 'Company name must be at least 2 characters';
    }

    if (!formData.contactName.trim()) {
      errors.contactName = 'Contact name is required';
    } else if (formData.contactName.length < 2) {
      errors.contactName = 'Contact name must be at least 2 characters';
    }

    if (!formData.contactEmail.trim()) {
      errors.contactEmail = 'Contact email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.contactEmail)) {
      errors.contactEmail = 'Please enter a valid email address';
    }

    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
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
      // Prepare data for submission (remove empty optional fields)
      const submitData: CreateClientDto | UpdateClientDto = {
        companyName: formData.companyName.trim(),
        contactName: formData.contactName.trim(),
        contactEmail: formData.contactEmail.trim(),
        status: formData.status,
      };

      // Add optional fields if they have values
      if (formData.contactPhone?.trim()) {
        submitData.contactPhone = formData.contactPhone.trim();
      }
      if (formData.address?.trim()) {
        submitData.address = formData.address.trim();
      }
      if (formData.industry?.trim()) {
        submitData.industry = formData.industry.trim();
      }

      await onSubmit(submitData);
    } catch (err) {
      // Error handling is managed by parent component
      console.error('Form submission error:', err);
    }
  };

  return (
    <div className="client-form-container">
      <div className="client-form-header">
        <h2>{isEditMode ? 'Edit Client' : 'Create New Client'}</h2>
        <button onClick={onCancel} className="cancel-button" disabled={loading}>
          {isEditMode ? 'Cancel' : 'Back to Clients'}
        </button>
      </div>

      {error && (
        <div className="error-message">
          <strong>Error:</strong> {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="client-form">
        <div className="form-section">
          <h3>Company Information</h3>
          
          <div className="form-group">
            <label htmlFor="companyName">Company Name *</label>
            <input
              type="text"
              id="companyName"
              name="companyName"
              value={formData.companyName}
              onChange={handleInputChange}
              className={fieldErrors.companyName ? 'error' : ''}
              placeholder="Enter company name"
              maxLength={255}
              required
              disabled={loading}
            />
            {fieldErrors.companyName && (
              <span className="field-error">{fieldErrors.companyName}</span>
            )}
          </div>

          <div className="form-group">
            <label htmlFor="industry">Industry</label>
            <input
              type="text"
              id="industry"
              name="industry"
              value={formData.industry}
              onChange={handleInputChange}
              placeholder="e.g., Technology, Healthcare, Finance"
              maxLength={100}
              disabled={loading}
            />
          </div>

          <div className="form-group">
            <label htmlFor="address">Address</label>
            <textarea
              id="address"
              name="address"
              value={formData.address}
              onChange={handleInputChange}
              placeholder="Enter company address"
              rows={3}
              disabled={loading}
            />
          </div>

          <div className="form-group">
            <label htmlFor="status">Status</label>
            <select
              id="status"
              name="status"
              value={formData.status}
              onChange={handleInputChange}
              disabled={loading}
            >
              <option value={ClientStatus.PROSPECT}>Prospect</option>
              <option value={ClientStatus.ACTIVE}>Active</option>
              <option value={ClientStatus.INACTIVE}>Inactive</option>
              <option value={ClientStatus.EXPIRED}>Expired</option>
              <option value={ClientStatus.RENEWED}>Renewed</option>
            </select>
          </div>
        </div>

        <div className="form-section">
          <h3>Contact Information</h3>
          
          <div className="form-group">
            <label htmlFor="contactName">Contact Name *</label>
            <input
              type="text"
              id="contactName"
              name="contactName"
              value={formData.contactName}
              onChange={handleInputChange}
              className={fieldErrors.contactName ? 'error' : ''}
              placeholder="Enter primary contact name"
              maxLength={100}
              required
              disabled={loading}
            />
            {fieldErrors.contactName && (
              <span className="field-error">{fieldErrors.contactName}</span>
            )}
          </div>

          <div className="form-group">
            <label htmlFor="contactEmail">Contact Email *</label>
            <input
              type="email"
              id="contactEmail"
              name="contactEmail"
              value={formData.contactEmail}
              onChange={handleInputChange}
              className={fieldErrors.contactEmail ? 'error' : ''}
              placeholder="Enter contact email address"
              maxLength={255}
              required
              disabled={loading}
            />
            {fieldErrors.contactEmail && (
              <span className="field-error">{fieldErrors.contactEmail}</span>
            )}
          </div>

          <div className="form-group">
            <label htmlFor="contactPhone">Contact Phone</label>
            <input
              type="tel"
              id="contactPhone"
              name="contactPhone"
              value={formData.contactPhone}
              onChange={handleInputChange}
              placeholder="Enter contact phone number"
              maxLength={50}
              disabled={loading}
            />
          </div>
        </div>

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
            className="submit-button"
            disabled={loading}
          >
            {loading ? (isEditMode ? 'Updating...' : 'Creating...') : (isEditMode ? 'Update Client' : 'Create Client')}
          </button>
        </div>
      </form>
    </div>
  );
};

export default ClientForm; 