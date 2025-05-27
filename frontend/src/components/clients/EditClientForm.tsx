import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Client, UpdateClientDto, CreateClientDto } from '../../types/client';
import { ApiError, UserRole } from '../../types/auth';
import { apiService } from '../../services/apiService';
import { useAuth } from '../../contexts/AuthContext';
import ClientForm from './ClientForm';

/**
 * EditClientForm Component
 * Handles editing of existing clients using the reusable ClientForm
 * Includes data fetching, permission checking, and success handling
 */
const EditClientForm: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  
  const [client, setClient] = useState<Client | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<boolean>(false);

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
   * Handle form submission
   */
  const handleSubmit = async (data: CreateClientDto | UpdateClientDto) => {
    if (!id || !canEditClient()) {
      setError('You do not have permission to edit clients.');
      return;
    }

    try {
      setSubmitting(true);
      setError(null);
      setSuccess(false);

      const updatedClient = await apiService.patch<Client>(`/clients/${id}`, data);
      setClient(updatedClient);
      setSuccess(true);
      
      // Redirect to client details after a short delay
      setTimeout(() => {
        navigate(`/clients/${id}`);
      }, 2000);

    } catch (err) {
      const apiError = err as ApiError;
      
      if (apiError.statusCode === 409) {
        setError('A client with this company name already exists');
      } else if (apiError.statusCode === 403) {
        setError('You do not have permission to edit clients.');
      } else if (apiError.statusCode === 404) {
        setError('Client not found.');
      } else if (apiError.statusCode === 400) {
        setError('Please check your input and try again.');
      } else {
        setError(apiError.message || 'Failed to update client. Please try again.');
      }
      
      console.error('Error updating client:', err);
    } finally {
      setSubmitting(false);
    }
  };

  /**
   * Handle cancel action
   */
  const handleCancel = () => {
    if (client) {
      navigate(`/clients/${client.id}`);
    } else {
      navigate('/clients');
    }
  };

  // Check permissions first
  if (!canEditClient()) {
    return (
      <div className="client-form-container">
        <div className="error-container">
          <h3>Access Denied</h3>
          <p>You do not have permission to edit client information. Contact your administrator if you need to make changes.</p>
          <button onClick={() => navigate('/clients')} className="back-button">
            Back to Clients
          </button>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="client-form-container">
        <div className="loading-container">
          <div className="loading-spinner"></div>
          <p>Loading client details...</p>
        </div>
      </div>
    );
  }

  if (error && !client) {
    return (
      <div className="client-form-container">
        <div className="error-container">
          <h3>Error Loading Client</h3>
          <p>{error}</p>
          <div className="error-actions">
            <button onClick={fetchClient} className="retry-button">
              Try Again
            </button>
            <button onClick={() => navigate('/clients')} className="back-button">
              Back to Clients
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (success) {
    return (
      <div className="client-form-container">
        <div className="success-container">
          <div className="success-icon">✓</div>
          <h3>Client Updated Successfully!</h3>
          <p>Redirecting to client details...</p>
        </div>
      </div>
    );
  }

  return (
    <ClientForm
      initialData={client}
      onSubmit={handleSubmit}
      onCancel={handleCancel}
      loading={submitting}
      error={error}
      isEditMode={true}
    />
  );
};

export default EditClientForm; 