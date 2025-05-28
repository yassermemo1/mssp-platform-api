import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { apiService } from '../../../services/apiService';
import { 
  LicensePool, 
  ClientLicense, 
  ClientLicenseStatus
} from '../../../types/license';
import AssignLicenseModal from '../../../components/licenses/AssignLicenseModal';
import EditClientLicenseModal from '../../../components/licenses/EditClientLicenseModal';
import './LicensePoolAssignmentsPage.css';

const LicensePoolAssignmentsPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [licensePool, setLicensePool] = useState<LicensePool | null>(null);
  const [assignments, setAssignments] = useState<ClientLicense[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedAssignment, setSelectedAssignment] = useState<ClientLicense | null>(null);

  const fetchData = useCallback(async () => {
    if (!id) return;

    try {
      setLoading(true);
      const [poolResponse, assignmentsResponse] = await Promise.all([
        apiService.getLicensePool(id),
        apiService.getClientLicensesByPool(id)
      ]);
      
      setLicensePool(poolResponse.data);
      setAssignments(assignmentsResponse.data);
      setError(null);
    } catch (err: any) {
      setError(err.message || 'Failed to fetch license pool data');
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleAssignmentCreated = () => {
    fetchData(); // Refresh the data
  };

  const handleAssignmentUpdated = () => {
    fetchData(); // Refresh the data
    setSelectedAssignment(null);
  };

  const handleEditAssignment = (assignment: ClientLicense) => {
    setSelectedAssignment(assignment);
    setShowEditModal(true);
  };

  const handleRevokeAssignment = async (assignmentId: string) => {
    if (!window.confirm('Are you sure you want to revoke this license assignment?')) {
      return;
    }

    try {
      await apiService.deleteClientLicense(assignmentId);
      await fetchData(); // Refresh the data
    } catch (err: any) {
      setError(err.message || 'Failed to revoke license assignment');
    }
  };

  const handleStatusChange = async (assignmentId: string, newStatus: ClientLicenseStatus) => {
    try {
      await apiService.updateClientLicense(assignmentId, { status: newStatus });
      await fetchData(); // Refresh the data
    } catch (err: any) {
      setError(err.message || 'Failed to update assignment status');
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString();
  };

  const getStatusBadgeClass = (status: ClientLicenseStatus) => {
    switch (status) {
      case ClientLicenseStatus.ACTIVE:
        return 'status-badge status-active';
      case ClientLicenseStatus.INACTIVE:
        return 'status-badge status-inactive';
      case ClientLicenseStatus.EXPIRED:
        return 'status-badge status-expired';
      case ClientLicenseStatus.REVOKED:
        return 'status-badge status-revoked';
      case ClientLicenseStatus.PENDING:
        return 'status-badge status-pending';
      case ClientLicenseStatus.SUSPENDED:
        return 'status-badge status-suspended';
      default:
        return 'status-badge status-default';
    }
  };

  const calculateAvailableSeats = () => {
    if (!licensePool) return 0;
    const assignedSeats = assignments
      .filter(a => a.status === ClientLicenseStatus.ACTIVE)
      .reduce((total, assignment) => total + assignment.assignedSeats, 0);
    return licensePool.totalSeats - assignedSeats;
  };

  if (loading) {
    return (
      <div className="license-pool-assignments">
        <div className="loading">Loading license pool assignments...</div>
      </div>
    );
  }

  if (error && !licensePool) {
    return (
      <div className="license-pool-assignments">
        <div className="error-container">
          <h3>Error Loading License Pool</h3>
          <p>{error}</p>
          <button onClick={fetchData} className="btn btn-primary">Try Again</button>
          <button onClick={() => navigate('/admin/license-pools')} className="btn btn-outline">
            Back to License Pools
          </button>
        </div>
      </div>
    );
  }

  if (!licensePool) {
    return (
      <div className="license-pool-assignments">
        <div className="error-container">
          <h3>License Pool Not Found</h3>
          <button onClick={() => navigate('/admin/license-pools')} className="btn btn-primary">
            Back to License Pools
          </button>
        </div>
      </div>
    );
  }

  const availableSeats = calculateAvailableSeats();

  return (
    <div className="license-pool-assignments">
      <div className="page-header">
        <div className="header-content">
          <div className="breadcrumb">
            <Link to="/admin/license-pools">License Pools</Link>
            <span className="separator">›</span>
            <span>{licensePool.productName}</span>
            <span className="separator">›</span>
            <span>Assignments</span>
          </div>
          <h1>License Assignments: {licensePool.productName}</h1>
        </div>
        <div className="header-actions">
          <button
            onClick={() => setShowAssignModal(true)}
            className="btn btn-primary"
            disabled={availableSeats <= 0}
          >
            Assign License
          </button>
          <Link to={`/admin/license-pools/${id}/edit`} className="btn btn-outline">
            Edit Pool
          </Link>
        </div>
      </div>

      {error && (
        <div className="error-message">
          {error}
        </div>
      )}

      {/* Pool Overview */}
      <div className="pool-overview">
        <div className="overview-card">
          <div className="overview-header">
            <h3>Pool Overview</h3>
          </div>
          <div className="overview-content">
            <div className="overview-item">
              <label>Product:</label>
              <span>{licensePool.productName}</span>
            </div>
            <div className="overview-item">
              <label>Vendor:</label>
              <span>{licensePool.vendor}</span>
            </div>
            <div className="overview-item">
              <label>License Type:</label>
              <span className="license-type">
                {licensePool.licenseType.replace('_', ' ').toUpperCase()}
              </span>
            </div>
            <div className="overview-item">
              <label>Total Seats:</label>
              <span>{licensePool.totalSeats}</span>
            </div>
            <div className="overview-item">
              <label>Available Seats:</label>
              <span className={`seat-count ${availableSeats <= 0 ? 'no-seats' : availableSeats <= licensePool.totalSeats * 0.1 ? 'low-seats' : 'good-availability'}`}>
                {availableSeats}
              </span>
            </div>
            {licensePool.expiryDate && (
              <div className="overview-item">
                <label>Expiry Date:</label>
                <span className={new Date(licensePool.expiryDate) < new Date() ? 'expired-date' : ''}>
                  {formatDate(licensePool.expiryDate)}
                </span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Assignments Table */}
      <div className="assignments-table-container">
        <div className="table-header">
          <h3>License Assignments ({assignments.length})</h3>
        </div>
        
        {assignments.length === 0 ? (
          <div className="no-assignments">
            <p>No license assignments found for this pool.</p>
            <button
              onClick={() => setShowAssignModal(true)}
              className="btn btn-primary"
              disabled={availableSeats <= 0}
            >
              Create First Assignment
            </button>
          </div>
        ) : (
          <table className="assignments-table">
            <thead>
              <tr>
                <th>Client</th>
                <th>Contact</th>
                <th>Assigned Seats</th>
                <th>Assignment Date</th>
                <th>Status</th>
                <th>Expiry Date</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {assignments.map(assignment => (
                <tr key={assignment.id}>
                  <td>
                    <div className="client-info">
                      <strong>{assignment.client?.companyName || 'Unknown Client'}</strong>
                    </div>
                  </td>
                  <td>{assignment.client?.contactName || 'N/A'}</td>
                  <td>
                    <span className="seat-count">{assignment.assignedSeats}</span>
                  </td>
                  <td>{formatDate(assignment.assignmentDate)}</td>
                  <td>
                    <select
                      value={assignment.status}
                      onChange={(e) => handleStatusChange(assignment.id, e.target.value as ClientLicenseStatus)}
                      className={getStatusBadgeClass(assignment.status)}
                      disabled={assignment.status === ClientLicenseStatus.REVOKED}
                    >
                      {Object.values(ClientLicenseStatus).map(status => (
                        <option key={status} value={status}>
                          {status.replace('_', ' ').toUpperCase()}
                        </option>
                      ))}
                    </select>
                  </td>
                  <td>
                    {assignment.expiryDateOverride ? (
                      <span className={new Date(assignment.expiryDateOverride) < new Date() ? 'expired-date' : ''}>
                        {formatDate(assignment.expiryDateOverride)}
                      </span>
                    ) : licensePool.expiryDate ? (
                      <span className={new Date(licensePool.expiryDate) < new Date() ? 'expired-date' : ''}>
                        {formatDate(licensePool.expiryDate)} (Pool)
                      </span>
                    ) : (
                      'No expiry'
                    )}
                  </td>
                  <td>
                    <div className="actions">
                      <Link 
                        to={`/admin/clients/${assignment.clientId}/licenses`}
                        className="btn btn-sm btn-secondary"
                      >
                        View Client
                      </Link>
                      <button
                        onClick={() => handleEditAssignment(assignment)}
                        className="btn btn-sm btn-outline"
                        disabled={assignment.status === ClientLicenseStatus.REVOKED}
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleRevokeAssignment(assignment.id)}
                        className="btn btn-sm btn-danger"
                        disabled={assignment.status === ClientLicenseStatus.REVOKED}
                      >
                        Revoke
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Assign License Modal */}
      <AssignLicenseModal
        isOpen={showAssignModal}
        onClose={() => setShowAssignModal(false)}
        onAssignmentCreated={handleAssignmentCreated}
        preselectedPoolId={id}
      />

      {/* Edit Client License Modal */}
      <EditClientLicenseModal
        isOpen={showEditModal}
        onClose={() => setShowEditModal(false)}
        onAssignmentUpdated={handleAssignmentUpdated}
        assignment={selectedAssignment}
      />
    </div>
  );
};

export default LicensePoolAssignmentsPage; 