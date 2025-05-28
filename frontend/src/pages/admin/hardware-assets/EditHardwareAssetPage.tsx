import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { apiService } from '../../../services/apiService';
import { HardwareAsset, UpdateHardwareAssetDto } from '../../../types/hardware';
import { ApiError } from '../../../types/auth';
import HardwareAssetForm from '../../../components/hardware/HardwareAssetForm';

/**
 * EditHardwareAssetPage Component
 * Page for editing existing hardware assets
 * Uses the reusable HardwareAssetForm component
 */
const EditHardwareAssetPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  
  const [asset, setAsset] = useState<HardwareAsset | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  /**
   * Fetch hardware asset details
   */
  const fetchAsset = useCallback(async () => {
    if (!id) {
      setError('Hardware asset ID is required');
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      const assetData = await apiService.getHardwareAsset(id);
      setAsset(assetData);
    } catch (err) {
      const apiError = err as ApiError;
      if (apiError.statusCode === 404) {
        setError('Hardware asset not found');
      } else {
        setError(apiError.message || 'Failed to load hardware asset details');
      }
      console.error('Error fetching hardware asset:', err);
    } finally {
      setLoading(false);
    }
  }, [id]);

  /**
   * Load asset when component mounts or ID changes
   */
  useEffect(() => {
    fetchAsset();
  }, [fetchAsset]);

  /**
   * Handle form submission
   */
  const handleSubmit = async (data: UpdateHardwareAssetDto) => {
    if (!id) {
      setError('Hardware asset ID is required');
      return;
    }

    try {
      setSubmitting(true);
      setError(null);

      const updatedAsset = await apiService.updateHardwareAsset(id, data);
      setAsset(updatedAsset);
      
      // Redirect to the asset list page with success message
      navigate('/admin/hardware-assets', { 
        state: { 
          message: `Hardware asset "${updatedAsset.assetTag}" updated successfully!`,
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
        setError('You do not have permission to edit hardware assets.');
      } else if (apiError.statusCode === 404) {
        setError('Hardware asset not found.');
      } else {
        setError(apiError.message || 'Failed to update hardware asset. Please try again.');
      }
      
      console.error('Error updating hardware asset:', err);
    } finally {
      setSubmitting(false);
    }
  };

  /**
   * Handle cancel action
   */
  const handleCancel = () => {
    if (asset) {
      navigate('/admin/hardware-assets');
    } else {
      navigate('/admin/hardware-assets');
    }
  };

  if (loading) {
    return (
      <div className="edit-hardware-asset-page">
        <div className="loading-container">
          <div className="loading-spinner"></div>
          <p>Loading hardware asset details...</p>
        </div>
      </div>
    );
  }

  if (error && !asset) {
    return (
      <div className="edit-hardware-asset-page">
        <div className="error-container">
          <h3>Error Loading Hardware Asset</h3>
          <p>{error}</p>
          <div className="error-actions">
            <button onClick={fetchAsset} className="btn btn-primary">
              Try Again
            </button>
            <button onClick={() => navigate('/admin/hardware-assets')} className="btn btn-secondary">
              Back to Assets
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="edit-hardware-asset-page">
      <HardwareAssetForm
        initialData={asset}
        onSubmit={handleSubmit}
        onCancel={handleCancel}
        loading={submitting}
        error={error}
        isEditMode={true}
      />
    </div>
  );
};

export default EditHardwareAssetPage; 