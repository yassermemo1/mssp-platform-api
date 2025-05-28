import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Client, ClientStatus } from '../../types/client';
import { ApiError, UserRole } from '../../types/auth';
import { apiService } from '../../services/apiService';
import { useAuth } from '../../contexts/AuthContext';
import ConfirmationModal from '../common/ConfirmationModal';
import Toast from '../common/Toast';
import './ClientsList.css';

/**
 * ClientsList Component
 * Displays a list of all clients with basic information
 * Includes loading states, error handling, navigation to create new clients, and delete functionality
 */
const ClientsList: React.FC = () => {
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
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
   * Fetch clients from the backend API
   */
  const fetchClients = async () => {
    try {
      setLoading(true);
      setError(null);
      const clientsData = await apiService.get<Client[]>('/clients');
      setClients(clientsData);
    } catch (err) {
      const apiError = err as ApiError;
      setError(apiError.message || 'Failed to load clients');
      console.error('Error fetching clients:', err);
    } finally {
      setLoading(false);
    }
  };

  /**
   * Load clients when component mounts
   */
  useEffect(() => {
    fetchClients();
  }, []);

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
        <button onClick={handleCreateClient} className="create-client-button">
          Create New Client
        </button>
      </div>

      {clients.length === 0 ? (
        <div className="empty-state">
          <h3>No Clients Found</h3>
          <p>Get started by creating your first client.</p>
          <button onClick={handleCreateClient} className="create-client-button">
            Create New Client
          </button>
        </div>
      ) : (
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