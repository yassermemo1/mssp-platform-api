import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { apiService } from '../../../services/apiService';
import { 
  ClientHardwareAssignment, 
  UpdateClientHardwareAssignmentDto 
} from '../../../types/hardware';
import { ApiError } from '../../../types/auth';
import HardwareAssignmentForm from '../../../components/hardware/HardwareAssignmentForm';
import './HardwareAssignmentPages.css';

/**
 * EditHardwareAssignmentPage Component
 * Page for editing existing hardware assignments
 * Uses the reusable HardwareAssignmentForm component
 */
const EditHardwareAssignmentPage: React.FC = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const [assignment, setAssignment] = useState<ClientHardwareAssignment | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [loadingAssignment, setLoadingAssignment] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  /**
   * Load assignment data
   */
  useEffect(() => {
    const loadAssignment = async () => {
      if (!id) {
        setError('Assignment ID is required');
        setLoadingAssignment(false);
        return;
      }

      try {
        setLoadingAssignment(true);
        setError(null);

        const assignmentData = await apiService.getHardwareAssignment(id);
        setAssignment(assignmentData);

      } catch (err) {
        const apiError = err as ApiError;
        
        if (apiError.statusCode === 404) {
          setError('Hardware assignment not found. It may have been deleted.');
        } else if (apiError.statusCode === 403) {
          setError('You do not have permission to view this hardware assignment.');
        } else {
          setError(apiError.message || 'Failed to load hardware assignment. Please try again.');
        }
        
        console.error('Error loading hardware assignment:', err);
      } finally {
        setLoadingAssignment(false);
      }
    };

    loadAssignment();
  }, [id]);

  /**
   * Handle form submission
   */
  const handleSubmit = async (data: UpdateClientHardwareAssignmentDto) => {
    if (!id) {
      setError('Assignment ID is required');
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const updatedAssignment = await apiService.updateHardwareAssignment(id, data);
      
      // Redirect to the assignments list page with success message
      navigate('/admin/hardware-assignments', { 
        state: { 
          message: `Hardware assignment updated successfully! Assignment for "${updatedAssignment.hardwareAsset?.assetTag}" has been updated.`,
          type: 'success'
        }
      });

    } catch (err) {
      const apiError = err as ApiError;
      
      if (apiError.statusCode === 404) {
        if (apiError.message?.includes('assignment')) {
          setError('Hardware assignment not found. It may have been deleted.');
        } else if (apiError.message?.includes('client')) {
          setError('The selected client was not found. Please select a different client.');
        } else if (apiError.message?.includes('service scope')) {
          setError('The selected service scope was not found. Please select a different service scope or leave it blank.');
        } else {
          setError('One or more selected items were not found. Please refresh the page and try again.');
        }
      } else if (apiError.statusCode === 400) {
        setError('Please check your input and try again. Make sure all required fields are filled correctly.');
      } else if (apiError.statusCode === 403) {
        setError('You do not have permission to update this hardware assignment.');
      } else if (apiError.statusCode === 409) {
        setError('There was a conflict updating this assignment. Please refresh the page and try again.');
      } else {
        setError(apiError.message || 'Failed to update hardware assignment. Please try again.');
      }
      
      console.error('Error updating hardware assignment:', err);
    } finally {
      setLoading(false);
    }
  };

  /**
   * Handle cancel action
   */
  const handleCancel = () => {
    navigate('/admin/hardware-assignments');
  };

  // Show loading state while fetching assignment
  if (loadingAssignment) {
    return (
      <div className="edit-hardware-assignment-page">
        <div className="loading-container">
          <div className="loading-spinner"></div>
          <p>Loading assignment details...</p>
        </div>
      </div>
    );
  }

  // Show error if assignment couldn't be loaded
  if (error && !assignment) {
    return (
      <div className="edit-hardware-assignment-page">
        <div className="error-container">
          <div className="error-message">
            {error}
          </div>
          <div className="error-actions">
            <button 
              onClick={() => navigate('/admin/hardware-assignments')}
              className="btn btn-secondary"
            >
              Back to Assignments
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="edit-hardware-assignment-page">
      <HardwareAssignmentForm
        initialData={assignment}
        onSubmit={handleSubmit}
        onCancel={handleCancel}
        loading={loading}
        error={error}
        isEditMode={true}
      />
    </div>
  );
};

export default EditHardwareAssignmentPage; 