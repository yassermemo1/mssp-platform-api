import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Client, ClientStatus } from '../../types/client';
import { ApiError } from '../../types/auth';
import { apiService } from '../../services/apiService';
import './ClientsList.css';

/**
 * ClientsList Component
 * Displays a list of all clients with basic information
 * Includes loading states, error handling, and navigation to create new clients
 */
const ClientsList: React.FC = () => {
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

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
                    <button 
                      onClick={() => handleViewClient(client.id)}
                      className="view-button"
                      title="View details"
                    >
                      View
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default ClientsList; 