import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Client, ClientStatus } from '../../types/client';
import { ApiError, UserRole } from '../../types/auth';
import { apiService } from '../../services/apiService';
import { useAuth } from '../../contexts/AuthContext';
import './ClientDetailView.css';

/**
 * ClientDetailView Component
 * Displays detailed information for a single client
 * Includes navigation options and role-based edit access
 */
const ClientDetailView: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  
  const [client, setClient] = useState<Client | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  /**
   * Check if user has permission to edit clients
   */
  const canEditClient = (): boolean => {
    if (!user) return false;
    return [UserRole.ADMIN, UserRole.MANAGER, UserRole.ACCOUNT_MANAGER].includes(user.role);
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
          {canEditClient() && (
            <button onClick={handleEditClient} className="edit-button">
              Edit Client
            </button>
          )}
        </div>
      </div>

      <div className="client-detail-content">
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

      {!canEditClient() && (
        <div className="permission-notice">
          <p>
            <strong>Note:</strong> You do not have permission to edit client information. 
            Contact your administrator if you need to make changes.
          </p>
        </div>
      )}
    </div>
  );
};

export default ClientDetailView; 