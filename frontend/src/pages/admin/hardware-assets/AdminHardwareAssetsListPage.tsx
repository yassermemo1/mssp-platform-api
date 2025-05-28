import React, { useState, useEffect, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { apiService } from '../../../services/apiService';
import { 
  HardwareAsset, 
  HardwareAssetType, 
  HardwareAssetStatus,
  HardwareAssetQueryOptions,
  PaginatedResult
} from '../../../types/hardware';
import { useAuth } from '../../../contexts/AuthContext';
import { UserRole } from '../../../types/auth';
import './AdminHardwareAssetsListPage.css';

/**
 * AdminHardwareAssetsListPage Component
 * Displays and manages the hardware asset inventory
 * Includes filtering, pagination, and management actions
 */
const AdminHardwareAssetsListPage: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  
  const [assets, setAssets] = useState<HardwareAsset[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filters, setFilters] = useState<HardwareAssetQueryOptions>({
    page: 1,
    limit: 10,
  });
  const [meta, setMeta] = useState({
    count: 0,
    page: 1,
    limit: 10,
    totalPages: 0,
  });

  /**
   * Check if user has permission to manage hardware assets
   */
  const canManageAssets = (): boolean => {
    if (!user) return false;
    return [UserRole.ADMIN, UserRole.MANAGER].includes(user.role);
  };

  /**
   * Fetch hardware assets from the API
   */
  const fetchAssets = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await apiService.getHardwareAssets(filters);
      setAssets(response.data);
      setMeta({
        count: response.count,
        page: response.page,
        limit: response.limit,
        totalPages: response.totalPages,
      });
    } catch (err: any) {
      setError(err.message || 'Failed to fetch hardware assets');
      console.error('Error fetching hardware assets:', err);
    } finally {
      setLoading(false);
    }
  }, [filters]);

  useEffect(() => {
    fetchAssets();
  }, [fetchAssets]);

  /**
   * Handle filter changes
   */
  const handleFilterChange = (key: keyof HardwareAssetQueryOptions, value: any) => {
    setFilters(prev => ({
      ...prev,
      [key]: value,
      page: 1, // Reset to first page when filtering
    }));
  };

  /**
   * Handle page changes
   */
  const handlePageChange = (page: number) => {
    setFilters(prev => ({ ...prev, page }));
  };

  /**
   * Handle status update
   */
  const handleStatusUpdate = async (asset: HardwareAsset, newStatus: HardwareAssetStatus) => {
    const confirmMessage = `Are you sure you want to change the status of "${asset.assetTag}" to ${newStatus.replace('_', ' ').toUpperCase()}?`;
    
    if (!window.confirm(confirmMessage)) {
      return;
    }

    try {
      await apiService.updateHardwareAssetStatus(asset.id, newStatus);
      await fetchAssets(); // Refresh the list
    } catch (err: any) {
      setError(err.message || 'Failed to update asset status');
    }
  };

  /**
   * Format currency values
   */
  const formatCurrency = (amount: number | null | undefined) => {
    if (!amount) return 'N/A';
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  };

  /**
   * Format dates
   */
  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString();
  };

  /**
   * Get status badge class
   */
  const getStatusBadgeClass = (status: HardwareAssetStatus) => {
    switch (status) {
      case HardwareAssetStatus.IN_STOCK:
        return 'status-badge status-in-stock';
      case HardwareAssetStatus.AWAITING_DEPLOYMENT:
        return 'status-badge status-awaiting-deployment';
      case HardwareAssetStatus.IN_USE:
        return 'status-badge status-in-use';
      case HardwareAssetStatus.UNDER_MAINTENANCE:
        return 'status-badge status-under-maintenance';
      case HardwareAssetStatus.AWAITING_REPAIR:
        return 'status-badge status-awaiting-repair';
      case HardwareAssetStatus.RETIRED:
        return 'status-badge status-retired';
      case HardwareAssetStatus.DISPOSED:
        return 'status-badge status-disposed';
      case HardwareAssetStatus.LOST:
      case HardwareAssetStatus.STOLEN:
        return 'status-badge status-lost-stolen';
      default:
        return 'status-badge status-default';
    }
  };

  /**
   * Get asset type badge class
   */
  const getAssetTypeBadgeClass = (assetType: HardwareAssetType) => {
    switch (assetType) {
      case HardwareAssetType.SERVER:
        return 'asset-type-badge asset-type-server';
      case HardwareAssetType.WORKSTATION:
      case HardwareAssetType.LAPTOP:
      case HardwareAssetType.DESKTOP:
        return 'asset-type-badge asset-type-workstation';
      case HardwareAssetType.NETWORK_DEVICE:
      case HardwareAssetType.FIREWALL:
      case HardwareAssetType.SWITCH:
      case HardwareAssetType.ROUTER:
      case HardwareAssetType.ACCESS_POINT:
        return 'asset-type-badge asset-type-network';
      case HardwareAssetType.SECURITY_APPLIANCE:
        return 'asset-type-badge asset-type-security';
      default:
        return 'asset-type-badge asset-type-default';
    }
  };

  /**
   * Check if asset can be assigned
   */
  const canAssignAsset = (asset: HardwareAsset): boolean => {
    return [HardwareAssetStatus.IN_STOCK, HardwareAssetStatus.AWAITING_DEPLOYMENT].includes(asset.status);
  };

  /**
   * Check if asset can be retired/disposed
   */
  const canRetireAsset = (asset: HardwareAsset): boolean => {
    return asset.status !== HardwareAssetStatus.IN_USE && 
           asset.status !== HardwareAssetStatus.RETIRED && 
           asset.status !== HardwareAssetStatus.DISPOSED;
  };

  /**
   * Format asset type for display
   */
  const formatAssetType = (assetType: HardwareAssetType): string => {
    return assetType.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
  };

  /**
   * Format status for display
   */
  const formatStatus = (status: HardwareAssetStatus): string => {
    return status.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
  };

  if (!canManageAssets()) {
    return (
      <div className="admin-hardware-assets-list">
        <div className="access-denied">
          <h3>Access Denied</h3>
          <p>You do not have permission to manage hardware assets.</p>
          <button onClick={() => navigate('/dashboard')} className="btn btn-secondary">
            Back to Dashboard
          </button>
        </div>
      </div>
    );
  }

  if (loading && assets.length === 0) {
    return (
      <div className="admin-hardware-assets-list">
        <div className="loading">Loading hardware assets...</div>
      </div>
    );
  }

  return (
    <div className="admin-hardware-assets-list">
      <div className="page-header">
        <h1>Hardware Asset Management</h1>
        <Link to="/admin/hardware-assets/new" className="btn btn-primary">
          Add New Asset
        </Link>
      </div>

      {/* Filters */}
      <div className="filters-section">
        <div className="filters-row">
          <div className="filter-group">
            <label htmlFor="assetTagFilter">Asset Tag:</label>
            <input
              type="text"
              id="assetTagFilter"
              placeholder="Filter by asset tag..."
              value={filters.assetTag || ''}
              onChange={(e) => handleFilterChange('assetTag', e.target.value || undefined)}
            />
          </div>

          <div className="filter-group">
            <label htmlFor="serialNumberFilter">Serial Number:</label>
            <input
              type="text"
              id="serialNumberFilter"
              placeholder="Filter by serial number..."
              value={filters.serialNumber || ''}
              onChange={(e) => handleFilterChange('serialNumber', e.target.value || undefined)}
            />
          </div>

          <div className="filter-group">
            <label htmlFor="assetTypeFilter">Asset Type:</label>
            <select
              id="assetTypeFilter"
              value={filters.assetType || ''}
              onChange={(e) => handleFilterChange('assetType', e.target.value || undefined)}
            >
              <option value="">All Types</option>
              {Object.values(HardwareAssetType).map(type => (
                <option key={type} value={type}>
                  {formatAssetType(type)}
                </option>
              ))}
            </select>
          </div>

          <div className="filter-group">
            <label htmlFor="statusFilter">Status:</label>
            <select
              id="statusFilter"
              value={filters.status || ''}
              onChange={(e) => handleFilterChange('status', e.target.value || undefined)}
            >
              <option value="">All Statuses</option>
              {Object.values(HardwareAssetStatus).map(status => (
                <option key={status} value={status}>
                  {formatStatus(status)}
                </option>
              ))}
            </select>
          </div>

          <div className="filter-group">
            <label htmlFor="locationFilter">Location:</label>
            <input
              type="text"
              id="locationFilter"
              placeholder="Filter by location..."
              value={filters.location || ''}
              onChange={(e) => handleFilterChange('location', e.target.value || undefined)}
            />
          </div>

          <div className="filter-group">
            <label htmlFor="manufacturerFilter">Manufacturer:</label>
            <input
              type="text"
              id="manufacturerFilter"
              placeholder="Filter by manufacturer..."
              value={filters.manufacturer || ''}
              onChange={(e) => handleFilterChange('manufacturer', e.target.value || undefined)}
            />
          </div>
        </div>
      </div>

      {error && (
        <div className="error-message">
          {error}
        </div>
      )}

      {/* Assets Table */}
      <div className="assets-table-container">
        <table className="assets-table">
          <thead>
            <tr>
              <th>Asset Tag</th>
              <th>Device Info</th>
              <th>Type</th>
              <th>Status</th>
              <th>Location</th>
              <th>Purchase Info</th>
              <th>Warranty</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {assets.map((asset) => (
              <tr key={asset.id}>
                <td>
                  <div className="asset-tag">
                    <strong>{asset.assetTag}</strong>
                    {asset.serialNumber && (
                      <div className="serial-number">SN: {asset.serialNumber}</div>
                    )}
                  </div>
                </td>
                <td>
                  <div className="device-info">
                    {asset.deviceName && <div className="device-name">{asset.deviceName}</div>}
                    {(asset.manufacturer || asset.model) && (
                      <div className="manufacturer-model">
                        {asset.manufacturer} {asset.model}
                      </div>
                    )}
                  </div>
                </td>
                <td>
                  <span className={getAssetTypeBadgeClass(asset.assetType)}>
                    {formatAssetType(asset.assetType)}
                  </span>
                </td>
                <td>
                  <span className={getStatusBadgeClass(asset.status)}>
                    {formatStatus(asset.status)}
                  </span>
                </td>
                <td>{asset.location || 'N/A'}</td>
                <td>
                  <div className="purchase-info">
                    {asset.purchaseDate && (
                      <div className="purchase-date">
                        Date: {formatDate(asset.purchaseDate)}
                      </div>
                    )}
                    {asset.purchaseCost && (
                      <div className="purchase-cost">
                        Cost: {formatCurrency(asset.purchaseCost)}
                      </div>
                    )}
                  </div>
                </td>
                <td>
                  {asset.warrantyExpiryDate ? (
                    <div className={`warranty-info ${new Date(asset.warrantyExpiryDate) > new Date() ? 'valid' : 'expired'}`}>
                      {formatDate(asset.warrantyExpiryDate)}
                    </div>
                  ) : (
                    'N/A'
                  )}
                </td>
                <td>
                  <div className="actions">
                    <Link 
                      to={`/admin/hardware-assets/${asset.id}/edit`} 
                      className="btn btn-sm btn-secondary"
                      title="Edit Asset"
                    >
                      Edit
                    </Link>
                    
                    <Link 
                      to={`/admin/hardware-assets/${asset.id}/assignments`} 
                      className="btn btn-sm btn-info"
                      title="View Assignments"
                    >
                      Assignments
                    </Link>

                    {canAssignAsset(asset) && (
                      <Link 
                        to={`/admin/hardware-assignments/new?assetId=${asset.id}`} 
                        className="btn btn-sm btn-success"
                        title="Assign to Client"
                      >
                        Assign
                      </Link>
                    )}

                    {canRetireAsset(asset) && (
                      <div className="status-actions">
                        <button
                          onClick={() => handleStatusUpdate(asset, HardwareAssetStatus.UNDER_MAINTENANCE)}
                          className="btn btn-sm btn-warning"
                          title="Mark as Under Maintenance"
                        >
                          Maintenance
                        </button>
                        <button
                          onClick={() => handleStatusUpdate(asset, HardwareAssetStatus.RETIRED)}
                          className="btn btn-sm btn-danger"
                          title="Retire Asset"
                        >
                          Retire
                        </button>
                      </div>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {assets.length === 0 && !loading && (
          <div className="no-assets">
            <p>No hardware assets found.</p>
            <Link to="/admin/hardware-assets/new" className="btn btn-primary">
              Add Your First Asset
            </Link>
          </div>
        )}
      </div>

      {/* Pagination */}
      {meta.totalPages > 1 && (
        <div className="pagination">
          <div className="pagination-info">
            Showing {((meta.page - 1) * meta.limit) + 1} to {Math.min(meta.page * meta.limit, meta.count)} of {meta.count} assets
          </div>
          <div className="pagination-controls">
            <button
              onClick={() => handlePageChange(meta.page - 1)}
              disabled={meta.page <= 1}
              className="btn btn-sm btn-secondary"
            >
              Previous
            </button>
            
            {Array.from({ length: meta.totalPages }, (_, i) => i + 1)
              .filter(page => 
                page === 1 || 
                page === meta.totalPages || 
                Math.abs(page - meta.page) <= 2
              )
              .map((page, index, array) => (
                <React.Fragment key={page}>
                  {index > 0 && array[index - 1] !== page - 1 && (
                    <span className="pagination-ellipsis">...</span>
                  )}
                  <button
                    onClick={() => handlePageChange(page)}
                    className={`btn btn-sm ${page === meta.page ? 'btn-primary' : 'btn-secondary'}`}
                  >
                    {page}
                  </button>
                </React.Fragment>
              ))
            }
            
            <button
              onClick={() => handlePageChange(meta.page + 1)}
              disabled={meta.page >= meta.totalPages}
              className="btn btn-sm btn-secondary"
            >
              Next
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminHardwareAssetsListPage; 