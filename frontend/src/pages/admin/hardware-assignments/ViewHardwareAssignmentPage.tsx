import React, { useState, useEffect } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { useAuth } from '../../../contexts/AuthContext';
import { UserRole } from '../../../types/auth';
import { apiService } from '../../../services/apiService';
import { 
  ClientHardwareAssignment, 
  HardwareAssignmentStatus 
} from '../../../types/hardware';
import { ApiError } from '../../../types/auth';
import './ViewHardwareAssignmentPage.css';

/**
 * ViewHardwareAssignmentPage Component
 * Displays detailed information about a specific hardware assignment
 * Includes assignment history and action buttons for authorized users
 */
const ViewHardwareAssignmentPage: React.FC = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const [assignment, setAssignment] = useState<ClientHardwareAssignment | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [actionLoading, setActionLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  /**
   * Check if user can edit assignments
   */
  const canEdit = user?.role && [UserRole.ADMIN, UserRole.MANAGER, UserRole.ASSET_MANAGER].includes(user.role);

  /**
   * Load assignment data
   */
  useEffect(() => {
    const loadAssignment = async () => {
      if (!id) {
        setError('Assignment ID is required');
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError(null);

        const assignmentData = await apiService.getHardwareAssignment(id);
        setAssignment(assignmentData);

      } catch (err) {
        const apiError = err as ApiError;
        
        if (apiError.statusCode === 404) {
          setError('Hardware assignment not found. It may have been deleted.');
        } else if (apiError.statusCode === 403) {
          setError('You do not have permission to view this hardware assignment.');
        } else {
          setError(apiError.message || 'Failed to load hardware assignment. Please try again.');
        }
        
        console.error('Error loading hardware assignment:', err);
      } finally {
        setLoading(false);
      }
    };

    loadAssignment();
  }, [id]);

  /**
   * Handle assignment status update
   */
  const handleStatusUpdate = async (newStatus: HardwareAssignmentStatus) => {
    if (!assignment || !id) return;

    try {
      setActionLoading(true);
      setError(null);

      const updateData = {
        status: newStatus,
        returnDate: newStatus === HardwareAssignmentStatus.RETURNED ? new Date().toISOString().split('T')[0] : undefined
      };

      const updatedAssignment = await apiService.updateHardwareAssignment(id, updateData);
      setAssignment(updatedAssignment);

    } catch (err) {
      const apiError = err as ApiError;
      setError(apiError.message || 'Failed to update assignment status. Please try again.');
      console.error('Error updating assignment status:', err);
    } finally {
      setActionLoading(false);
    }
  };

  /**
   * Format status for display
   */
  const formatStatus = (status: HardwareAssignmentStatus): string => {
    return status.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
  };

  /**
   * Get status badge class
   */
  const getStatusBadgeClass = (status: HardwareAssignmentStatus): string => {
    switch (status) {
      case HardwareAssignmentStatus.ACTIVE:
        return 'status-badge status-active';
      case HardwareAssignmentStatus.RETURNED:
        return 'status-badge status-returned';
      case HardwareAssignmentStatus.MAINTENANCE:
        return 'status-badge status-maintenance';
      case HardwareAssignmentStatus.LOST:
        return 'status-badge status-lost';
      default:
        return 'status-badge status-default';
    }
  };

  /**
   * Format date for display
   */
  const formatDate = (dateString: string): string => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  // Show loading state
  if (loading) {
    return (
      <div className="view-hardware-assignment-page">
        <div className="loading-container">
          <div className="loading-spinner"></div>
          <p>Loading assignment details...</p>
        </div>
      </div>
    );
  }

  // Show error if assignment couldn't be loaded
  if (error && !assignment) {
    return (
      <div className="view-hardware-assignment-page">
        <div className="error-container">
          <div className="error-message">
            {error}
          </div>
          <div className="error-actions">
            <button 
              onClick={() => navigate('/admin/hardware-assignments')}
              className="btn btn-secondary"
            >
              Back to Assignments
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (!assignment) {
    return null;
  }

  return (
    <div className="view-hardware-assignment-page">
      <div className="assignment-details-container">
        {/* Header */}
        <div className="page-header">
          <div className="header-content">
            <h1>Hardware Assignment Details</h1>
            <p>View and manage hardware assignment information</p>
          </div>
          <div className="header-actions">
            {canEdit && (
              <Link 
                to={`/admin/hardware-assignments/${assignment.id}/edit`}
                className="btn btn-primary"
              >
                Edit Assignment
              </Link>
            )}
            <button 
              onClick={() => navigate('/admin/hardware-assignments')}
              className="btn btn-secondary"
            >
              Back to List
            </button>
          </div>
        </div>

        {error && (
          <div className="error-message">
            {error}
          </div>
        )}

        {/* Assignment Information */}
        <div className="assignment-info-grid">
          {/* Hardware Asset Information */}
          <div className="info-section">
            <h3>Hardware Asset</h3>
            <div className="info-content">
              <div className="info-row">
                <span className="label">Asset Tag:</span>
                <span className="value">{assignment.hardwareAsset?.assetTag}</span>
              </div>
              <div className="info-row">
                <span className="label">Manufacturer:</span>
                <span className="value">{assignment.hardwareAsset?.manufacturer}</span>
              </div>
              <div className="info-row">
                <span className="label">Model:</span>
                <span className="value">{assignment.hardwareAsset?.model}</span>
              </div>
              <div className="info-row">
                <span className="label">Type:</span>
                <span className="value">{assignment.hardwareAsset?.assetType.replace(/_/g, ' ')}</span>
              </div>
              {assignment.hardwareAsset?.serialNumber && (
                <div className="info-row">
                  <span className="label">Serial Number:</span>
                  <span className="value">{assignment.hardwareAsset.serialNumber}</span>
                </div>
              )}
              <div className="info-row">
                <span className="label">Location:</span>
                <span className="value">{assignment.hardwareAsset?.location || 'Not specified'}</span>
              </div>
            </div>
            <div className="section-actions">
              <Link 
                to={`/admin/hardware-assets/${assignment.hardwareAssetId}`}
                className="btn btn-outline"
              >
                View Asset Details
              </Link>
            </div>
          </div>

          {/* Client Information */}
          <div className="info-section">
            <h3>Client Information</h3>
            <div className="info-content">
              <div className="info-row">
                <span className="label">Company Name:</span>
                <span className="value">{assignment.client?.companyName}</span>
              </div>
              <div className="info-row">
                <span className="label">Contact Name:</span>
                <span className="value">{assignment.client?.contactName || 'Not specified'}</span>
              </div>
              <div className="info-row">
                <span className="label">Contact Email:</span>
                <span className="value">{assignment.client?.contactEmail || 'Not specified'}</span>
              </div>
              <div className="info-row">
                <span className="label">Contact Phone:</span>
                <span className="value">{assignment.client?.contactPhone || 'Not specified'}</span>
              </div>
            </div>
            <div className="section-actions">
              <Link 
                to={`/admin/clients/${assignment.clientId}`}
                className="btn btn-outline"
              >
                View Client Details
              </Link>
            </div>
          </div>

          {/* Service Scope Information */}
          {assignment.serviceScope && (
            <div className="info-section">
              <h3>Service Scope</h3>
              <div className="info-content">
                <div className="info-row">
                  <span className="label">Scope Name:</span>
                  <span className="value">{assignment.serviceScope.service?.name || `Service Scope ${assignment.serviceScope.id}`}</span>
                </div>
                <div className="info-row">
                  <span className="label">Description:</span>
                  <span className="value">{assignment.serviceScope.service?.description || assignment.serviceScope.notes || 'No description'}</span>
                </div>
              </div>
              <div className="section-actions">
                <Link 
                  to={`/admin/service-scopes/${assignment.serviceScopeId}`}
                  className="btn btn-outline"
                >
                  View Service Scope
                </Link>
              </div>
            </div>
          )}

          {/* Assignment Details */}
          <div className="info-section full-width">
            <h3>Assignment Details</h3>
            <div className="assignment-details-content">
              <div className="details-row">
                <div className="info-row">
                  <span className="label">Assignment Date:</span>
                  <span className="value">{formatDate(assignment.assignmentDate)}</span>
                </div>
                <div className="info-row">
                  <span className="label">Status:</span>
                  <span className={getStatusBadgeClass(assignment.status)}>
                    {formatStatus(assignment.status)}
                  </span>
                </div>
                {assignment.returnDate && (
                  <div className="info-row">
                    <span className="label">Return Date:</span>
                    <span className="value">{formatDate(assignment.returnDate)}</span>
                  </div>
                )}
              </div>
              
              {assignment.notes && (
                <div className="notes-section">
                  <span className="label">Notes:</span>
                  <div className="notes-content">{assignment.notes}</div>
                </div>
              )}

              {/* Status Actions */}
              {canEdit && assignment.status === HardwareAssignmentStatus.ACTIVE && (
                <div className="status-actions">
                  <h4>Quick Actions</h4>
                  <div className="action-buttons">
                    <button
                      onClick={() => handleStatusUpdate(HardwareAssignmentStatus.RETURNED)}
                      className="btn btn-success"
                      disabled={actionLoading}
                    >
                      {actionLoading ? 'Processing...' : 'Mark as Returned'}
                    </button>
                    <button
                      onClick={() => handleStatusUpdate(HardwareAssignmentStatus.MAINTENANCE)}
                      className="btn btn-warning"
                      disabled={actionLoading}
                    >
                      {actionLoading ? 'Processing...' : 'Mark for Maintenance'}
                    </button>
                    <button
                      onClick={() => handleStatusUpdate(HardwareAssignmentStatus.LOST)}
                      className="btn btn-danger"
                      disabled={actionLoading}
                    >
                      {actionLoading ? 'Processing...' : 'Mark as Lost'}
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Assignment History */}
        <div className="assignment-history">
          <h3>Assignment Timeline</h3>
          <div className="timeline">
            <div className="timeline-item">
              <div className="timeline-marker"></div>
              <div className="timeline-content">
                <div className="timeline-title">Assignment Created</div>
                <div className="timeline-date">{formatDate(assignment.assignmentDate)}</div>
                <div className="timeline-description">
                  Asset "{assignment.hardwareAsset?.assetTag}" assigned to "{assignment.client?.companyName}"
                  {assignment.serviceScope && ` for service scope "${assignment.serviceScope.service?.name || assignment.serviceScope.id}"`}
                </div>
              </div>
            </div>
            
            {assignment.returnDate && (
              <div className="timeline-item">
                <div className="timeline-marker"></div>
                <div className="timeline-content">
                  <div className="timeline-title">Assignment {formatStatus(assignment.status)}</div>
                  <div className="timeline-date">{formatDate(assignment.returnDate)}</div>
                  <div className="timeline-description">
                    Assignment status changed to {formatStatus(assignment.status).toLowerCase()}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ViewHardwareAssignmentPage; 