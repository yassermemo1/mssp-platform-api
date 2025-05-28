import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { apiService } from '../../../services/apiService';
import { 
  ClientLicense, 
  ClientLicenseStatus
} from '../../../types/license';
import { Client } from '../../../types/client';
import AssignLicenseModal from '../../../components/licenses/AssignLicenseModal';
import EditClientLicenseModal from '../../../components/licenses/EditClientLicenseModal';
import './ClientLicensesPage.css';

const ClientLicensesPage: React.FC = () => {
  const { clientId } = useParams<{ clientId: string }>();
  const navigate = useNavigate();
  const [client, setClient] = useState<Client | null>(null);
  const [licenses, setLicenses] = useState<ClientLicense[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedAssignment, setSelectedAssignment] = useState<ClientLicense | null>(null);

  const fetchData = useCallback(async () => {
    if (!clientId) return;

    try {
      setLoading(true);
      const [clientResponse, licensesResponse] = await Promise.all([
        apiService.get<{ statusCode: number; message: string; data: Client }>(`/clients/${clientId}`),
        apiService.getClientLicensesByClient(clientId)
      ]);
      
      setClient(clientResponse.data);
      setLicenses(licensesResponse.data);
      setError(null);
    } catch (err: any) {
      setError(err.message || 'Failed to fetch client license data');
    } finally {
      setLoading(false);
    }
  }, [clientId]);

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

  const getTotalSeatsAssigned = () => {
    return licenses
      .filter(license => license.status === ClientLicenseStatus.ACTIVE)
      .reduce((total, license) => total + license.assignedSeats, 0);
  };

  const getActiveLicenseCount = () => {
    return licenses.filter(license => license.status === ClientLicenseStatus.ACTIVE).length;
  };

  if (loading) {
    return (
      <div className="client-licenses">
        <div className="loading">Loading client licenses...</div>
      </div>
    );
  }

  if (error && !client) {
    return (
      <div className="client-licenses">
        <div className="error-container">
          <h3>Error Loading Client</h3>
          <p>{error}</p>
          <button onClick={fetchData} className="btn btn-primary">Try Again</button>
          <button onClick={() => navigate('/clients')} className="btn btn-outline">
            Back to Clients
          </button>
        </div>
      </div>
    );
  }

  if (!client) {
    return (
      <div className="client-licenses">
        <div className="error-container">
          <h3>Client Not Found</h3>
          <button onClick={() => navigate('/clients')} className="btn btn-primary">
            Back to Clients
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="client-licenses">
      <div className="page-header">
        <div className="header-content">
          <div className="breadcrumb">
            <Link to="/clients">Clients</Link>
            <span className="separator">›</span>
            <Link to={`/clients/${clientId}`}>{client.companyName}</Link>
            <span className="separator">›</span>
            <span>Licenses</span>
          </div>
          <h1>License Assignments: {client.companyName}</h1>
        </div>
        <div className="header-actions">
          <button
            onClick={() => setShowAssignModal(true)}
            className="btn btn-primary"
          >
            Assign New License
          </button>
          <Link to={`/clients/${clientId}`} className="btn btn-outline">
            View Client Details
          </Link>
        </div>
      </div>

      {error && (
        <div className="error-message">
          {error}
        </div>
      )}

      {/* Client Overview */}
      <div className="client-overview">
        <div className="overview-card">
          <div className="overview-header">
            <h3>Client Overview</h3>
          </div>
          <div className="overview-content">
            <div className="overview-item">
              <label>Company:</label>
              <span>{client.companyName}</span>
            </div>
            <div className="overview-item">
              <label>Contact:</label>
              <span>{client.contactName}</span>
            </div>
            <div className="overview-item">
              <label>Email:</label>
              <span>{client.contactEmail}</span>
            </div>
            <div className="overview-item">
              <label>Status:</label>
              <span className={`client-status ${client.status.toLowerCase()}`}>
                {client.status.toUpperCase()}
              </span>
            </div>
            <div className="overview-item">
              <label>Active Licenses:</label>
              <span className="license-count">{getActiveLicenseCount()}</span>
            </div>
            <div className="overview-item">
              <label>Total Seats:</label>
              <span className="seat-count">{getTotalSeatsAssigned()}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Licenses Table */}
      <div className="licenses-table-container">
        <div className="table-header">
          <h3>License Assignments ({licenses.length})</h3>
        </div>
        
        {licenses.length === 0 ? (
          <div className="no-licenses">
            <p>No license assignments found for this client.</p>
            <button
              onClick={() => setShowAssignModal(true)}
              className="btn btn-primary"
            >
              Assign First License
            </button>
          </div>
        ) : (
          <table className="licenses-table">
            <thead>
              <tr>
                <th>Product</th>
                <th>Vendor</th>
                <th>License Type</th>
                <th>Assigned Seats</th>
                <th>Assignment Date</th>
                <th>Status</th>
                <th>Expiry Date</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {licenses.map(license => (
                <tr key={license.id}>
                  <td>
                    <div className="product-info">
                      <strong>{license.licensePool?.productName || 'Unknown Product'}</strong>
                    </div>
                  </td>
                  <td>{license.licensePool?.vendor || 'N/A'}</td>
                  <td>
                    <span className="license-type">
                      {license.licensePool?.licenseType.replace('_', ' ').toUpperCase() || 'N/A'}
                    </span>
                  </td>
                  <td>
                    <span className="seat-count">{license.assignedSeats}</span>
                  </td>
                  <td>{formatDate(license.assignmentDate)}</td>
                  <td>
                    <select
                      value={license.status}
                      onChange={(e) => handleStatusChange(license.id, e.target.value as ClientLicenseStatus)}
                      className={getStatusBadgeClass(license.status)}
                      disabled={license.status === ClientLicenseStatus.REVOKED}
                    >
                      {Object.values(ClientLicenseStatus).map(status => (
                        <option key={status} value={status}>
                          {status.replace('_', ' ').toUpperCase()}
                        </option>
                      ))}
                    </select>
                  </td>
                  <td>
                    {license.expiryDateOverride ? (
                      <span className={new Date(license.expiryDateOverride) < new Date() ? 'expired-date' : ''}>
                        {formatDate(license.expiryDateOverride)}
                      </span>
                    ) : license.licensePool?.expiryDate ? (
                      <span className={new Date(license.licensePool.expiryDate) < new Date() ? 'expired-date' : ''}>
                        {formatDate(license.licensePool.expiryDate)} (Pool)
                      </span>
                    ) : (
                      'No expiry'
                    )}
                  </td>
                  <td>
                    <div className="actions">
                      <Link 
                        to={`/admin/license-pools/${license.licensePoolId}/assignments`}
                        className="btn btn-sm btn-secondary"
                      >
                        View Pool
                      </Link>
                      <button
                        onClick={() => handleEditAssignment(license)}
                        className="btn btn-sm btn-outline"
                        disabled={license.status === ClientLicenseStatus.REVOKED}
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleRevokeAssignment(license.id)}
                        className="btn btn-sm btn-danger"
                        disabled={license.status === ClientLicenseStatus.REVOKED}
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
        preselectedClientId={clientId}
      />

      {/* Edit License Modal */}
      <EditClientLicenseModal
        isOpen={showEditModal}
        onClose={() => setShowEditModal(false)}
        onAssignmentUpdated={handleAssignmentUpdated}
        assignment={selectedAssignment}
      />
    </div>
  );
};

export default ClientLicensesPage; 