import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { apiService } from '../../../services/apiService';
import { CreateHardwareAssetDto, UpdateHardwareAssetDto } from '../../../types/hardware';
import { ApiError } from '../../../types/auth';
import HardwareAssetForm from '../../../components/hardware/HardwareAssetForm';

/**
 * CreateHardwareAssetPage Component
 * Page for creating new hardware assets
 * Uses the reusable HardwareAssetForm component
 */
const CreateHardwareAssetPage: React.FC = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  /**
   * Handle form submission
   */
  const handleSubmit = async (data: CreateHardwareAssetDto | UpdateHardwareAssetDto) => {
    try {
      setLoading(true);
      setError(null);

      // Since this is the create page, we know it's CreateHardwareAssetDto
      const newAsset = await apiService.createHardwareAsset(data as CreateHardwareAssetDto);
      
      // Redirect to the asset list page with success message
      navigate('/admin/hardware-assets', { 
        state: { 
          message: `Hardware asset "${newAsset.assetTag}" created successfully!`,
          type: 'success'
        }
      });

    } catch (err) {
      const apiError = err as ApiError;
      
      if (apiError.statusCode === 409) {
        setError('A hardware asset with this asset tag already exists. Please use a different asset tag.');
      } else if (apiError.statusCode === 400) {
        setError('Please check your input and try again. Make sure all required fields are filled correctly.');
      } else if (apiError.statusCode === 403) {
        setError('You do not have permission to create hardware assets.');
      } else {
        setError(apiError.message || 'Failed to create hardware asset. Please try again.');
      }
      
      console.error('Error creating hardware asset:', err);
    } finally {
      setLoading(false);
    }
  };

  /**
   * Handle cancel action
   */
  const handleCancel = () => {
    navigate('/admin/hardware-assets');
  };

  return (
    <div className="create-hardware-asset-page">
      <HardwareAssetForm
        onSubmit={handleSubmit}
        onCancel={handleCancel}
        loading={loading}
        error={error}
        isEditMode={false}
      />
    </div>
  );
};

export default CreateHardwareAssetPage; 