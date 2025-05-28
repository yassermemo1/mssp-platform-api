import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { apiService } from '../../../services/apiService';
import { 
  CreateLicensePoolDto, 
  UpdateLicensePoolDto, 
  LicenseType 
} from '../../../types/license';
import './AdminLicensePoolForm.css';

interface AdminLicensePoolFormProps {
  mode: 'create' | 'edit';
}

const AdminLicensePoolForm: React.FC<AdminLicensePoolFormProps> = ({ mode }) => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [formData, setFormData] = useState<CreateLicensePoolDto>({
    productName: '',
    vendor: '',
    licenseType: LicenseType.SUBSCRIPTION,
    totalSeats: 1,
    purchasedDate: new Date().toISOString().split('T')[0],
    expiryDate: '',
    licenseKeyOrAgreementId: '',
    costPerSeat: undefined,
    notes: '',
    isActive: true,
  });

  const fetchLicensePool = useCallback(async () => {
    if (!id) return;
    
    try {
      setLoading(true);
      const response = await apiService.getLicensePool(id);
      const pool = response.data;
      
      setFormData({
        productName: pool.productName,
        vendor: pool.vendor,
        licenseType: pool.licenseType,
        totalSeats: pool.totalSeats,
        purchasedDate: pool.purchasedDate.split('T')[0],
        expiryDate: pool.expiryDate ? pool.expiryDate.split('T')[0] : '',
        licenseKeyOrAgreementId: pool.licenseKeyOrAgreementId || '',
        costPerSeat: pool.costPerSeat,
        notes: pool.notes || '',
        isActive: pool.isActive,
      });
      setError(null);
    } catch (err: any) {
      setError(err.message || 'Failed to fetch license pool');
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    if (mode === 'edit' && id) {
      fetchLicensePool();
    }
  }, [mode, id, fetchLicensePool]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    
    setFormData(prev => ({
      ...prev,
      [name]: type === 'number' ? (value ? parseFloat(value) : undefined) :
              type === 'checkbox' ? (e.target as HTMLInputElement).checked :
              value
    }));
  };

  const validateForm = (): string | null => {
    if (!formData.productName.trim()) return 'Product name is required';
    if (!formData.vendor.trim()) return 'Vendor is required';
    if (!formData.licenseType) return 'License type is required';
    if (!formData.totalSeats || formData.totalSeats < 1) return 'Total seats must be at least 1';
    if (!formData.purchasedDate) return 'Purchased date is required';
    if (formData.expiryDate && new Date(formData.expiryDate) <= new Date(formData.purchasedDate)) {
      return 'Expiry date must be after purchased date';
    }
    if (formData.costPerSeat !== undefined && formData.costPerSeat < 0) {
      return 'Cost per seat cannot be negative';
    }
    return null;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const validationError = validateForm();
    if (validationError) {
      setError(validationError);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      // Prepare the data
      const submitData = {
        ...formData,
        expiryDate: formData.expiryDate || undefined,
        licenseKeyOrAgreementId: formData.licenseKeyOrAgreementId || undefined,
        notes: formData.notes || undefined,
      };

      if (mode === 'create') {
        await apiService.createLicensePool(submitData);
      } else if (mode === 'edit' && id) {
        await apiService.updateLicensePool(id, submitData as UpdateLicensePoolDto);
      }

      navigate('/admin/license-pools');
    } catch (err: any) {
      setError(err.message || `Failed to ${mode} license pool`);
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    navigate('/admin/license-pools');
  };

  if (loading && mode === 'edit') {
    return (
      <div className="admin-license-pool-form">
        <div className="loading">Loading license pool...</div>
      </div>
    );
  }

  return (
    <div className="admin-license-pool-form">
      <div className="form-header">
        <h1>{mode === 'create' ? 'Create New License Pool' : 'Edit License Pool'}</h1>
        <button type="button" onClick={handleCancel} className="btn btn-outline">
          Cancel
        </button>
      </div>

      {error && (
        <div className="error-message">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="license-pool-form">
        <div className="form-section">
          <h3>Basic Information</h3>
          
          <div className="form-row">
            <div className="form-group">
              <label htmlFor="productName">Product Name *</label>
              <input
                type="text"
                id="productName"
                name="productName"
                value={formData.productName}
                onChange={handleInputChange}
                placeholder="e.g., Microsoft Office 365 E3"
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="vendor">Vendor *</label>
              <input
                type="text"
                id="vendor"
                name="vendor"
                value={formData.vendor}
                onChange={handleInputChange}
                placeholder="e.g., Microsoft"
                required
              />
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label htmlFor="licenseType">License Type *</label>
              <select
                id="licenseType"
                name="licenseType"
                value={formData.licenseType}
                onChange={handleInputChange}
                required
              >
                {Object.values(LicenseType).map(type => (
                  <option key={type} value={type}>
                    {type.replace('_', ' ').toUpperCase()}
                  </option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label htmlFor="totalSeats">Total Seats *</label>
              <input
                type="number"
                id="totalSeats"
                name="totalSeats"
                value={formData.totalSeats}
                onChange={handleInputChange}
                min="1"
                required
              />
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label htmlFor="costPerSeat">Cost per Seat (USD)</label>
              <input
                type="number"
                id="costPerSeat"
                name="costPerSeat"
                value={formData.costPerSeat || ''}
                onChange={handleInputChange}
                min="0"
                step="0.01"
                placeholder="0.00"
              />
            </div>

            <div className="form-group">
              <label htmlFor="licenseKeyOrAgreementId">License Key / Agreement ID</label>
              <input
                type="text"
                id="licenseKeyOrAgreementId"
                name="licenseKeyOrAgreementId"
                value={formData.licenseKeyOrAgreementId}
                onChange={handleInputChange}
                placeholder="License key or agreement identifier"
              />
            </div>
          </div>
        </div>

        <div className="form-section">
          <h3>Dates</h3>
          
          <div className="form-row">
            <div className="form-group">
              <label htmlFor="purchasedDate">Purchased Date *</label>
              <input
                type="date"
                id="purchasedDate"
                name="purchasedDate"
                value={formData.purchasedDate}
                onChange={handleInputChange}
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="expiryDate">Expiry Date</label>
              <input
                type="date"
                id="expiryDate"
                name="expiryDate"
                value={formData.expiryDate}
                onChange={handleInputChange}
                min={formData.purchasedDate}
              />
              <small className="form-hint">Leave empty for perpetual licenses</small>
            </div>
          </div>
        </div>

        <div className="form-section">
          <h3>Additional Information</h3>
          
          <div className="form-group">
            <label htmlFor="notes">Notes</label>
            <textarea
              id="notes"
              name="notes"
              value={formData.notes}
              onChange={handleInputChange}
              rows={4}
              placeholder="Additional notes, terms, or conditions..."
            />
          </div>

          <div className="form-group">
            <label className="checkbox-label">
              <input
                type="checkbox"
                name="isActive"
                checked={formData.isActive}
                onChange={handleInputChange}
              />
              <span className="checkbox-text">Active license pool</span>
            </label>
            <small className="form-hint">Inactive pools cannot be assigned to clients</small>
          </div>
        </div>

        <div className="form-actions">
          <button type="button" onClick={handleCancel} className="btn btn-outline">
            Cancel
          </button>
          <button type="submit" disabled={loading} className="btn btn-primary">
            {loading ? 'Saving...' : (mode === 'create' ? 'Create License Pool' : 'Update License Pool')}
          </button>
        </div>
      </form>
    </div>
  );
};

export default AdminLicensePoolForm; 