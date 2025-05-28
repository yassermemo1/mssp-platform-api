import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { apiService } from '../../../services/apiService';
import { CreateContractDto } from '../../../types/contract';
import ContractForm from '../../../components/contracts/ContractForm';
import './CreateContractPage.css';

const CreateContractPage: React.FC = () => {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (data: CreateContractDto) => {
    try {
      setIsLoading(true);
      const response = await apiService.createContract(data);
      
      // Navigate to the contract details page
      navigate(`/admin/contracts/${response.data.id}`, {
        state: { message: 'Contract created successfully!' }
      });
    } catch (error: any) {
      // Error will be handled by the form component
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancel = () => {
    navigate('/admin/contracts');
  };

  return (
    <div className="create-contract-page">
      <div className="page-header">
        <h1>Create New Contract</h1>
        <p>Fill in the contract details below. All fields marked with * are required.</p>
      </div>

      <ContractForm
        onSubmit={(data) => handleSubmit(data as CreateContractDto)}
        onCancel={handleCancel}
        isLoading={isLoading}
        isEdit={false}
      />
    </div>
  );
};

export default CreateContractPage; 