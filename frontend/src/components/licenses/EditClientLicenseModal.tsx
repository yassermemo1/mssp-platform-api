import React, { useState, useEffect } from 'react';
import { apiService } from '../../services/apiService';
import { 
  ClientLicense,
  UpdateClientLicenseDto, 
  ClientLicenseStatus
} from '../../types/license';
import './AssignLicenseModal.css';

interface EditClientLicenseModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAssignmentUpdated: () => void;
  assignment: ClientLicense | null;
}

const EditClientLicenseModal: React.FC<EditClientLicenseModalProps> = ({
  isOpen,
  onClose,
  onAssignmentUpdated,
  assignment
}) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [formData, setFormData] = useState<UpdateClientLicenseDto>({
    assignedSeats: 1,
    status: ClientLicenseStatus.ACTIVE,
    expiryDateOverride: '',
    specificLicenseKeys: '',
    notes: '',
  });

  useEffect(() => {
    if (isOpen && assignment) {
      // Pre-fill form with existing assignment data
      setFormData({
        assignedSeats: assignment.assignedSeats,
        status: assignment.status,
        expiryDateOverride: assignment.expiryDateOverride || '',
        specificLicenseKeys: assignment.specificLicenseKeys || '',
        notes: assignment.notes || '',
      });
      setError(null);
    }
  }, [isOpen, assignment]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    
    setFormData(prev => ({
      ...prev,
      [name]: type === 'number' ? (value ? parseInt(value, 10) : 1) : value
    }));
  };

  const getAvailableSeats = (): number => {
    if (!assignment?.licensePool) return 0;
    const pool = assignment.licensePool;
    const currentlyAssigned = pool.assignedSeats || 0;
    // Add back the current assignment's seats to get the true available count
    const availableWithoutCurrent = pool.totalSeats - currentlyAssigned + assignment.assignedSeats;
    return availableWithoutCurrent;
  };

  const validateForm = (): string | null => {
    if (!formData.assignedSeats || formData.assignedSeats < 1) {
      return 'Assigned seats must be at least 1';
    }
    
    const availableSeats = getAvailableSeats();
    if (formData.assignedSeats > availableSeats) {
      return `Cannot assign ${formData.assignedSeats} seats. Only ${availableSeats} seats available.`;
    }
    
    if (formData.expiryDateOverride && assignment) {
      const assignmentDate = new Date(assignment.assignmentDate);
      const expiryDate = new Date(formData.expiryDateOverride);
      if (expiryDate <= assignmentDate) {
        return 'Expiry date override must be after assignment date';
      }
    }
    
    return null;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!assignment) {
      setError('No assignment data available');
      return;
    }

    const validationError = validateForm();
    if (validationError) {
      setError(validationError);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      // Prepare the data
      const submitData: UpdateClientLicenseDto = {
        assignedSeats: formData.assignedSeats,
        status: formData.status,
        expiryDateOverride: formData.expiryDateOverride || undefined,
        specificLicenseKeys: formData.specificLicenseKeys || undefined,
        notes: formData.notes || undefined,
      };

      await apiService.updateClientLicense(assignment.id, submitData);
      onAssignmentUpdated();
      onClose();
    } catch (err: any) {
      setError(err.message || 'Failed to update license assignment');
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    if (!loading) {
      onClose();
    }
  };

  if (!isOpen || !assignment) return null;

  const availableSeats = getAvailableSeats();

  return (
    <div className="modal-overlay" onClick={handleClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>Edit License Assignment</h2>
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
            {/* Assignment Info (Read-only) */}
            <div className="assignment-info">
              <div className="info-row">
                <div className="info-item">
                  <label>License Pool:</label>
                  <span><strong>{assignment.licensePool?.productName}</strong> by {assignment.licensePool?.vendor}</span>
                </div>
                <div className="info-item">
                  <label>Client:</label>
                  <span><strong>{assignment.client?.companyName}</strong></span>
                </div>
              </div>
              <div className="info-row">
                <div className="info-item">
                  <label>Assignment Date:</label>
                  <span>{new Date(assignment.assignmentDate).toLocaleDateString()}</span>
                </div>
                <div className="info-item">
                  <label>Pool Total Seats:</label>
                  <span>{assignment.licensePool?.totalSeats}</span>
                </div>
              </div>
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
                <small className="form-hint">
                  Maximum: {availableSeats} seats (including current assignment)
                </small>
              </div>

              <div className="form-group">
                <label htmlFor="status">Status *</label>
                <select
                  id="status"
                  name="status"
                  value={formData.status}
                  onChange={handleInputChange}
                  required
                >
                  {Object.values(ClientLicenseStatus).map(status => (
                    <option key={status} value={status}>
                      {status.replace('_', ' ').toUpperCase()}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="form-group">
              <label htmlFor="expiryDateOverride">Expiry Date Override</label>
              <input
                type="date"
                id="expiryDateOverride"
                name="expiryDateOverride"
                value={formData.expiryDateOverride}
                onChange={handleInputChange}
                min={assignment.assignmentDate.split('T')[0]}
              />
              <small className="form-hint">
                Override pool expiry date for this assignment
                {assignment.licensePool?.expiryDate && (
                  <span> (Pool expires: {new Date(assignment.licensePool.expiryDate).toLocaleDateString()})</span>
                )}
              </small>
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

          <div className="form-actions">
            <button type="button" onClick={handleClose} className="btn btn-outline" disabled={loading}>
              Cancel
            </button>
            <button type="submit" disabled={loading} className="btn btn-primary">
              {loading ? 'Updating...' : 'Update Assignment'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EditClientLicenseModal; 