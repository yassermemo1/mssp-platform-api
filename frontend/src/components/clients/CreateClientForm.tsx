import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { CreateClientDto, UpdateClientDto } from '../../types/client';
import { ApiError, UserRole } from '../../types/auth';
import { apiService } from '../../services/apiService';
import { useAuth } from '../../contexts/AuthContext';
import ClientForm from './ClientForm';

/**
 * CreateClientForm Component
 * Handles creation of new clients using the reusable ClientForm
 * Includes permission checking and success handling
 */
const CreateClientForm: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<boolean>(false);

  /**
   * Check if user has permission to create clients
   */
  const canCreateClient = (): boolean => {
    if (!user) return false;
    return [UserRole.ADMIN, UserRole.MANAGER, UserRole.ACCOUNT_MANAGER].includes(user.role);
  };

  /**
   * Handle form submission
   */
  const handleSubmit = async (data: CreateClientDto | UpdateClientDto) => {
    if (!canCreateClient()) {
      setError('You do not have permission to create clients. Please contact your administrator.');
      return;
    }

    try {
      setLoading(true);
      setError(null);
      setSuccess(false);

      await apiService.post('/clients', data);
      
      setSuccess(true);
      
      // Redirect to clients list after a short delay
      setTimeout(() => {
        navigate('/clients');
      }, 2000);

    } catch (err) {
      const apiError = err as ApiError;
      
      if (apiError.statusCode === 409) {
        setError('A client with this company name already exists');
      } else if (apiError.statusCode === 403) {
        setError('You do not have permission to create clients.');
      } else if (apiError.statusCode === 400) {
        setError('Please check your input and try again.');
      } else {
        setError(apiError.message || 'Failed to create client. Please try again.');
      }
      
      console.error('Error creating client:', err);
    } finally {
      setLoading(false);
    }
  };

  /**
   * Handle cancel action
   */
  const handleCancel = () => {
    navigate('/clients');
  };

  if (success) {
    return (
      <div className="client-form-container">
        <div className="success-container">
          <div className="success-icon">✓</div>
          <h3>Client Created Successfully!</h3>
          <p>Redirecting to clients list...</p>
        </div>
      </div>
    );
  }

  return (
    <ClientForm
      onSubmit={handleSubmit}
      onCancel={handleCancel}
      loading={loading}
      error={error}
      isEditMode={false}
    />
  );
};

export default CreateClientForm; 