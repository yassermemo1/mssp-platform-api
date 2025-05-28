import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ClientTeamAssignment, UpdateTeamAssignmentDto } from '../../../types/team-assignment';
import { ApiError, UserRole } from '../../../types/auth';
import { apiService } from '../../../services/apiService';
import { useAuth } from '../../../contexts/AuthContext';
import TeamAssignmentForm from '../../../components/team-assignments/TeamAssignmentForm';

/**
 * EditTeamAssignmentPage Component
 * Page for editing existing team assignments
 * Fetches assignment data and uses the reusable TeamAssignmentForm component
 */
const EditTeamAssignmentPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  
  const [assignment, setAssignment] = useState<ClientTeamAssignment | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<boolean>(false);

  /**
   * Check if user has permission to edit team assignments
   */
  const canEditAssignments = (): boolean => {
    if (!user) return false;
    return [UserRole.ADMIN, UserRole.MANAGER, UserRole.ACCOUNT_MANAGER].includes(user.role);
  };

  /**
   * Fetch assignment details from the backend API
   */
  const fetchAssignment = useCallback(async () => {
    if (!id) {
      setError('Assignment ID is required');
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      const assignmentData = await apiService.get<ClientTeamAssignment>(`/team-assignments/${id}`);
      setAssignment(assignmentData);
    } catch (err) {
      const apiError = err as ApiError;
      if (apiError.statusCode === 404) {
        setError('Team assignment not found');
      } else {
        setError(apiError.message || 'Failed to load assignment details');
      }
      console.error('Error fetching assignment:', err);
    } finally {
      setLoading(false);
    }
  }, [id]);

  /**
   * Load assignment when component mounts or ID changes
   */
  useEffect(() => {
    fetchAssignment();
  }, [fetchAssignment]);

  /**
   * Handle form submission
   */
  const handleSubmit = async (data: UpdateTeamAssignmentDto) => {
    if (!id || !canEditAssignments()) {
      setError('You do not have permission to edit team assignments.');
      return;
    }

    try {
      setSubmitting(true);
      setError(null);
      setSuccess(false);

      const updatedAssignment = await apiService.patch<ClientTeamAssignment>(`/team-assignments/${id}`, data);
      setAssignment(updatedAssignment);
      setSuccess(true);
      
      // Redirect to assignments list after a short delay
      setTimeout(() => {
        navigate('/admin/team-assignments');
      }, 2000);

    } catch (err) {
      const apiError = err as ApiError;
      
      if (apiError.statusCode === 409) {
        setError('This assignment configuration conflicts with an existing assignment. Please check for duplicates.');
      } else if (apiError.statusCode === 403) {
        setError('You do not have permission to edit team assignments.');
      } else if (apiError.statusCode === 404) {
        setError('Team assignment not found.');
      } else if (apiError.statusCode === 400) {
        setError('Please check your input and try again.');
      } else {
        setError(apiError.message || 'Failed to update team assignment. Please try again.');
      }
      
      console.error('Error updating assignment:', err);
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
  if (!canEditAssignments()) {
    return (
      <div className="admin-page-container">
        <div className="error-container">
          <h3>Access Denied</h3>
          <p>You do not have permission to edit team assignments. Contact your administrator if you need access.</p>
          <button onClick={() => navigate('/admin/team-assignments')} className="back-button">
            Back to Team Assignments
          </button>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="admin-page-container">
        <div className="loading-container">
          <div className="loading-spinner"></div>
          <p>Loading assignment details...</p>
        </div>
      </div>
    );
  }

  if (error && !assignment) {
    return (
      <div className="admin-page-container">
        <div className="error-container">
          <h3>Error Loading Assignment</h3>
          <p>{error}</p>
          <div className="error-actions">
            <button onClick={fetchAssignment} className="retry-button">
              Try Again
            </button>
            <button onClick={() => navigate('/admin/team-assignments')} className="back-button">
              Back to Team Assignments
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (success) {
    return (
      <div className="admin-page-container">
        <div className="success-container">
          <div className="success-icon">✓</div>
          <h3>Team Assignment Updated Successfully!</h3>
          <p>The assignment has been updated. Redirecting to assignments list...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="admin-page-container">
      <div className="page-header">
        <h1>Edit Team Assignment</h1>
        <nav className="breadcrumb">
          <button 
            onClick={() => navigate('/admin/team-assignments')}
            className="breadcrumb-link"
          >
            Team Assignments
          </button>
          <span className="breadcrumb-separator">/</span>
          <span className="breadcrumb-current">Edit Assignment</span>
        </nav>
      </div>

      {assignment ? (
        <TeamAssignmentForm
          initialData={assignment}
          onSubmit={handleSubmit}
          onCancel={handleCancel}
          loading={submitting}
          error={error}
          isEditMode={true}
        />
      ) : (
        <div className="loading-container">
          <div className="loading-spinner"></div>
          <p>Loading assignment details...</p>
        </div>
      )}
    </div>
  );
};

export default EditTeamAssignmentPage; 