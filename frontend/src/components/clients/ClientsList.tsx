import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Client, ClientStatus } from '../../types/client';
import { ApiError, UserRole } from '../../types/auth';
import { apiService } from '../../services/apiService';
import { useAuth } from '../../contexts/AuthContext';
import ConfirmationModal from '../common/ConfirmationModal';
import Toast from '../common/Toast';
import './ClientsList.css';

interface QueryParams {
  search?: string;
  companyName?: string;
  contactName?: string;
  contactEmail?: string;
  status?: ClientStatus;
  createdDateFrom?: string;
  createdDateTo?: string;
  sortBy?: string;
  sortOrder?: 'ASC' | 'DESC';
  page?: number;
  limit?: number;
}

interface PaginatedResponse {
  data: Client[];
  total: number;
  page: number;
  limit: number;
}

/**
 * ClientsList Component
 * Displays a list of all clients with basic information
 * Includes loading states, error handling, navigation to create new clients, and delete functionality
 */
const ClientsList: React.FC = () => {
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [totalClients, setTotalClients] = useState<number>(0);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [pageSize, setPageSize] = useState<number>(20);
  const [filters, setFilters] = useState<QueryParams>({
    sortBy: 'createdAt',
    sortOrder: 'DESC',
  });
  const [showFilters, setShowFilters] = useState<boolean>(false);
  const [exporting, setExporting] = useState<boolean>(false);
  
  const [deleteModal, setDeleteModal] = useState<{
    isOpen: boolean;
    client: Client | null;
    loading: boolean;
  }>({
    isOpen: false,
    client: null,
    loading: false
  });
  const [toast, setToast] = useState<{
    isVisible: boolean;
    message: string;
    type: 'success' | 'error' | 'info' | 'warning';
  }>({
    isVisible: false,
    message: '',
    type: 'success'
  });

  const navigate = useNavigate();
  const { user } = useAuth();

  /**
   * Check if user has permission to delete clients
   * Only ADMIN and MANAGER roles can delete clients
   */
  const canDeleteClient = (): boolean => {
    if (!user) return false;
    return [UserRole.ADMIN, UserRole.MANAGER].includes(user.role);
  };

  /**
   * Check if user has permission to export clients
   * Only ADMIN and MANAGER roles can export clients
   */
  const canExportClients = (): boolean => {
    if (!user) return false;
    return [UserRole.ADMIN, UserRole.MANAGER].includes(user.role);
  };

  /**
   * Fetch clients from the backend API with filters
   */
  const fetchClients = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Build query string
      const queryParams = new URLSearchParams();
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== '') {
          queryParams.append(key, value.toString());
        }
      });
      queryParams.append('page', currentPage.toString());
      queryParams.append('limit', pageSize.toString());
      
      const response = await apiService.get<PaginatedResponse>(`/clients?${queryParams.toString()}`);
      setClients(response.data);
      setTotalClients(response.total);
    } catch (err) {
      const apiError = err as ApiError;
      setError(apiError.message || 'Failed to load clients');
      console.error('Error fetching clients:', err);
    } finally {
      setLoading(false);
    }
  };

  /**
   * Export clients to CSV
   */
  const handleExportCsv = async () => {
    if (!canExportClients()) {
      showToast('You do not have permission to export clients', 'error');
      return;
    }

    try {
      setExporting(true);
      
      // Build query string with current filters
      const queryParams = new URLSearchParams();
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== '') {
          queryParams.append(key, value.toString());
        }
      });
      
      const response = await apiService.getRaw(`/clients/export/csv?${queryParams.toString()}`);
      
      // Create blob and download
      const blob = new Blob([response], { type: 'text/csv' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      const timestamp = new Date().toISOString().split('T')[0];
      link.href = url;
      link.download = `clients_export_${timestamp}.csv`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      
      showToast('Clients exported successfully', 'success');
    } catch (err) {
      const apiError = err as ApiError;
      showToast(apiError.message || 'Failed to export clients', 'error');
      console.error('Error exporting clients:', err);
    } finally {
      setExporting(false);
    }
  };

  /**
   * Load clients when component mounts or filters change
   */
  useEffect(() => {
    fetchClients();
  }, [currentPage, pageSize, filters]);

  /**
   * Handle filter changes
   */
  const handleFilterChange = (key: keyof QueryParams, value: any) => {
    setFilters(prev => ({ ...prev, [key]: value }));
    setCurrentPage(1); // Reset to first page when filters change
  };

  /**
   * Clear all filters
   */
  const clearFilters = () => {
    setFilters({
      sortBy: 'createdAt',
      sortOrder: 'DESC',
    });
    setCurrentPage(1);
  };

  /**
   * Navigate to create client page
   */
  const handleCreateClient = () => {
    navigate('/clients/new');
  };

  /**
   * Navigate to client details page
   */
  const handleViewClient = (clientId: string) => {
    navigate(`/clients/${clientId}`);
  };

  /**
   * Open delete confirmation modal
   */
  const handleDeleteClick = (client: Client) => {
    setDeleteModal({
      isOpen: true,
      client,
      loading: false
    });
  };

  /**
   * Close delete confirmation modal
   */
  const handleDeleteCancel = () => {
    setDeleteModal({
      isOpen: false,
      client: null,
      loading: false
    });
  };

  /**
   * Confirm and execute client deletion
   */
  const handleDeleteConfirm = async () => {
    if (!deleteModal.client) return;

    setDeleteModal(prev => ({ ...prev, loading: true }));

    try {
      await apiService.delete(`/clients/${deleteModal.client.id}`);
      
      // Remove client from local state
      setClients(prev => prev.filter(c => c.id !== deleteModal.client!.id));
      
      // Close modal
      setDeleteModal({
        isOpen: false,
        client: null,
        loading: false
      });

      // Show success toast
      showToast(`Client "${deleteModal.client.companyName}" has been deleted successfully.`, 'success');
      
    } catch (err) {
      const apiError = err as ApiError;
      let errorMessage = 'Failed to delete client';
      
      if (apiError.statusCode === 403) {
        errorMessage = 'You do not have permission to delete clients';
      } else if (apiError.statusCode === 404) {
        errorMessage = 'Client not found - it may have already been deleted';
        // Remove from local state if it was already deleted
        setClients(prev => prev.filter(c => c.id !== deleteModal.client!.id));
      } else {
        errorMessage = apiError.message || errorMessage;
      }

      showToast(errorMessage, 'error');
      console.error('Error deleting client:', err);
      
      // Close modal even on error
      setDeleteModal({
        isOpen: false,
        client: null,
        loading: false
      });
    }
  };

  /**
   * Show toast notification
   */
  const showToast = (message: string, type: 'success' | 'error' | 'info' | 'warning') => {
    setToast({
      isVisible: true,
      message,
      type
    });
  };

  /**
   * Hide toast notification
   */
  const hideToast = () => {
    setToast(prev => ({ ...prev, isVisible: false }));
  };

  /**
   * Get status badge class for styling
   */
  const getStatusBadgeClass = (status: ClientStatus): string => {
    switch (status) {
      case ClientStatus.ACTIVE:
      case ClientStatus.RENEWED:
        return 'status-badge status-active';
      case ClientStatus.PROSPECT:
        return 'status-badge status-prospect';
      case ClientStatus.INACTIVE:
        return 'status-badge status-inactive';
      case ClientStatus.EXPIRED:
        return 'status-badge status-expired';
      default:
        return 'status-badge';
    }
  };

  /**
   * Format date for display
   */
  const formatDate = (dateString: string): string => {
    return new Date(dateString).toLocaleDateString();
  };

  if (loading) {
    return (
      <div className="clients-list-container">
        <div className="loading-container">
          <div className="loading-spinner"></div>
          <p>Loading clients...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="clients-list-container">
        <div className="error-container">
          <h3>Error Loading Clients</h3>
          <p>{error}</p>
          <button onClick={fetchClients} className="retry-button">
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="clients-list-container">
      <div className="clients-list-header">
        <h2>Clients</h2>
        <div className="header-actions">
          <button 
            onClick={() => setShowFilters(!showFilters)} 
            className="filter-toggle-button"
          >
            {showFilters ? 'Hide Filters' : 'Show Filters'}
          </button>
          {canExportClients() && (
            <button 
              onClick={handleExportCsv} 
              className="export-button"
              disabled={exporting}
            >
              {exporting ? 'Exporting...' : 'Export to CSV'}
            </button>
          )}
          <button onClick={handleCreateClient} className="create-client-button">
            Create New Client
          </button>
        </div>
      </div>

      {showFilters && (
        <div className="filters-panel">
          <div className="filters-row">
            <div className="filter-group">
              <label>Search</label>
              <input
                type="text"
                placeholder="Search across all fields..."
                value={filters.search || ''}
                onChange={(e) => handleFilterChange('search', e.target.value)}
              />
            </div>
            <div className="filter-group">
              <label>Company Name</label>
              <input
                type="text"
                placeholder="Filter by company name"
                value={filters.companyName || ''}
                onChange={(e) => handleFilterChange('companyName', e.target.value)}
              />
            </div>
            <div className="filter-group">
              <label>Contact Name</label>
              <input
                type="text"
                placeholder="Filter by contact name"
                value={filters.contactName || ''}
                onChange={(e) => handleFilterChange('contactName', e.target.value)}
              />
            </div>
          </div>
          <div className="filters-row">
            <div className="filter-group">
              <label>Status</label>
              <select
                value={filters.status || ''}
                onChange={(e) => handleFilterChange('status', e.target.value || undefined)}
              >
                <option value="">All Statuses</option>
                {Object.values(ClientStatus).map(status => (
                  <option key={status} value={status}>
                    {status.charAt(0).toUpperCase() + status.slice(1)}
                  </option>
                ))}
              </select>
            </div>
            <div className="filter-group">
              <label>Created From</label>
              <input
                type="date"
                value={filters.createdDateFrom || ''}
                onChange={(e) => handleFilterChange('createdDateFrom', e.target.value)}
              />
            </div>
            <div className="filter-group">
              <label>Created To</label>
              <input
                type="date"
                value={filters.createdDateTo || ''}
                onChange={(e) => handleFilterChange('createdDateTo', e.target.value)}
              />
            </div>
          </div>
          <div className="filters-actions">
            <button onClick={clearFilters} className="clear-filters-button">
              Clear Filters
            </button>
          </div>
        </div>
      )}

      {clients.length === 0 && !loading ? (
        <div className="empty-state">
          <h3>No Clients Found</h3>
          <p>{filters.search || Object.keys(filters).length > 2 
            ? 'No clients match your search criteria. Try adjusting your filters.'
            : 'Get started by creating your first client.'}</p>
          <button onClick={handleCreateClient} className="create-client-button">
            Create New Client
          </button>
        </div>
      ) : (
        <>
          <div className="clients-table-container">
            <table className="clients-table">
              <thead>
                <tr>
                  <th>Company Name</th>
                  <th>Contact Name</th>
                  <th>Contact Email</th>
                  <th>Industry</th>
                  <th>Status</th>
                  <th>Created</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {clients.map((client) => (
                  <tr key={client.id} className="client-row">
                    <td className="company-name">
                      <button 
                        onClick={() => handleViewClient(client.id)}
                        className="company-name-link"
                        title="View client details"
                      >
                        {client.companyName}
                      </button>
                    </td>
                    <td>{client.contactName}</td>
                    <td>{client.contactEmail}</td>
                    <td>{client.industry || 'N/A'}</td>
                    <td>
                      <span className={getStatusBadgeClass(client.status)}>
                        {client.status.charAt(0).toUpperCase() + client.status.slice(1)}
                      </span>
                    </td>
                    <td>{formatDate(client.createdAt)}</td>
                    <td>
                      <div className="action-buttons">
                        <button 
                          onClick={() => handleViewClient(client.id)}
                          className="view-button"
                          title="View details"
                        >
                          View
                        </button>
                        {canDeleteClient() && (
                          <button 
                            onClick={() => handleDeleteClick(client)}
                            className="delete-button"
                            title="Delete client"
                          >
                            Delete
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {totalClients > pageSize && (
            <div className="pagination-container">
              <div className="pagination-info">
                Showing {((currentPage - 1) * pageSize) + 1} to {Math.min(currentPage * pageSize, totalClients)} of {totalClients} clients
              </div>
              <div className="pagination-controls">
                <button 
                  onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                  disabled={currentPage === 1}
                  className="pagination-button"
                >
                  Previous
                </button>
                <span className="page-info">
                  Page {currentPage} of {Math.ceil(totalClients / pageSize)}
                </span>
                <button 
                  onClick={() => setCurrentPage(prev => prev + 1)}
                  disabled={currentPage * pageSize >= totalClients}
                  className="pagination-button"
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </>
      )}

      {/* Delete Confirmation Modal */}
      <ConfirmationModal
        isOpen={deleteModal.isOpen}
        title="Delete Client"
        message={`Are you sure you want to delete client "${deleteModal.client?.companyName}"? This action cannot be undone.`}
        confirmText="Delete Client"
        cancelText="Cancel"
        onConfirm={handleDeleteConfirm}
        onCancel={handleDeleteCancel}
        loading={deleteModal.loading}
        variant="danger"
      />

      {/* Toast Notifications */}
      <Toast
        message={toast.message}
        type={toast.type}
        isVisible={toast.isVisible}
        onClose={hideToast}
      />
    </div>
  );
};

export default ClientsList; 