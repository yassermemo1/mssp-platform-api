import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { CreateTeamAssignmentDto } from '../../../types/team-assignment';
import { ApiError, UserRole } from '../../../types/auth';
import { apiService } from '../../../services/apiService';
import { useAuth } from '../../../contexts/AuthContext';
import TeamAssignmentForm from '../../../components/team-assignments/TeamAssignmentForm';

/**
 * CreateTeamAssignmentPage Component
 * Page for creating new team assignments
 * Uses the reusable TeamAssignmentForm component
 * Supports URL parameters for pre-selecting client or user
 */
const CreateTeamAssignmentPage: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [searchParams] = useSearchParams();
  
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<boolean>(false);
  const [preSelectedClientId, setPreSelectedClientId] = useState<string | null>(null);
  const [preSelectedUserId, setPreSelectedUserId] = useState<string | null>(null);

  /**
   * Extract URL parameters on component mount
   */
  useEffect(() => {
    const clientId = searchParams.get('clientId');
    const userId = searchParams.get('userId');
    
    if (clientId) {
      setPreSelectedClientId(clientId);
    }
    
    if (userId) {
      setPreSelectedUserId(userId);
    }
  }, [searchParams]);

  /**
   * Check if user has permission to create team assignments
   */
  const canCreateAssignments = (): boolean => {
    if (!user) return false;
    return [UserRole.ADMIN, UserRole.MANAGER, UserRole.ACCOUNT_MANAGER].includes(user.role);
  };

  /**
   * Handle form submission
   */
  const handleSubmit = async (data: CreateTeamAssignmentDto) => {
    if (!canCreateAssignments()) {
      setError('You do not have permission to create team assignments.');
      return;
    }

    try {
      setSubmitting(true);
      setError(null);
      setSuccess(false);

      await apiService.post('/team-assignments', data);
      setSuccess(true);
      
      // Redirect to assignments list after a short delay
      setTimeout(() => {
        navigate('/admin/team-assignments');
      }, 2000);

    } catch (err) {
      const apiError = err as ApiError;
      
      if (apiError.statusCode === 409) {
        setError('This user is already assigned to this client with this role. Please check existing assignments.');
      } else if (apiError.statusCode === 403) {
        setError('You do not have permission to create team assignments.');
      } else if (apiError.statusCode === 404) {
        setError('Selected user or client not found. Please refresh and try again.');
      } else if (apiError.statusCode === 400) {
        setError('Please check your input and try again. Make sure all required fields are filled.');
      } else {
        setError(apiError.message || 'Failed to create team assignment. Please try again.');
      }
      
      console.error('Error creating team assignment:', err);
    } finally {
      setSubmitting(false);
    }
  };

  /**
   * Handle cancel action
   */
  const handleCancel = () => {
    navigate('/admin/team-assignments');
  };

  // Check permissions first
  if (!canCreateAssignments()) {
    return (
      <div className="admin-page-container">
        <div className="error-container">
          <h3>Access Denied</h3>
          <p>You do not have permission to create team assignments. Contact your administrator if you need access.</p>
          <button onClick={() => navigate('/admin/team-assignments')} className="back-button">
            Back to Team Assignments
          </button>
        </div>
      </div>
    );
  }

  if (success) {
    return (
      <div className="admin-page-container">
        <div className="success-container">
          <div className="success-icon">✓</div>
          <h3>Team Assignment Created Successfully!</h3>
          <p>The team member has been assigned to the client. Redirecting to assignments list...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="admin-page-container">
      <div className="page-header">
        <h1>Create New Team Assignment</h1>
        <nav className="breadcrumb">
          <button 
            onClick={() => navigate('/admin/team-assignments')}
            className="breadcrumb-link"
          >
            Team Assignments
          </button>
          <span className="breadcrumb-separator">/</span>
          <span className="breadcrumb-current">Create New</span>
        </nav>
      </div>

      <TeamAssignmentForm
        onSubmit={handleSubmit}
        onCancel={handleCancel}
        loading={submitting}
        error={error}
        isEditMode={false}
        preSelectedClientId={preSelectedClientId}
        preSelectedUserId={preSelectedUserId}
      />
    </div>
  );
};

export default CreateTeamAssignmentPage; 