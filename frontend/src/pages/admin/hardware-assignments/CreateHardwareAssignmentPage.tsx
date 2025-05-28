import React, { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { apiService } from '../../../services/apiService';
import { CreateClientHardwareAssignmentDto, UpdateClientHardwareAssignmentDto } from '../../../types/hardware';
import { ApiError } from '../../../types/auth';
import HardwareAssignmentForm from '../../../components/hardware/HardwareAssignmentForm';
import './HardwareAssignmentPages.css';

/**
 * CreateHardwareAssignmentPage Component
 * Page for creating new hardware assignments
 * Uses the reusable HardwareAssignmentForm component
 * Supports pre-selection via URL parameters (assetId, clientId)
 */
const CreateHardwareAssignmentPage: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // Get pre-selected values from URL parameters
  const preselectedAssetId = searchParams.get('assetId') || undefined;
  const preselectedClientId = searchParams.get('clientId') || undefined;

  /**
   * Handle form submission
   */
  const handleSubmit = async (data: CreateClientHardwareAssignmentDto | UpdateClientHardwareAssignmentDto) => {
    try {
      setLoading(true);
      setError(null);

      // Since this is the create page, we know it's CreateClientHardwareAssignmentDto
      const newAssignment = await apiService.createHardwareAssignment(data as CreateClientHardwareAssignmentDto);
      
      // Redirect to the assignments list page with success message
      navigate('/admin/hardware-assignments', { 
        state: { 
          message: `Hardware assignment created successfully! Asset "${newAssignment.hardwareAsset?.assetTag}" assigned to "${newAssignment.client?.companyName}".`,
          type: 'success'
        }
      });

    } catch (err) {
      const apiError = err as ApiError;
      
      if (apiError.statusCode === 409) {
        setError('This hardware asset is already assigned to a client. Please select a different asset or return the current assignment first.');
      } else if (apiError.statusCode === 400) {
        setError('Please check your input and try again. Make sure all required fields are filled correctly.');
      } else if (apiError.statusCode === 403) {
        setError('You do not have permission to create hardware assignments.');
      } else if (apiError.statusCode === 404) {
        if (apiError.message?.includes('hardware asset')) {
          setError('The selected hardware asset was not found. It may have been deleted or is no longer available.');
        } else if (apiError.message?.includes('client')) {
          setError('The selected client was not found. Please select a different client.');
        } else if (apiError.message?.includes('service scope')) {
          setError('The selected service scope was not found. Please select a different service scope or leave it blank.');
        } else {
          setError('One or more selected items were not found. Please refresh the page and try again.');
        }
      } else {
        setError(apiError.message || 'Failed to create hardware assignment. Please try again.');
      }
      
      console.error('Error creating hardware assignment:', err);
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

  return (
    <div className="create-hardware-assignment-page">
      <HardwareAssignmentForm
        preselectedAssetId={preselectedAssetId}
        preselectedClientId={preselectedClientId}
        onSubmit={handleSubmit}
        onCancel={handleCancel}
        loading={loading}
        error={error}
        isEditMode={false}
      />
    </div>
  );
};

export default CreateHardwareAssignmentPage; 