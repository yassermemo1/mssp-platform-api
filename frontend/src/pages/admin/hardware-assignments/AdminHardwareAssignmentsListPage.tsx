import React, { useState, useEffect, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../../contexts/AuthContext';
import { UserRole } from '../../../types/auth';
import { 
  ClientHardwareAssignment, 
  HardwareAssignmentStatus,
  AssignmentQueryOptions,
  PaginatedResult
} from '../../../types/hardware';
import { Client } from '../../../types/client';
import { apiService } from '../../../services/apiService';
import './AdminHardwareAssignmentsListPage.css';

/**
 * AdminHardwareAssignmentsListPage Component
 * Displays and manages hardware assignments with multiple view perspectives
 */
const AdminHardwareAssignmentsListPage: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  
  const [assignments, setAssignments] = useState<ClientHardwareAssignment[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  // Pagination state
  const [meta, setMeta] = useState({
    count: 0,
    page: 1,
    limit: 20,
    totalPages: 0,
  });

  // Filter states
  const [filters, setFilters] = useState<AssignmentQueryOptions>({
    page: 1,
    limit: 20,
    status: undefined,
    clientId: undefined,
    hardwareAssetId: undefined,
    serviceScopeId: undefined
  });

  // View perspective
  const [viewPerspective, setViewPerspective] = useState<'all' | 'by-client' | 'by-asset'>('all');

  const canManageAssignments = (): boolean => {
    if (!user) return false;
    return [UserRole.ADMIN, UserRole.MANAGER, UserRole.ASSET_MANAGER].includes(user.role);
  };

  const loadAssignments = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      const result = await apiService.getHardwareAssignments(filters);
      setAssignments(result.data);
      setMeta({
        count: result.count,
        page: result.page,
        limit: result.limit,
        totalPages: result.totalPages,
      });
    } catch (err: any) {
      console.error('Error loading assignments:', err);
      setError(err.message || 'Failed to load hardware assignments. Please try again.');
    } finally {
      setLoading(false);
    }
  }, [filters]);

  const loadClients = useCallback(async () => {
    try {
      const result = await apiService.getClients();
      setClients(result.data);
    } catch (err) {
      console.error('Error loading clients:', err);
    }
  }, []);

  useEffect(() => {
    loadAssignments();
  }, [loadAssignments]);

  useEffect(() => {
    loadClients();
  }, [loadClients]);

  const handleFilterChange = (key: keyof AssignmentQueryOptions, value: any) => {
    setFilters(prev => ({
      ...prev,
      [key]: value,
      page: 1 // Reset to first page when filtering
    }));
  };

  const handlePageChange = (newPage: number) => {
    setFilters(prev => ({ ...prev, page: newPage }));
  };

  const handleConcludeAssignment = async (assignmentId: string) => {
    if (!window.confirm('Are you sure you want to conclude this assignment? This will return the hardware asset to inventory.')) {
      return;
    }

    try {
      setActionLoading(assignmentId);
      await apiService.concludeHardwareAssignment(assignmentId);
      await loadAssignments();
    } catch (err: any) {
      console.error('Error concluding assignment:', err);
      setError(err.message || 'Failed to conclude assignment. Please try again.');
    } finally {
      setActionLoading(null);
    }
  };

  const getStatusBadge = (status: HardwareAssignmentStatus) => {
    const statusConfig = {
      [HardwareAssignmentStatus.ACTIVE]: { label: 'Active', className: 'status-active' },
      [HardwareAssignmentStatus.RETURNED]: { label: 'Returned', className: 'status-returned' },
      [HardwareAssignmentStatus.REPLACED]: { label: 'Replaced', className: 'status-replaced' },
      [HardwareAssignmentStatus.MAINTENANCE]: { label: 'Maintenance', className: 'status-maintenance' },
      [HardwareAssignmentStatus.LOST]: { label: 'Lost', className: 'status-lost' },
      [HardwareAssignmentStatus.DAMAGED]: { label: 'Damaged', className: 'status-damaged' },
      [HardwareAssignmentStatus.CANCELLED]: { label: 'Cancelled', className: 'status-cancelled' }
    };

    const config = statusConfig[status];
    return <span className={`status-badge ${config.className}`}>{config.label}</span>;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const clearFilters = () => {
    setFilters({
      page: 1,
      limit: 20,
      status: undefined,
      clientId: undefined,
      hardwareAssetId: undefined,
      serviceScopeId: undefined
    });
  };

  if (!canManageAssignments()) {
    return (
      <div className="admin-hardware-assignments-page">
        <div className="access-denied">
          <h3>Access Denied</h3>
          <p>You don't have permission to view hardware assignments.</p>
          <button onClick={() => navigate('/dashboard')} className="btn btn-secondary">
            Back to Dashboard
          </button>
        </div>
      </div>
    );
  }

  if (loading && assignments.length === 0) {
    return (
      <div className="admin-hardware-assignments-page">
        <div className="loading-state">
          <div className="loading-spinner"></div>
          <p>Loading assignments...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="admin-hardware-assignments-page">
      <div className="page-header">
        <div className="header-content">
          <h1>Hardware Assignments</h1>
          <p>Manage hardware asset assignments to clients and service scopes</p>
        </div>
        <div className="header-actions">
          <Link to="/admin/hardware-assets" className="btn btn-secondary">
            Hardware Assets
          </Link>
          <Link to="/admin/hardware-assignments/new" className="btn btn-primary">
            New Assignment
          </Link>
        </div>
      </div>

      {/* View Perspective Selector */}
      <div className="view-perspective-selector">
        <button
          className={viewPerspective === 'all' ? 'btn btn-primary' : 'btn btn-secondary'}
          onClick={() => setViewPerspective('all')}
        >
          All Assignments
        </button>
        <button
          className={viewPerspective === 'by-client' ? 'btn btn-primary' : 'btn btn-secondary'}
          onClick={() => setViewPerspective('by-client')}
        >
          By Client
        </button>
        <button
          className={viewPerspective === 'by-asset' ? 'btn btn-primary' : 'btn btn-secondary'}
          onClick={() => setViewPerspective('by-asset')}
        >
          By Asset
        </button>
      </div>

      {/* Filters */}
      <div className="filters-section">
        <div className="filters-grid">
          <div className="filter-group">
            <label htmlFor="status-filter">Status</label>
            <select
              id="status-filter"
              value={filters.status || ''}
              onChange={(e) => handleFilterChange('status', e.target.value || undefined)}
            >
              <option value="">All Statuses</option>
              <option value={HardwareAssignmentStatus.ACTIVE}>Active</option>
              <option value={HardwareAssignmentStatus.RETURNED}>Returned</option>
              <option value={HardwareAssignmentStatus.REPLACED}>Replaced</option>
              <option value={HardwareAssignmentStatus.MAINTENANCE}>Maintenance</option>
              <option value={HardwareAssignmentStatus.LOST}>Lost</option>
              <option value={HardwareAssignmentStatus.DAMAGED}>Damaged</option>
              <option value={HardwareAssignmentStatus.CANCELLED}>Cancelled</option>
            </select>
          </div>

          <div className="filter-group">
            <label htmlFor="client-filter">Client</label>
            <select
              id="client-filter"
              value={filters.clientId || ''}
              onChange={(e) => handleFilterChange('clientId', e.target.value || undefined)}
            >
              <option value="">All Clients</option>
              {clients.map(client => (
                <option key={client.id} value={client.id}>
                  {client.companyName}
                </option>
              ))}
            </select>
          </div>

          <div className="filter-actions">
            <button onClick={clearFilters} className="btn btn-secondary">
              Clear Filters
            </button>
          </div>
        </div>
      </div>

      {/* Results Summary */}
      <div className="results-summary">
        <span>
          Showing {assignments.length} of {meta.count} assignments
          {filters.status && ` • Status: ${filters.status.replace('_', ' ').toUpperCase()}`}
          {filters.clientId && ` • Client: ${clients.find(c => c.id === filters.clientId)?.companyName}`}
        </span>
      </div>

      {/* Error Display */}
      {error && (
        <div className="error-message">
          <p>{error}</p>
          <button onClick={loadAssignments} className="btn btn-secondary">
            Retry
          </button>
        </div>
      )}

      {/* Assignments Table */}
      <div className="assignments-table-container">
        <table className="assignments-table">
          <thead>
            <tr>
              <th>Asset</th>
              <th>Client</th>
              <th>Service Scope</th>
              <th>Status</th>
              <th>Assignment Date</th>
              <th>Return Date</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {assignments.map((assignment) => (
              <tr key={assignment.id}>
                <td>
                  <div className="asset-info">
                    <div className="asset-tag">
                      <strong>{assignment.hardwareAsset?.assetTag || 'N/A'}</strong>
                    </div>
                    {assignment.hardwareAsset && (
                      <>
                        <div className="asset-details">
                          {assignment.hardwareAsset.manufacturer} {assignment.hardwareAsset.model}
                        </div>
                        {assignment.hardwareAsset.serialNumber && (
                          <div className="asset-serial">SN: {assignment.hardwareAsset.serialNumber}</div>
                        )}
                      </>
                    )}
                  </div>
                </td>
                <td>
                  {assignment.client ? (
                    <Link 
                      to={`/admin/clients/${assignment.client.id}`}
                      className="client-link"
                    >
                      {assignment.client.companyName}
                    </Link>
                  ) : (
                    <span className="no-client">Unknown Client</span>
                  )}
                </td>
                <td>
                  {assignment.serviceScope ? (
                    <span className="service-scope-name">{assignment.serviceScope.service?.name || `Service Scope ${assignment.serviceScope.id}`}</span>
                  ) : (
                    <span className="no-service-scope">General Assignment</span>
                  )}
                </td>
                <td>{getStatusBadge(assignment.status)}</td>
                <td>{formatDate(assignment.assignmentDate)}</td>
                <td>
                  {assignment.returnDate ? (
                    formatDate(assignment.returnDate)
                  ) : (
                    <span className="not-returned">-</span>
                  )}
                </td>
                <td>
                  <div className="action-buttons">
                    <Link
                      to={`/admin/hardware-assignments/${assignment.id}`}
                      className="btn btn-sm btn-secondary"
                    >
                      View
                    </Link>
                    <Link
                      to={`/admin/hardware-assignments/${assignment.id}/edit`}
                      className="btn btn-sm btn-info"
                    >
                      Edit
                    </Link>
                    {assignment.status === HardwareAssignmentStatus.ACTIVE && (
                      <button
                        onClick={() => handleConcludeAssignment(assignment.id)}
                        disabled={actionLoading === assignment.id}
                        className="btn btn-sm btn-warning"
                      >
                        {actionLoading === assignment.id ? 'Returning...' : 'Return'}
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {assignments.length === 0 && !loading && (
          <div className="no-assignments">
            <p>No hardware assignments found.</p>
            <Link to="/admin/hardware-assignments/new" className="btn btn-primary">
              Create First Assignment
            </Link>
          </div>
        )}
      </div>

      {/* Pagination */}
      {meta.totalPages > 1 && (
        <div className="pagination">
          <div className="pagination-info">
            Showing {((meta.page - 1) * meta.limit) + 1} to {Math.min(meta.page * meta.limit, meta.count)} of {meta.count} assignments
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

export default AdminHardwareAssignmentsListPage; 