import React, { useState, useEffect } from 'react';
import { 
  HardwareAsset, 
  ClientHardwareAssignment, 
  HardwareAssignmentStatus 
} from '../../types/hardware';
import { Client } from '../../types/client';
import { ServiceScope } from '../../types/service-scope';
import { apiService } from '../../services/apiService';
import './BulkHardwareOperations.css';

interface BulkHardwareOperationsProps {
  selectedAssets?: HardwareAsset[];
  selectedAssignments?: ClientHardwareAssignment[];
  onOperationComplete: () => void;
  onClose: () => void;
}

type OperationType = 'bulk-assign' | 'bulk-return' | 'bulk-transfer' | 'bulk-status-update';

/**
 * BulkHardwareOperations Component
 * Handles bulk operations for hardware assets and assignments
 */
const BulkHardwareOperations: React.FC<BulkHardwareOperationsProps> = ({
  selectedAssets = [],
  selectedAssignments = [],
  onOperationComplete,
  onClose
}) => {
  const [operationType, setOperationType] = useState<OperationType>('bulk-assign');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Form data states
  const [clients, setClients] = useState<Client[]>([]);
  const [serviceScopes, setServiceScopes] = useState<ServiceScope[]>([]);
  const [selectedClientId, setSelectedClientId] = useState<string>('');
  const [selectedServiceScopeId, setSelectedServiceScopeId] = useState<string>('');
  const [operationDate, setOperationDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [notes, setNotes] = useState<string>('');
  const [newStatus, setNewStatus] = useState<string>('');

  /**
   * Load clients on component mount
   */
  useEffect(() => {
    const loadClients = async () => {
      try {
        const result = await apiService.getClients();
        setClients(result.data);
      } catch (err) {
        console.error('Error loading clients:', err);
      }
    };

    loadClients();
  }, []);

  /**
   * Load service scopes when client changes
   */
  useEffect(() => {
    const loadServiceScopes = async () => {
      if (!selectedClientId) {
        setServiceScopes([]);
        return;
      }

      try {
        const scopes = await apiService.getClientServiceScopes(selectedClientId);
        setServiceScopes(scopes);
      } catch (err) {
        console.error('Error loading service scopes:', err);
        setServiceScopes([]);
      }
    };

    loadServiceScopes();
  }, [selectedClientId]);

  /**
   * Handle operation type change
   */
  const handleOperationTypeChange = (type: OperationType) => {
    setOperationType(type);
    setError(null);
    setSuccess(null);
    // Reset form data
    setSelectedClientId('');
    setSelectedServiceScopeId('');
    setNotes('');
    setNewStatus('');
  };

  /**
   * Handle bulk assign operation
   */
  const handleBulkAssign = async () => {
    if (!selectedClientId) {
      setError('Please select a client');
      return;
    }

    if (selectedAssets.length === 0) {
      setError('No assets selected for assignment');
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const assignmentData = {
        hardwareAssetIds: selectedAssets.map(asset => asset.id),
        clientId: selectedClientId,
        serviceScopeId: selectedServiceScopeId || undefined,
        assignmentDate: operationDate,
        notes: notes.trim() || undefined
      };

      const result = await apiService.bulkAssignHardwareAssets(assignmentData);
      setSuccess(`Successfully assigned ${result.length} assets to ${clients.find(c => c.id === selectedClientId)?.companyName}`);
      
      setTimeout(() => {
        onOperationComplete();
        onClose();
      }, 2000);

    } catch (err: any) {
      setError(err.message || 'Failed to assign assets. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  /**
   * Handle bulk return operation
   */
  const handleBulkReturn = async () => {
    if (selectedAssignments.length === 0) {
      setError('No assignments selected for return');
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const returnData = {
        assignmentIds: selectedAssignments.map(assignment => assignment.id),
        returnDate: operationDate,
        notes: notes.trim() || undefined
      };

      const result = await apiService.bulkReturnHardwareAssignments(returnData);
      setSuccess(`Successfully returned ${result.length} assignments`);
      
      setTimeout(() => {
        onOperationComplete();
        onClose();
      }, 2000);

    } catch (err: any) {
      setError(err.message || 'Failed to return assignments. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  /**
   * Handle bulk transfer operation
   */
  const handleBulkTransfer = async () => {
    if (!selectedClientId) {
      setError('Please select a new client');
      return;
    }

    if (selectedAssignments.length === 0) {
      setError('No assignments selected for transfer');
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const transferData = {
        assignmentIds: selectedAssignments.map(assignment => assignment.id),
        newClientId: selectedClientId,
        newServiceScopeId: selectedServiceScopeId || undefined,
        transferDate: operationDate,
        notes: notes.trim() || undefined
      };

      const result = await apiService.transferHardwareAssignments(transferData);
      setSuccess(`Successfully transferred ${result.length} assignments to ${clients.find(c => c.id === selectedClientId)?.companyName}`);
      
      setTimeout(() => {
        onOperationComplete();
        onClose();
      }, 2000);

    } catch (err: any) {
      setError(err.message || 'Failed to transfer assignments. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  /**
   * Handle bulk status update operation
   */
  const handleBulkStatusUpdate = async () => {
    if (!newStatus) {
      setError('Please select a new status');
      return;
    }

    if (selectedAssets.length === 0) {
      setError('No assets selected for status update');
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const statusData = {
        assetIds: selectedAssets.map(asset => asset.id),
        status: newStatus,
        notes: notes.trim() || undefined
      };

      const result = await apiService.bulkUpdateHardwareAssetStatus(statusData);
      setSuccess(`Successfully updated status for ${result.length} assets`);
      
      setTimeout(() => {
        onOperationComplete();
        onClose();
      }, 2000);

    } catch (err: any) {
      setError(err.message || 'Failed to update asset statuses. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  /**
   * Handle form submission
   */
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    switch (operationType) {
      case 'bulk-assign':
        await handleBulkAssign();
        break;
      case 'bulk-return':
        await handleBulkReturn();
        break;
      case 'bulk-transfer':
        await handleBulkTransfer();
        break;
      case 'bulk-status-update':
        await handleBulkStatusUpdate();
        break;
    }
  };

  /**
   * Get operation title
   */
  const getOperationTitle = (): string => {
    switch (operationType) {
      case 'bulk-assign':
        return 'Bulk Assign Assets';
      case 'bulk-return':
        return 'Bulk Return Assignments';
      case 'bulk-transfer':
        return 'Bulk Transfer Assignments';
      case 'bulk-status-update':
        return 'Bulk Update Asset Status';
      default:
        return 'Bulk Operations';
    }
  };

  /**
   * Check if operation is valid
   */
  const isOperationValid = (): boolean => {
    switch (operationType) {
      case 'bulk-assign':
        return selectedAssets.length > 0 && !!selectedClientId;
      case 'bulk-return':
        return selectedAssignments.length > 0;
      case 'bulk-transfer':
        return selectedAssignments.length > 0 && !!selectedClientId;
      case 'bulk-status-update':
        return selectedAssets.length > 0 && !!newStatus;
      default:
        return false;
    }
  };

  if (success) {
    return (
      <div className="bulk-operations-modal">
        <div className="bulk-operations-content">
          <div className="success-container">
            <div className="success-icon">✓</div>
            <h3>Operation Completed Successfully!</h3>
            <p>{success}</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bulk-operations-modal">
      <div className="bulk-operations-content">
        <div className="modal-header">
          <h2>{getOperationTitle()}</h2>
          <button onClick={onClose} className="close-button">×</button>
        </div>

        {/* Operation Type Selector */}
        <div className="operation-selector">
          <div className="operation-tabs">
            <button
              className={operationType === 'bulk-assign' ? 'tab active' : 'tab'}
              onClick={() => handleOperationTypeChange('bulk-assign')}
              disabled={selectedAssets.length === 0}
            >
              Assign Assets ({selectedAssets.length})
            </button>
            <button
              className={operationType === 'bulk-return' ? 'tab active' : 'tab'}
              onClick={() => handleOperationTypeChange('bulk-return')}
              disabled={selectedAssignments.length === 0}
            >
              Return Assignments ({selectedAssignments.length})
            </button>
            <button
              className={operationType === 'bulk-transfer' ? 'tab active' : 'tab'}
              onClick={() => handleOperationTypeChange('bulk-transfer')}
              disabled={selectedAssignments.length === 0}
            >
              Transfer Assignments ({selectedAssignments.length})
            </button>
            <button
              className={operationType === 'bulk-status-update' ? 'tab active' : 'tab'}
              onClick={() => handleOperationTypeChange('bulk-status-update')}
              disabled={selectedAssets.length === 0}
            >
              Update Status ({selectedAssets.length})
            </button>
          </div>
        </div>

        {error && (
          <div className="error-message">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="bulk-operations-form">
          {/* Client Selection (for assign and transfer) */}
          {(operationType === 'bulk-assign' || operationType === 'bulk-transfer') && (
            <div className="form-group">
              <label htmlFor="clientId" className="required">
                {operationType === 'bulk-transfer' ? 'New Client' : 'Client'}
              </label>
              <select
                id="clientId"
                value={selectedClientId}
                onChange={(e) => setSelectedClientId(e.target.value)}
                required
              >
                <option value="">Select a client...</option>
                {clients.map(client => (
                  <option key={client.id} value={client.id}>
                    {client.companyName}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Service Scope Selection (optional for assign and transfer) */}
          {(operationType === 'bulk-assign' || operationType === 'bulk-transfer') && selectedClientId && (
            <div className="form-group">
              <label htmlFor="serviceScopeId">Service Scope (Optional)</label>
              <select
                id="serviceScopeId"
                value={selectedServiceScopeId}
                onChange={(e) => setSelectedServiceScopeId(e.target.value)}
              >
                <option value="">General assignment (no specific service scope)</option>
                {serviceScopes.map(scope => (
                  <option key={scope.id} value={scope.id}>
                    {scope.service?.name || `Service Scope ${scope.id}`}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Status Selection (for status update) */}
          {operationType === 'bulk-status-update' && (
            <div className="form-group">
              <label htmlFor="newStatus" className="required">New Status</label>
              <select
                id="newStatus"
                value={newStatus}
                onChange={(e) => setNewStatus(e.target.value)}
                required
              >
                <option value="">Select new status...</option>
                <option value="in_stock">In Stock</option>
                <option value="awaiting_deployment">Awaiting Deployment</option>
                <option value="assigned">Assigned</option>
                <option value="maintenance">Maintenance</option>
                <option value="retired">Retired</option>
                <option value="lost">Lost</option>
                <option value="damaged">Damaged</option>
              </select>
            </div>
          )}

          {/* Date Selection */}
          <div className="form-group">
            <label htmlFor="operationDate" className="required">
              {operationType === 'bulk-return' ? 'Return Date' : 
               operationType === 'bulk-transfer' ? 'Transfer Date' : 
               'Operation Date'}
            </label>
            <input
              type="date"
              id="operationDate"
              value={operationDate}
              onChange={(e) => setOperationDate(e.target.value)}
              required
            />
          </div>

          {/* Notes */}
          <div className="form-group">
            <label htmlFor="notes">Notes</label>
            <textarea
              id="notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Enter any additional notes about this operation"
              rows={3}
            />
          </div>

          {/* Form Actions */}
          <div className="form-actions">
            <button
              type="button"
              onClick={onClose}
              className="btn btn-secondary"
              disabled={loading}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="btn btn-primary"
              disabled={loading || !isOperationValid()}
            >
              {loading ? 'Processing...' : `Execute ${getOperationTitle()}`}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default BulkHardwareOperations; 