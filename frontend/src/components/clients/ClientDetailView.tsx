import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Client, ClientStatus } from '../../types/client';
import { ApiError, UserRole } from '../../types/auth';
import { CustomFieldEntityType } from '../../types/customFields';
import { apiService } from '../../services/apiService';
import { useAuth } from '../../contexts/AuthContext';
import ConfirmationModal from '../common/ConfirmationModal';
import Toast from '../common/Toast';
import CustomFieldsDisplay from '../common/CustomFieldsDisplay';
import JiraTicketCountWidget from '../common/jira/JiraTicketCountWidget';
import JiraSLAWidget from '../common/jira/JiraSLAWidget';
import './ClientDetailView.css';

/**
 * ClientDetailView Component
 * Displays detailed information for a single client
 * Includes navigation options, role-based edit access, delete functionality, and Jira integration
 */
const ClientDetailView: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  
  const [client, setClient] = useState<Client | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [deleteModal, setDeleteModal] = useState<{
    isOpen: boolean;
    loading: boolean;
  }>({
    isOpen: false,
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

  // Configuration for Jira integration
  const jiraBaseUrl = process.env.REACT_APP_JIRA_BASE_URL || 'https://jira.company.com';

  /**
   * Check if user has permission to edit clients
   */
  const canEditClient = (): boolean => {
    if (!user) return false;
    return [UserRole.ADMIN, UserRole.MANAGER, UserRole.ACCOUNT_MANAGER].includes(user.role);
  };

  /**
   * Check if user has permission to delete clients
   * Only ADMIN and MANAGER roles can delete clients
   */
  const canDeleteClient = (): boolean => {
    if (!user) return false;
    return [UserRole.ADMIN, UserRole.MANAGER].includes(user.role);
  };

  /**
   * Fetch client details from the backend API
   */
  const fetchClient = useCallback(async () => {
    if (!id) {
      setError('Client ID is required');
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      const clientData = await apiService.get<Client>(`/clients/${id}`);
      setClient(clientData);
    } catch (err) {
      const apiError = err as ApiError;
      if (apiError.statusCode === 404) {
        setError('Client not found');
      } else {
        setError(apiError.message || 'Failed to load client details');
      }
      console.error('Error fetching client:', err);
    } finally {
      setLoading(false);
    }
  }, [id]);

  /**
   * Load client when component mounts or ID changes
   */
  useEffect(() => {
    fetchClient();
  }, [fetchClient]);

  /**
   * Navigate to edit client page
   */
  const handleEditClient = () => {
    if (client) {
      navigate(`/clients/${client.id}/edit`);
    }
  };

  /**
   * Navigate back to clients list
   */
  const handleBackToList = () => {
    navigate('/clients');
  };

  /**
   * Open delete confirmation modal
   */
  const handleDeleteClick = () => {
    setDeleteModal({
      isOpen: true,
      loading: false
    });
  };

  /**
   * Close delete confirmation modal
   */
  const handleDeleteCancel = () => {
    setDeleteModal({
      isOpen: false,
      loading: false
    });
  };

  /**
   * Confirm and execute client deletion
   */
  const handleDeleteConfirm = async () => {
    if (!client) return;

    setDeleteModal(prev => ({ ...prev, loading: true }));

    try {
      await apiService.delete(`/clients/${client.id}`);
      
      // Show success toast
      showToast(`Client "${client.companyName}" has been deleted successfully.`, 'success');
      
      // Close modal
      setDeleteModal({
        isOpen: false,
        loading: false
      });

      // Navigate back to clients list after a short delay
      setTimeout(() => {
        navigate('/clients');
      }, 1500);
      
    } catch (err) {
      const apiError = err as ApiError;
      let errorMessage = 'Failed to delete client';
      
      if (apiError.statusCode === 403) {
        errorMessage = 'You do not have permission to delete clients';
      } else if (apiError.statusCode === 404) {
        errorMessage = 'Client not found - it may have already been deleted';
        // Navigate back to clients list if client was already deleted
        setTimeout(() => {
          navigate('/clients');
        }, 2000);
      } else {
        errorMessage = apiError.message || errorMessage;
      }

      showToast(errorMessage, 'error');
      console.error('Error deleting client:', err);
      
      // Close modal even on error
      setDeleteModal({
        isOpen: false,
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
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading) {
    return (
      <div className="client-detail-container">
        <div className="loading-container">
          <div className="loading-spinner"></div>
          <p>Loading client details...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="client-detail-container">
        <div className="error-container">
          <h3>Error Loading Client</h3>
          <p>{error}</p>
          <div className="error-actions">
            <button onClick={fetchClient} className="retry-button">
              Try Again
            </button>
            <button onClick={handleBackToList} className="back-button">
              Back to Clients
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (!client) {
    return (
      <div className="client-detail-container">
        <div className="error-container">
          <h3>Client Not Found</h3>
          <p>The requested client could not be found.</p>
          <button onClick={handleBackToList} className="back-button">
            Back to Clients
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="client-detail-container">
      <div className="client-detail-header">
        <div className="header-left">
          <h2>{client.companyName}</h2>
          <span className={getStatusBadgeClass(client.status)}>
            {client.status.charAt(0).toUpperCase() + client.status.slice(1)}
          </span>
        </div>
        <div className="header-actions">
          <button onClick={handleBackToList} className="back-button">
            Back to Clients
          </button>
          <button 
            onClick={() => navigate(`/admin/clients/${client.id}/licenses`)} 
            className="view-licenses-button"
          >
            View Licenses
          </button>
          {canEditClient() && (
            <button onClick={handleEditClient} className="edit-button">
              Edit Client
            </button>
          )}
          {canDeleteClient() && (
            <button onClick={handleDeleteClick} className="delete-button">
              Delete Client
            </button>
          )}
        </div>
      </div>

      <div className="client-detail-content">
        {/* Client Information Sections */}
        <div className="client-info-sections">
          <div className="detail-section">
            <h3>Company Information</h3>
            <div className="detail-grid">
              <div className="detail-item">
                <label>Company Name</label>
                <span>{client.companyName}</span>
              </div>
              <div className="detail-item">
                <label>Industry</label>
                <span>{client.industry || 'Not specified'}</span>
              </div>
              <div className="detail-item">
                <label>Status</label>
                <span className={getStatusBadgeClass(client.status)}>
                  {client.status.charAt(0).toUpperCase() + client.status.slice(1)}
                </span>
              </div>
              {client.address && (
                <div className="detail-item full-width">
                  <label>Address</label>
                  <span>{client.address}</span>
                </div>
              )}
            </div>
          </div>

          <div className="detail-section">
            <h3>Contact Information</h3>
            <div className="detail-grid">
              <div className="detail-item">
                <label>Contact Name</label>
                <span>{client.contactName}</span>
              </div>
              <div className="detail-item">
                <label>Contact Email</label>
                <span>
                  <a href={`mailto:${client.contactEmail}`} className="email-link">
                    {client.contactEmail}
                  </a>
                </span>
              </div>
              {client.contactPhone && (
                <div className="detail-item">
                  <label>Contact Phone</label>
                  <span>
                    <a href={`tel:${client.contactPhone}`} className="phone-link">
                      {client.contactPhone}
                    </a>
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Dynamic Custom Fields Display */}
          <CustomFieldsDisplay
            entityType={CustomFieldEntityType.CLIENT}
            customFieldData={client.customFieldData}
            title="Additional Client Information"
          />

          <div className="detail-section">
            <h3>System Information</h3>
            <div className="detail-grid">
              <div className="detail-item">
                <label>Client ID</label>
                <span className="client-id">{client.id}</span>
              </div>
              <div className="detail-item">
                <label>Created</label>
                <span>{formatDate(client.createdAt)}</span>
              </div>
              <div className="detail-item">
                <label>Last Updated</label>
                <span>{formatDate(client.updatedAt)}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Jira Integration Section */}
        <div className="jira-integration-section">
          <div className="section-header">
            <h2>Ticket Management & SLA Performance</h2>
            <p>Real-time ticket data and SLA metrics for {client.companyName}</p>
          </div>
          
          <div className="jira-widgets-grid">
            {/* Client-Specific Ticket Counts Widget */}
            <div className="jira-widget-container">
              <JiraTicketCountWidget
                clientId={client.id}
                title={`${client.companyName} - Tickets`}
                jiraBaseUrl={jiraBaseUrl}
                refreshInterval={300000} // 5 minutes
              />
            </div>

            {/* Client-Specific SLA Performance Widget */}
            <div className="jira-widget-container">
              <JiraSLAWidget
                clientId={client.id}
                title={`${client.companyName} - SLA Performance`}
                jiraBaseUrl={jiraBaseUrl}
                refreshInterval={300000} // 5 minutes
              />
            </div>
          </div>
        </div>
      </div>

      {(!canEditClient() && !canDeleteClient()) && (
        <div className="permission-notice">
          <p>
            <strong>Note:</strong> You do not have permission to edit or delete client information. 
            Contact your administrator if you need to make changes.
          </p>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      <ConfirmationModal
        isOpen={deleteModal.isOpen}
        title="Delete Client"
        message={`Are you sure you want to delete client "${client.companyName}"? This action cannot be undone and will permanently remove all client data.`}
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

export default ClientDetailView; 