import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  Proposal, 
  UpdateProposalDto 
} from '../../../types/service-scope';
import { UserRole } from '../../../types/auth';
import { apiService } from '../../../services/apiService';
import { useAuth } from '../../../contexts/AuthContext';
import ProposalForm from '../../../components/contracts/ProposalForm';
import './ProposalEditPage.css';

const ProposalEditPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [proposal, setProposal] = useState<Proposal | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<boolean>(false);

  /**
   * Check if user can edit proposals
   */
  const canEditProposal = useCallback((): boolean => {
    if (!user) return false;
    return [UserRole.ADMIN, UserRole.MANAGER, UserRole.ACCOUNT_MANAGER].includes(user.role);
  }, [user]);

  /**
   * Fetch proposal details
   */
  const fetchProposal = useCallback(async () => {
    if (!id) {
      setError('Proposal ID is required');
      setLoading(false);
      return;
    }

    if (!canEditProposal()) {
      setError('You do not have permission to edit proposals.');
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      const response = await apiService.getProposal(id);
      setProposal(response.data);
    } catch (err: any) {
      if (err.statusCode === 404) {
        setError('Proposal not found');
      } else if (err.statusCode === 403) {
        setError('You do not have permission to view this proposal.');
      } else {
        setError(err.message || 'Failed to load proposal details');
      }
      console.error('Error fetching proposal:', err);
    } finally {
      setLoading(false);
    }
  }, [id, canEditProposal]);

  useEffect(() => {
    fetchProposal();
  }, [fetchProposal]);

  /**
   * Handle form submission
   */
  const handleSubmit = async (data: UpdateProposalDto, file?: File) => {
    if (!id || !canEditProposal()) {
      setError('You do not have permission to edit proposals.');
      return;
    }

    try {
      setSubmitting(true);
      setError(null);
      setSuccess(false);

      // Update proposal
      const updatedProposal = await apiService.updateProposal(id, data);
      
      // Upload new document if provided
      if (file) {
        await apiService.uploadProposalDocument(id, file);
        // Fetch updated proposal to get new document link
        const refreshedResponse = await apiService.getProposal(id);
        setProposal(refreshedResponse.data);
      } else {
        setProposal(updatedProposal.data);
      }
      
      setSuccess(true);
      
      // Redirect after a short delay
      setTimeout(() => {
        navigate('/admin/proposals');
      }, 2000);

    } catch (err: any) {
      if (err.statusCode === 409) {
        setError('A proposal with these details already exists');
      } else if (err.statusCode === 403) {
        setError('You do not have permission to edit this proposal.');
      } else if (err.statusCode === 404) {
        setError('Proposal not found.');
      } else if (err.statusCode === 400) {
        setError('Please check your input and try again.');
      } else {
        setError(err.message || 'Failed to update proposal. Please try again.');
      }
      
      console.error('Error updating proposal:', err);
    } finally {
      setSubmitting(false);
    }
  };

  /**
   * Handle cancel action
   */
  const handleCancel = () => {
    navigate('/admin/proposals');
  };

  // Check permissions first
  if (!canEditProposal()) {
    return (
      <div className="proposal-edit-page">
        <div className="access-denied">
          <h2>Access Denied</h2>
          <p>You do not have permission to edit proposals. Contact your administrator if you need to make changes.</p>
          <button onClick={() => navigate('/admin/proposals')} className="btn btn-primary">
            Back to Proposals
          </button>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="proposal-edit-page">
        <div className="loading-container">
          <div className="loading-spinner"></div>
          <p>Loading proposal details...</p>
        </div>
      </div>
    );
  }

  if (error && !proposal) {
    return (
      <div className="proposal-edit-page">
        <div className="error-container">
          <h2>Error Loading Proposal</h2>
          <p>{error}</p>
          <div className="error-actions">
            <button onClick={fetchProposal} className="btn btn-secondary">
              Try Again
            </button>
            <button onClick={() => navigate('/admin/proposals')} className="btn btn-primary">
              Back to Proposals
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (success) {
    return (
      <div className="proposal-edit-page">
        <div className="success-container">
          <div className="success-icon">✓</div>
          <h2>Proposal Updated Successfully!</h2>
          <p>Redirecting to proposals list...</p>
        </div>
      </div>
    );
  }

  if (!proposal) {
    return (
      <div className="proposal-edit-page">
        <div className="error-container">
          <h2>Proposal Not Found</h2>
          <p>The requested proposal could not be found.</p>
          <button onClick={() => navigate('/admin/proposals')} className="btn btn-primary">
            Back to Proposals
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="proposal-edit-page">
      <div className="page-header">
        <div className="header-content">
          <h1>Edit Proposal</h1>
          <p>Update proposal details and documentation.</p>
        </div>
        <div className="header-actions">
          <button onClick={handleCancel} className="btn btn-secondary">
            Cancel
          </button>
        </div>
      </div>

      {error && (
        <div className="error-message">
          {error}
          <button onClick={() => setError(null)} className="close-btn">×</button>
        </div>
      )}

      <div className="form-container">
        <ProposalForm
          serviceScopeId={proposal.serviceScopeId}
          proposal={proposal}
          onSubmit={handleSubmit}
          onCancel={handleCancel}
          isLoading={submitting}
        />
      </div>
    </div>
  );
};

export default ProposalEditPage; 