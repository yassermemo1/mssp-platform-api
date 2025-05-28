import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { apiService } from '../../../services/apiService';
import { 
  LicensePool, 
  ClientLicense, 
  ClientLicenseStatus,
  LicenseType 
} from '../../../types/license';
import './LicensePoolDetailsPage.css';

const LicensePoolDetailsPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [licensePool, setLicensePool] = useState<LicensePool | null>(null);
  const [assignments, setAssignments] = useState<ClientLicense[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

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

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString();
  };

  const formatCurrency = (amount: number | null | undefined) => {
    if (!amount) return 'N/A';
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  };

  const getLicenseTypeBadgeClass = (licenseType: LicenseType) => {
    switch (licenseType) {
      case LicenseType.PERPETUAL:
        return 'license-type-badge license-type-perpetual';
      case LicenseType.SUBSCRIPTION:
        return 'license-type-badge license-type-subscription';
      case LicenseType.TRIAL:
        return 'license-type-badge license-type-trial';
      default:
        return 'license-type-badge license-type-default';
    }
  };

  const calculateAvailableSeats = () => {
    if (!licensePool) return 0;
    const assignedSeats = assignments
      .filter(a => a.status === ClientLicenseStatus.ACTIVE)
      .reduce((total, assignment) => total + assignment.assignedSeats, 0);
    return licensePool.totalSeats - assignedSeats;
  };

  const getActiveAssignments = () => {
    return assignments.filter(a => a.status === ClientLicenseStatus.ACTIVE);
  };

  if (loading) {
    return (
      <div className="license-pool-details">
        <div className="loading">Loading license pool details...</div>
      </div>
    );
  }

  if (error && !licensePool) {
    return (
      <div className="license-pool-details">
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
      <div className="license-pool-details">
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
  const activeAssignments = getActiveAssignments();

  return (
    <div className="license-pool-details">
      <div className="page-header">
        <div className="header-content">
          <div className="breadcrumb">
            <Link to="/admin/license-pools">License Pools</Link>
            <span className="separator">›</span>
            <span>{licensePool.productName}</span>
          </div>
          <h1>{licensePool.productName}</h1>
          <div className="pool-meta">
            <span className={getLicenseTypeBadgeClass(licensePool.licenseType)}>
              {licensePool.licenseType.replace('_', ' ').toUpperCase()}
            </span>
            <span className={`status-badge ${licensePool.isActive ? 'status-active' : 'status-inactive'}`}>
              {licensePool.isActive ? 'Active' : 'Inactive'}
            </span>
          </div>
        </div>
        <div className="header-actions">
          <Link 
            to={`/admin/license-pools/${id}/assignments`}
            className="btn btn-primary"
          >
            Manage Assignments
          </Link>
          <Link 
            to={`/admin/license-pools/${id}/edit`}
            className="btn btn-outline"
          >
            Edit Pool
          </Link>
        </div>
      </div>

      {error && (
        <div className="error-message">
          {error}
        </div>
      )}

      {/* License Pool Information */}
      <div className="details-grid">
        <div className="details-card">
          <div className="card-header">
            <h3>Pool Information</h3>
          </div>
          <div className="card-content">
            <div className="detail-item">
              <label>Product Name:</label>
              <span>{licensePool.productName}</span>
            </div>
            <div className="detail-item">
              <label>Vendor:</label>
              <span>{licensePool.vendor}</span>
            </div>
            <div className="detail-item">
              <label>License Type:</label>
              <span className="license-type">
                {licensePool.licenseType.replace('_', ' ').toUpperCase()}
              </span>
            </div>
            <div className="detail-item">
              <label>License Key/Agreement ID:</label>
              <span>{licensePool.licenseKeyOrAgreementId || 'Not specified'}</span>
            </div>
            <div className="detail-item">
              <label>Status:</label>
              <span className={`pool-status ${licensePool.isActive ? 'active' : 'inactive'}`}>
                {licensePool.isActive ? 'Active' : 'Inactive'}
              </span>
            </div>
          </div>
        </div>

        <div className="details-card">
          <div className="card-header">
            <h3>Seat Information</h3>
          </div>
          <div className="card-content">
            <div className="detail-item">
              <label>Total Seats:</label>
              <span className="total-seats">{licensePool.totalSeats}</span>
            </div>
            <div className="detail-item">
              <label>Assigned Seats:</label>
              <span className="assigned-seats">
                {licensePool.totalSeats - availableSeats}
              </span>
            </div>
            <div className="detail-item">
              <label>Available Seats:</label>
              <span className={`available-seats ${availableSeats <= 0 ? 'no-seats' : availableSeats <= licensePool.totalSeats * 0.1 ? 'low-seats' : 'good-availability'}`}>
                {availableSeats}
              </span>
            </div>
            <div className="detail-item">
              <label>Utilization:</label>
              <div className="utilization-bar">
                <div 
                  className="utilization-fill" 
                  style={{ width: `${((licensePool.totalSeats - availableSeats) / licensePool.totalSeats) * 100}%` }}
                ></div>
                <span className="utilization-text">
                  {Math.round(((licensePool.totalSeats - availableSeats) / licensePool.totalSeats) * 100)}%
                </span>
              </div>
            </div>
          </div>
        </div>

        <div className="details-card">
          <div className="card-header">
            <h3>Dates & Pricing</h3>
          </div>
          <div className="card-content">
            <div className="detail-item">
              <label>Purchased Date:</label>
              <span>{formatDate(licensePool.purchasedDate)}</span>
            </div>
            <div className="detail-item">
              <label>Expiry Date:</label>
              <span className={licensePool.expiryDate && new Date(licensePool.expiryDate) < new Date() ? 'expired-date' : ''}>
                {licensePool.expiryDate ? formatDate(licensePool.expiryDate) : 'No expiry (Perpetual)'}
              </span>
            </div>
            <div className="detail-item">
              <label>Cost per Seat:</label>
              <span>{formatCurrency(licensePool.costPerSeat)}</span>
            </div>
            <div className="detail-item">
              <label>Total Cost:</label>
              <span className="total-cost">
                {licensePool.costPerSeat ? formatCurrency(licensePool.costPerSeat * licensePool.totalSeats) : 'N/A'}
              </span>
            </div>
          </div>
        </div>

        {licensePool.notes && (
          <div className="details-card full-width">
            <div className="card-header">
              <h3>Notes</h3>
            </div>
            <div className="card-content">
              <p className="notes-text">{licensePool.notes}</p>
            </div>
          </div>
        )}
      </div>

      {/* Recent Assignments */}
      <div className="recent-assignments">
        <div className="section-header">
          <h3>Recent Assignments ({activeAssignments.length})</h3>
          <Link 
            to={`/admin/license-pools/${id}/assignments`}
            className="btn btn-sm btn-outline"
          >
            View All
          </Link>
        </div>
        
        {activeAssignments.length === 0 ? (
          <div className="no-assignments">
            <p>No active assignments for this license pool.</p>
            <Link 
              to={`/admin/license-pools/${id}/assignments`}
              className="btn btn-primary"
            >
              Create Assignment
            </Link>
          </div>
        ) : (
          <div className="assignments-preview">
            {activeAssignments.slice(0, 5).map(assignment => (
              <div key={assignment.id} className="assignment-item">
                <div className="assignment-client">
                  <strong>{assignment.client?.companyName || 'Unknown Client'}</strong>
                  <span className="assignment-contact">{assignment.client?.contactName}</span>
                </div>
                <div className="assignment-seats">
                  {assignment.assignedSeats} seats
                </div>
                <div className="assignment-date">
                  {formatDate(assignment.assignmentDate)}
                </div>
              </div>
            ))}
            {activeAssignments.length > 5 && (
              <div className="assignment-item show-more">
                <span>... and {activeAssignments.length - 5} more</span>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default LicensePoolDetailsPage; 