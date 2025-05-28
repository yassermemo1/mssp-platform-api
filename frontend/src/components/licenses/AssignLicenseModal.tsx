import React, { useState, useEffect } from 'react';
import { apiService } from '../../services/apiService';
import { 
  LicensePool, 
  CreateClientLicenseDto, 
  ClientLicenseStatus
} from '../../types/license';
import { Client } from '../../types/client';
import './AssignLicenseModal.css';

interface AssignLicenseModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAssignmentCreated: () => void;
  preselectedPoolId?: string;
  preselectedClientId?: string;
}

const AssignLicenseModal: React.FC<AssignLicenseModalProps> = ({
  isOpen,
  onClose,
  onAssignmentCreated,
  preselectedPoolId,
  preselectedClientId
}) => {
  const [clients, setClients] = useState<Client[]>([]);
  const [licensePools, setLicensePools] = useState<LicensePool[]>([]);
  const [selectedPool, setSelectedPool] = useState<LicensePool | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [formData, setFormData] = useState<CreateClientLicenseDto>({
    licensePoolId: preselectedPoolId || '',
    clientId: preselectedClientId || '',
    assignedSeats: 1,
    assignmentDate: new Date().toISOString().split('T')[0],
    status: ClientLicenseStatus.ACTIVE,
    expiryDateOverride: '',
    specificLicenseKeys: '',
    notes: '',
  });

  useEffect(() => {
    if (isOpen) {
      fetchData();
      // Reset form when modal opens
      setFormData({
        licensePoolId: preselectedPoolId || '',
        clientId: preselectedClientId || '',
        assignedSeats: 1,
        assignmentDate: new Date().toISOString().split('T')[0],
        status: ClientLicenseStatus.ACTIVE,
        expiryDateOverride: '',
        specificLicenseKeys: '',
        notes: '',
      });
      setError(null);
    }
  }, [isOpen, preselectedPoolId, preselectedClientId]);

  useEffect(() => {
    if (formData.licensePoolId) {
      const pool = licensePools.find(p => p.id === formData.licensePoolId);
      setSelectedPool(pool || null);
    } else {
      setSelectedPool(null);
    }
  }, [formData.licensePoolId, licensePools]);

  const fetchData = async () => {
    try {
      const [clientsResponse, poolsResponse] = await Promise.all([
        apiService.getClients(),
        apiService.getLicensePools({ isActive: true })
      ]);
      
      setClients(clientsResponse.data);
      setLicensePools(poolsResponse.data);
    } catch (err: any) {
      setError(err.message || 'Failed to fetch data');
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    
    setFormData(prev => ({
      ...prev,
      [name]: type === 'number' ? (value ? parseInt(value, 10) : 1) : value
    }));
  };

  const getAvailableSeats = (): number => {
    if (!selectedPool) return 0;
    const assigned = selectedPool.assignedSeats || 0;
    return selectedPool.totalSeats - assigned;
  };

  const validateForm = (): string | null => {
    if (!formData.licensePoolId) return 'Please select a license pool';
    if (!formData.clientId) return 'Please select a client';
    if (!formData.assignedSeats || formData.assignedSeats < 1) return 'Assigned seats must be at least 1';
    
    const availableSeats = getAvailableSeats();
    if (formData.assignedSeats > availableSeats) {
      return `Cannot assign ${formData.assignedSeats} seats. Only ${availableSeats} seats available.`;
    }
    
    if (!formData.assignmentDate) return 'Assignment date is required';
    if (formData.expiryDateOverride && new Date(formData.expiryDateOverride) <= new Date(formData.assignmentDate)) {
      return 'Expiry date override must be after assignment date';
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
        expiryDateOverride: formData.expiryDateOverride || undefined,
        specificLicenseKeys: formData.specificLicenseKeys || undefined,
        notes: formData.notes || undefined,
      };

      await apiService.createClientLicense(submitData);
      onAssignmentCreated();
      onClose();
    } catch (err: any) {
      setError(err.message || 'Failed to assign license');
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    if (!loading) {
      onClose();
    }
  };

  if (!isOpen) return null;

  const availableSeats = getAvailableSeats();

  return (
    <div className="modal-overlay" onClick={handleClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>Assign License to Client</h2>
          <button type="button" onClick={handleClose} className="modal-close" disabled={loading}>
            ×
          </button>
        </div>

        {error && (
          <div className="error-message">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="assign-license-form">
          <div className="form-section">
            <div className="form-group">
              <label htmlFor="licensePoolId">License Pool *</label>
              <select
                id="licensePoolId"
                name="licensePoolId"
                value={formData.licensePoolId}
                onChange={handleInputChange}
                required
                disabled={!!preselectedPoolId}
              >
                <option value="">Select a license pool...</option>
                {licensePools.map(pool => (
                  <option key={pool.id} value={pool.id}>
                    {pool.productName} ({pool.vendor}) - {pool.totalSeats - (pool.assignedSeats || 0)} available
                  </option>
                ))}
              </select>
            </div>

            {selectedPool && (
              <div className="pool-info">
                <div className="pool-details">
                  <strong>{selectedPool.productName}</strong> by {selectedPool.vendor}
                </div>
                <div className="seat-availability">
                  <span className={`availability-indicator ${availableSeats <= 0 ? 'no-seats' : availableSeats <= selectedPool.totalSeats * 0.1 ? 'low-seats' : 'good-availability'}`}>
                    {availableSeats} of {selectedPool.totalSeats} seats available
                  </span>
                </div>
              </div>
            )}

            <div className="form-group">
              <label htmlFor="clientId">Client *</label>
              <select
                id="clientId"
                name="clientId"
                value={formData.clientId}
                onChange={handleInputChange}
                required
                disabled={!!preselectedClientId}
              >
                <option value="">Select a client...</option>
                {clients.map(client => (
                  <option key={client.id} value={client.id}>
                    {client.companyName} ({client.contactName})
                  </option>
                ))}
              </select>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label htmlFor="assignedSeats">Assigned Seats *</label>
                <input
                  type="number"
                  id="assignedSeats"
                  name="assignedSeats"
                  value={formData.assignedSeats}
                  onChange={handleInputChange}
                  min="1"
                  max={availableSeats}
                  required
                />
                {selectedPool && (
                  <small className="form-hint">
                    Maximum: {availableSeats} seats
                  </small>
                )}
              </div>

              <div className="form-group">
                <label htmlFor="status">Status</label>
                <select
                  id="status"
                  name="status"
                  value={formData.status}
                  onChange={handleInputChange}
                >
                  {Object.values(ClientLicenseStatus).map(status => (
                    <option key={status} value={status}>
                      {status.replace('_', ' ').toUpperCase()}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label htmlFor="assignmentDate">Assignment Date *</label>
                <input
                  type="date"
                  id="assignmentDate"
                  name="assignmentDate"
                  value={formData.assignmentDate}
                  onChange={handleInputChange}
                  required
                />
              </div>

              <div className="form-group">
                <label htmlFor="expiryDateOverride">Expiry Date Override</label>
                <input
                  type="date"
                  id="expiryDateOverride"
                  name="expiryDateOverride"
                  value={formData.expiryDateOverride}
                  onChange={handleInputChange}
                  min={formData.assignmentDate}
                />
                <small className="form-hint">Override pool expiry date for this assignment</small>
              </div>
            </div>

            <div className="form-group">
              <label htmlFor="specificLicenseKeys">Specific License Keys</label>
              <input
                type="text"
                id="specificLicenseKeys"
                name="specificLicenseKeys"
                value={formData.specificLicenseKeys}
                onChange={handleInputChange}
                placeholder="Comma-separated license keys if applicable"
              />
            </div>

            <div className="form-group">
              <label htmlFor="notes">Notes</label>
              <textarea
                id="notes"
                name="notes"
                value={formData.notes}
                onChange={handleInputChange}
                rows={3}
                placeholder="Additional notes about this assignment..."
              />
            </div>
          </div>

          <div className="modal-actions">
            <button type="button" onClick={handleClose} className="btn btn-outline" disabled={loading}>
              Cancel
            </button>
            <button type="submit" disabled={loading || availableSeats <= 0} className="btn btn-primary">
              {loading ? 'Assigning...' : 'Assign License'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AssignLicenseModal; 