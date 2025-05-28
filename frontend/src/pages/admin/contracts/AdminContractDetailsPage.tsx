import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useLocation, Link } from 'react-router-dom';
import { apiService } from '../../../services/apiService';
import { Contract, ContractStatus } from '../../../types/contract';
import ServiceScopeManager from '../../../components/contracts/ServiceScopeManager';
import './AdminContractDetailsPage.css';

const AdminContractDetailsPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const [contract, setContract] = useState<Contract | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  useEffect(() => {
    if (id) {
      fetchContract(id);
    }
    
    // Check for success message from navigation state
    if (location.state?.message) {
      setSuccessMessage(location.state.message);
      // Clear the message from history state
      window.history.replaceState({}, document.title);
    }
  }, [id, location.state]);

  const fetchContract = async (contractId: string) => {
    try {
      setLoading(true);
      const response = await apiService.getContract(contractId);
      setContract(response.data);
      setError(null);
    } catch (err: any) {
      setError(err.message || 'Failed to fetch contract details');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteContract = async () => {
    if (!contract) return;
    
    const confirmDelete = window.confirm(
      `Are you sure you want to terminate the contract "${contract.contractName}"? This action cannot be undone.`
    );
    
    if (confirmDelete) {
      try {
        await apiService.deleteContract(contract.id);
        navigate('/admin/contracts', {
          state: { message: 'Contract terminated successfully' }
        });
      } catch (err: any) {
        setError(err.message || 'Failed to terminate contract');
      }
    }
  };

  const getStatusBadgeClass = (status: ContractStatus) => {
    switch (status) {
      case ContractStatus.ACTIVE:
      case ContractStatus.RENEWED_ACTIVE:
        return 'status-badge status-active';
      case ContractStatus.DRAFT:
        return 'status-badge status-draft';
      case ContractStatus.EXPIRED:
        return 'status-badge status-expired';
      case ContractStatus.TERMINATED:
      case ContractStatus.CANCELLED:
        return 'status-badge status-terminated';
      default:
        return 'status-badge';
    }
  };

  const formatCurrency = (amount: number | null | undefined) => {
    if (!amount) return 'N/A';
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  };

  const formatDate = (dateString: string | null | undefined) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  if (loading) {
    return (
      <div className="admin-contract-details">
        <div className="loading">Loading contract details...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="admin-contract-details">
        <div className="error-message">{error}</div>
        <Link to="/admin/contracts" className="btn btn-secondary">
          Back to Contracts
        </Link>
      </div>
    );
  }

  if (!contract) {
    return (
      <div className="admin-contract-details">
        <div className="error-message">Contract not found</div>
        <Link to="/admin/contracts" className="btn btn-secondary">
          Back to Contracts
        </Link>
      </div>
    );
  }

  return (
    <div className="admin-contract-details">
      {successMessage && (
        <div className="success-message">
          {successMessage}
          <button 
            onClick={() => setSuccessMessage(null)}
            className="close-btn"
            aria-label="Close"
          >
            ×
          </button>
        </div>
      )}

      <div className="page-header">
        <div className="header-content">
          <div className="breadcrumb">
            <Link to="/admin/contracts">Contracts</Link>
            <span className="separator">›</span>
            <span>{contract.contractName}</span>
          </div>
          <h1>{contract.contractName}</h1>
          <div className="contract-status">
            <span className={getStatusBadgeClass(contract.status)}>
              {contract.status.replace('_', ' ').toUpperCase()}
            </span>
          </div>
        </div>
        
        <div className="header-actions">
          <Link 
            to={`/admin/contracts/${contract.id}/edit`} 
            className="btn btn-primary"
          >
            Edit Contract
          </Link>
          <button 
            onClick={handleDeleteContract}
            className="btn btn-danger"
            disabled={[ContractStatus.TERMINATED, ContractStatus.CANCELLED, ContractStatus.EXPIRED].includes(contract.status)}
          >
            Terminate Contract
          </button>
        </div>
      </div>

      {/* Contract Details Section */}
      <div className="details-section">
        <h2>Contract Information</h2>
        <div className="details-grid">
          <div className="detail-item">
            <label>Client:</label>
            <span>{contract.client?.companyName || 'Unknown Client'}</span>
          </div>
          
          <div className="detail-item">
            <label>Contract Value:</label>
            <span>{formatCurrency(contract.value)}</span>
          </div>
          
          <div className="detail-item">
            <label>Start Date:</label>
            <span>{formatDate(contract.startDate)}</span>
          </div>
          
          <div className="detail-item">
            <label>End Date:</label>
            <span>{formatDate(contract.endDate)}</span>
          </div>
          
          <div className="detail-item">
            <label>Renewal Date:</label>
            <span>{formatDate(contract.renewalDate)}</span>
          </div>
          
          <div className="detail-item">
            <label>Previous Contract:</label>
            <span>
              {contract.previousContract ? (
                <Link 
                  to={`/admin/contracts/${contract.previousContract.id}`}
                  className="contract-link"
                >
                  {contract.previousContract.contractName}
                </Link>
              ) : (
                'None'
              )}
            </span>
          </div>
          
          <div className="detail-item">
            <label>Created:</label>
            <span>{formatDate(contract.createdAt)}</span>
          </div>
          
          <div className="detail-item">
            <label>Last Updated:</label>
            <span>{formatDate(contract.updatedAt)}</span>
          </div>
        </div>
        
        {contract.notes && (
          <div className="notes-section">
            <label>Notes:</label>
            <p>{contract.notes}</p>
          </div>
        )}
        
        {contract.documentLink && (
          <div className="document-section">
            <label>Contract Document:</label>
            <a 
              href={`${apiService.getBaseURL()}${contract.documentLink}`}
              target="_blank"
              rel="noopener noreferrer"
              className="document-link"
            >
              📄 View Contract Document
            </a>
          </div>
        )}
      </div>

      {/* Service Scopes Section */}
      <div className="services-section">
        <ServiceScopeManager contractId={contract.id} />
      </div>

      {/* Renewal Contracts Section */}
      {contract.renewalContracts && contract.renewalContracts.length > 0 && (
        <div className="renewals-section">
          <h2>Renewal Contracts</h2>
          <div className="renewals-list">
            {contract.renewalContracts.map(renewal => (
              <div key={renewal.id} className="renewal-item">
                <Link 
                  to={`/admin/contracts/${renewal.id}`}
                  className="renewal-link"
                >
                  {renewal.contractName}
                </Link>
                <span className={getStatusBadgeClass(renewal.status)}>
                  {renewal.status.replace('_', ' ').toUpperCase()}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminContractDetailsPage; 