import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { apiService } from '../../../services/apiService';
import { 
  LicensePool, 
  LicenseType, 
  LicensePoolQueryOptions
} from '../../../types/license';
import './AdminLicensePoolsListPage.css';

const AdminLicensePoolsListPage: React.FC = () => {
  const [licensePools, setLicensePools] = useState<LicensePool[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filters, setFilters] = useState<LicensePoolQueryOptions>({
    page: 1,
    limit: 10,
  });
  const [meta, setMeta] = useState({
    count: 0,
    page: 1,
    limit: 10,
    totalPages: 0,
  });

  const fetchLicensePools = useCallback(async () => {
    try {
      setLoading(true);
      const response = await apiService.getLicensePools(filters);
      setLicensePools(response.data);
      if (response.meta) {
        setMeta(response.meta);
      }
      setError(null);
    } catch (err: any) {
      setError(err.message || 'Failed to fetch license pools');
    } finally {
      setLoading(false);
    }
  }, [filters]);

  useEffect(() => {
    fetchLicensePools();
  }, [fetchLicensePools]);

  const handleFilterChange = (key: keyof LicensePoolQueryOptions, value: any) => {
    setFilters(prev => ({
      ...prev,
      [key]: value,
      page: 1, // Reset to first page when filtering
    }));
  };

  const handlePageChange = (page: number) => {
    setFilters(prev => ({ ...prev, page }));
  };

  const handleActivateDeactivate = async (pool: LicensePool) => {
    const action = pool.isActive ? 'deactivate' : 'reactivate';
    const confirmMessage = `Are you sure you want to ${action} the license pool "${pool.productName}"?`;
    
    if (!window.confirm(confirmMessage)) {
      return;
    }

    try {
      if (pool.isActive) {
        await apiService.deleteLicensePool(pool.id);
      } else {
        await apiService.reactivateLicensePool(pool.id);
      }
      await fetchLicensePools(); // Refresh the list
    } catch (err: any) {
      setError(err.message || `Failed to ${action} license pool`);
    }
  };

  const formatCurrency = (amount: number | null | undefined) => {
    if (!amount) return 'N/A';
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString();
  };

  const getStatusBadgeClass = (isActive: boolean) => {
    return isActive ? 'status-badge status-active' : 'status-badge status-inactive';
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

  const calculateAvailableSeats = (pool: LicensePool) => {
    const assigned = pool.assignedSeats || 0;
    return pool.totalSeats - assigned;
  };

  const getAvailabilityStatus = (pool: LicensePool) => {
    const available = calculateAvailableSeats(pool);
    if (available <= 0) return 'no-seats';
    if (available <= pool.totalSeats * 0.1) return 'low-seats';
    return 'good-availability';
  };

  if (loading && licensePools.length === 0) {
    return (
      <div className="admin-license-pools-list">
        <div className="loading">Loading license pools...</div>
      </div>
    );
  }

  return (
    <div className="admin-license-pools-list">
      <div className="page-header">
        <h1>License Pool Management</h1>
        <Link to="/admin/license-pools/new" className="btn btn-primary">
          Create New License Pool
        </Link>
      </div>

      {/* Filters */}
      <div className="filters-section">
        <div className="filters-row">
          <div className="filter-group">
            <label htmlFor="vendorFilter">Vendor:</label>
            <input
              type="text"
              id="vendorFilter"
              placeholder="Filter by vendor..."
              value={filters.vendor || ''}
              onChange={(e) => handleFilterChange('vendor', e.target.value || undefined)}
            />
          </div>

          <div className="filter-group">
            <label htmlFor="licenseTypeFilter">License Type:</label>
            <select
              id="licenseTypeFilter"
              value={filters.licenseType || ''}
              onChange={(e) => handleFilterChange('licenseType', e.target.value || undefined)}
            >
              <option value="">All Types</option>
              {Object.values(LicenseType).map(type => (
                <option key={type} value={type}>
                  {type.replace('_', ' ').toUpperCase()}
                </option>
              ))}
            </select>
          </div>

          <div className="filter-group">
            <label htmlFor="statusFilter">Status:</label>
            <select
              id="statusFilter"
              value={filters.isActive?.toString() || ''}
              onChange={(e) => handleFilterChange('isActive', e.target.value ? e.target.value === 'true' : undefined)}
            >
              <option value="">All Statuses</option>
              <option value="true">Active</option>
              <option value="false">Inactive</option>
            </select>
          </div>

          <div className="filter-group">
            <label htmlFor="searchFilter">Search:</label>
            <input
              type="text"
              id="searchFilter"
              placeholder="Search product names..."
              value={filters.search || ''}
              onChange={(e) => handleFilterChange('search', e.target.value || undefined)}
            />
          </div>
        </div>
      </div>

      {error && (
        <div className="error-message">
          {error}
        </div>
      )}

      {/* License Pools Table */}
      <div className="license-pools-table-container">
        <table className="license-pools-table">
          <thead>
            <tr>
              <th>Product Name</th>
              <th>Vendor</th>
              <th>License Type</th>
              <th>Seats</th>
              <th>Available</th>
              <th>Cost per Seat</th>
              <th>Expiry Date</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {licensePools.map(pool => {
              const availableSeats = calculateAvailableSeats(pool);
              const availabilityStatus = getAvailabilityStatus(pool);
              
              return (
                <tr key={pool.id}>
                  <td>
                    <div className="product-info">
                      <strong>{pool.productName}</strong>
                    </div>
                  </td>
                  <td>{pool.vendor}</td>
                  <td>
                    <span className={getLicenseTypeBadgeClass(pool.licenseType)}>
                      {pool.licenseType.replace('_', ' ').toUpperCase()}
                    </span>
                  </td>
                  <td>
                    <div className="seats-info">
                      <div>Total: {pool.totalSeats}</div>
                      <div className="assigned-seats">Assigned: {pool.assignedSeats || 0}</div>
                    </div>
                  </td>
                  <td>
                    <span className={`availability-badge ${availabilityStatus}`}>
                      {availableSeats}
                    </span>
                  </td>
                  <td>{formatCurrency(pool.costPerSeat)}</td>
                  <td>
                    {pool.expiryDate ? (
                      <span className={new Date(pool.expiryDate) < new Date() ? 'expired-date' : ''}>
                        {formatDate(pool.expiryDate)}
                      </span>
                    ) : 'No expiry'}
                  </td>
                  <td>
                    <span className={getStatusBadgeClass(pool.isActive)}>
                      {pool.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td>
                    <div className="actions">
                      <Link 
                        to={`/admin/license-pools/${pool.id}`} 
                        className="btn btn-sm btn-secondary"
                      >
                        View
                      </Link>
                      <Link 
                        to={`/admin/license-pools/${pool.id}/edit`} 
                        className="btn btn-sm btn-outline"
                      >
                        Edit
                      </Link>
                      <Link 
                        to={`/admin/license-pools/${pool.id}/assignments`} 
                        className="btn btn-sm btn-info"
                      >
                        Assignments
                      </Link>
                      <button
                        onClick={() => handleActivateDeactivate(pool)}
                        className={`btn btn-sm ${pool.isActive ? 'btn-warning' : 'btn-success'}`}
                      >
                        {pool.isActive ? 'Deactivate' : 'Activate'}
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {meta.totalPages > 1 && (
        <div className="pagination">
          <button
            onClick={() => handlePageChange(meta.page - 1)}
            disabled={meta.page <= 1}
            className="btn btn-outline"
          >
            Previous
          </button>
          
          <span className="page-info">
            Page {meta.page} of {meta.totalPages} ({meta.count} total)
          </span>
          
          <button
            onClick={() => handlePageChange(meta.page + 1)}
            disabled={meta.page >= meta.totalPages}
            className="btn btn-outline"
          >
            Next
          </button>
        </div>
      )}
    </div>
  );
};

export default AdminLicensePoolsListPage; 