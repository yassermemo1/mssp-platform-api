import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { apiService } from '../../../services/apiService';
import { Contract, UpdateContractDto } from '../../../types/contract';
import ContractForm from '../../../components/contracts/ContractForm';
import './EditContractPage.css';

const EditContractPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [contract, setContract] = useState<Contract | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (id) {
      fetchContract(id);
    }
  }, [id]);

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

  const handleSubmit = async (data: UpdateContractDto) => {
    if (!contract) return;
    
    try {
      setSaving(true);
      const response = await apiService.updateContract(contract.id, data);
      
      // Navigate to the contract details page
      navigate(`/admin/contracts/${response.data.id}`, {
        state: { message: 'Contract updated successfully!' }
      });
    } catch (error: any) {
      // Error will be handled by the form component
      throw error;
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    if (contract) {
      navigate(`/admin/contracts/${contract.id}`);
    } else {
      navigate('/admin/contracts');
    }
  };

  if (loading) {
    return (
      <div className="edit-contract-page">
        <div className="loading">Loading contract details...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="edit-contract-page">
        <div className="error-message">{error}</div>
        <button onClick={() => navigate('/admin/contracts')} className="btn btn-secondary">
          Back to Contracts
        </button>
      </div>
    );
  }

  if (!contract) {
    return (
      <div className="edit-contract-page">
        <div className="error-message">Contract not found</div>
        <button onClick={() => navigate('/admin/contracts')} className="btn btn-secondary">
          Back to Contracts
        </button>
      </div>
    );
  }

  return (
    <div className="edit-contract-page">
      <div className="page-header">
        <h1>Edit Contract</h1>
        <p>Update the contract details below. All fields marked with * are required.</p>
        <div className="contract-info">
          <span className="contract-name">{contract.contractName}</span>
          <span className="contract-client">
            {contract.client?.companyName || 'Unknown Client'}
          </span>
        </div>
      </div>

      <ContractForm
        contract={contract}
        onSubmit={handleSubmit}
        onCancel={handleCancel}
        isLoading={saving}
        isEdit={true}
      />
    </div>
  );
};

export default EditContractPage; 