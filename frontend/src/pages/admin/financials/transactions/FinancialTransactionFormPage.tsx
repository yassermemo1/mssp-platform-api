import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '../../../../contexts/AuthContext';
import { apiService } from '../../../../services/apiService';
import {
  FinancialTransaction,
  CreateFinancialTransactionDto,
  UpdateFinancialTransactionDto,
  FinancialTransactionType,
  FinancialTransactionStatus,
  getTransactionTypeLabel,
  getTransactionStatusLabel,
  isRevenueType
} from '../../../../types/financial';
import './FinancialTransactionFormPage.css';

interface FormData {
  type: FinancialTransactionType | '';
  amount: string;
  currency: string;
  transactionDate: string;
  description: string;
  status: FinancialTransactionStatus | '';
  referenceId: string;
  notes: string;
  dueDate: string;
  clientId: string;
  contractId: string;
  serviceScopeId: string;
  hardwareAssetId: string;
}

const FinancialTransactionFormPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const isEdit = Boolean(id);

  const [formData, setFormData] = useState<FormData>({
    type: '',
    amount: '',
    currency: 'SAR',
    transactionDate: '',
    description: '',
    status: '',
    referenceId: '',
    notes: '',
    dueDate: '',
    clientId: '',
    contractId: '',
    serviceScopeId: '',
    hardwareAssetId: ''
  });

  const [clients, setClients] = useState<Array<{ id: string; name: string }>>([]);
  const [contracts, setContracts] = useState<Array<{ id: string; name: string; clientName?: string }>>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});

  // Check permissions
  useEffect(() => {
    if (!user || !['ADMIN', 'MANAGER'].includes(user.role)) {
      navigate('/dashboard');
      return;
    }
  }, [user, navigate]);

  // Load initial data
  useEffect(() => {
    const loadInitialData = async () => {
      setLoading(true);
      try {
        const [clientsData, contractsData] = await Promise.all([
          apiService.getClientsForDropdown(),
          apiService.getContractsForDropdown()
        ]);
        setClients(clientsData);
        setContracts(contractsData);

        // If editing, load the transaction
        if (isEdit && id) {
          const response = await apiService.getFinancialTransaction(id);
          const transaction = response.data;
          setFormData({
            type: transaction.type,
            amount: transaction.amount.toString(),
            currency: transaction.currency,
            transactionDate: transaction.transactionDate ? transaction.transactionDate.split('T')[0] : '',
            description: transaction.description || '',
            status: transaction.status,
            referenceId: transaction.referenceId || '',
            notes: transaction.notes || '',
            dueDate: transaction.dueDate ? transaction.dueDate.split('T')[0] : '',
            clientId: transaction.clientId || '',
            contractId: transaction.contractId || '',
            serviceScopeId: transaction.serviceScopeId || '',
            hardwareAssetId: transaction.hardwareAssetId || ''
          });
        }
      } catch (err) {
        setError('Failed to load data');
        console.error('Error loading initial data:', err);
      } finally {
        setLoading(false);
      }
    };

    loadInitialData();
  }, [isEdit, id]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    
    // Clear validation error for this field
    if (validationErrors[name]) {
      setValidationErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const validateForm = (): boolean => {
    const errors: Record<string, string> = {};

    if (!formData.type) {
      errors.type = 'Transaction type is required';
    }

    if (!formData.amount || parseFloat(formData.amount) <= 0) {
      errors.amount = 'Amount must be greater than 0';
    }

    if (!formData.currency) {
      errors.currency = 'Currency is required';
    }

    if (!formData.status) {
      errors.status = 'Status is required';
    }

    if (!formData.description.trim()) {
      errors.description = 'Description is required';
    }

    if (!formData.transactionDate) {
      errors.transactionDate = 'Transaction date is required';
    }

    // Validate date logic
    if (formData.dueDate) {
      const dueDate = new Date(formData.dueDate);
      const today = new Date();
      if (dueDate < today) {
        errors.dueDate = 'Due date cannot be in the past';
      }
    }

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setSaving(true);
    setError(null);

    try {
      const transactionData = {
        type: formData.type as FinancialTransactionType,
        amount: parseFloat(formData.amount),
        currency: formData.currency,
        transactionDate: formData.transactionDate,
        description: formData.description.trim(),
        status: formData.status as FinancialTransactionStatus,
        referenceId: formData.referenceId || undefined,
        notes: formData.notes || undefined,
        dueDate: formData.dueDate || undefined,
        clientId: formData.clientId || undefined,
        contractId: formData.contractId || undefined,
        serviceScopeId: formData.serviceScopeId || undefined,
        hardwareAssetId: formData.hardwareAssetId || undefined
      };

      if (isEdit && id) {
        await apiService.updateFinancialTransaction(id, transactionData as UpdateFinancialTransactionDto);
      } else {
        await apiService.createFinancialTransaction(transactionData as CreateFinancialTransactionDto);
      }

      navigate('/admin/financials/transactions');
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to save transaction');
      console.error('Error saving transaction:', err);
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    navigate('/admin/financials/transactions');
  };

  if (loading) {
    return (
      <div className="financial-transaction-form-page">
        <div className="loading">Loading...</div>
      </div>
    );
  }

  return (
    <div className="financial-transaction-form-page">
      <div className="page-header">
        <h1>{isEdit ? 'Edit Financial Transaction' : 'Create Financial Transaction'}</h1>
        <div className="header-actions">
          <button type="button" onClick={handleCancel} className="btn btn-secondary">
            Cancel
          </button>
        </div>
      </div>

      {error && (
        <div className="error-message">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="transaction-form">
        <div className="form-section">
          <h3>Transaction Details</h3>
          
          <div className="form-row">
            <div className="form-group">
              <label htmlFor="type">Transaction Type *</label>
              <select
                id="type"
                name="type"
                value={formData.type}
                onChange={handleInputChange}
                className={validationErrors.type ? 'error' : ''}
                required
              >
                <option value="">Select transaction type</option>
                <optgroup label="Revenue">
                  {Object.values(FinancialTransactionType)
                    .filter(type => isRevenueType(type))
                    .map(type => (
                      <option key={type} value={type}>
                        {getTransactionTypeLabel(type)}
                      </option>
                    ))}
                </optgroup>
                <optgroup label="Costs">
                  {Object.values(FinancialTransactionType)
                    .filter(type => !isRevenueType(type))
                    .map(type => (
                      <option key={type} value={type}>
                        {getTransactionTypeLabel(type)}
                      </option>
                    ))}
                </optgroup>
              </select>
              {validationErrors.type && <span className="error-text">{validationErrors.type}</span>}
            </div>

            <div className="form-group">
              <label htmlFor="status">Status *</label>
              <select
                id="status"
                name="status"
                value={formData.status}
                onChange={handleInputChange}
                className={validationErrors.status ? 'error' : ''}
                required
              >
                <option value="">Select status</option>
                {Object.values(FinancialTransactionStatus).map(status => (
                  <option key={status} value={status}>
                    {getTransactionStatusLabel(status)}
                  </option>
                ))}
              </select>
              {validationErrors.status && <span className="error-text">{validationErrors.status}</span>}
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label htmlFor="amount">Amount *</label>
              <input
                type="number"
                id="amount"
                name="amount"
                value={formData.amount}
                onChange={handleInputChange}
                className={validationErrors.amount ? 'error' : ''}
                step="0.01"
                min="0"
                required
              />
              {validationErrors.amount && <span className="error-text">{validationErrors.amount}</span>}
            </div>

            <div className="form-group">
              <label htmlFor="currency">Currency *</label>
              <select
                id="currency"
                name="currency"
                value={formData.currency}
                onChange={handleInputChange}
                className={validationErrors.currency ? 'error' : ''}
                required
              >
                <option value="SAR">SAR</option>
                <option value="USD">USD</option>
                <option value="EUR">EUR</option>
              </select>
              {validationErrors.currency && <span className="error-text">{validationErrors.currency}</span>}
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="description">Description *</label>
            <textarea
              id="description"
              name="description"
              value={formData.description}
              onChange={handleInputChange}
              className={validationErrors.description ? 'error' : ''}
              rows={3}
              required
            />
            {validationErrors.description && <span className="error-text">{validationErrors.description}</span>}
          </div>

          <div className="form-row">
            <div className="form-group">
              <label htmlFor="referenceId">Reference ID</label>
              <input
                type="text"
                id="referenceId"
                name="referenceId"
                value={formData.referenceId}
                onChange={handleInputChange}
                placeholder="Invoice #, PO #, Receipt #, etc."
              />
              <small className="form-help">External reference like invoice or PO number</small>
            </div>

            <div className="form-group">
              <label htmlFor="transactionDate">Transaction Date *</label>
              <input
                type="date"
                id="transactionDate"
                name="transactionDate"
                value={formData.transactionDate}
                onChange={handleInputChange}
                className={validationErrors.transactionDate ? 'error' : ''}
                required
              />
              {validationErrors.transactionDate && <span className="error-text">{validationErrors.transactionDate}</span>}
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="notes">Notes</label>
            <textarea
              id="notes"
              name="notes"
              value={formData.notes}
              onChange={handleInputChange}
              rows={3}
              placeholder="Additional notes or comments..."
            />
            <small className="form-help">Optional additional information</small>
          </div>
        </div>

        <div className="form-section">
          <h3>Dates</h3>
          
          <div className="form-row">
            <div className="form-group">
              <label htmlFor="dueDate">Due Date</label>
              <input
                type="date"
                id="dueDate"
                name="dueDate"
                value={formData.dueDate}
                onChange={handleInputChange}
              />
            </div>
          </div>
        </div>

        <div className="form-section">
          <h3>Entity Associations</h3>
          
          <div className="form-row">
            <div className="form-group">
              <label htmlFor="clientId">Client</label>
              <select
                id="clientId"
                name="clientId"
                value={formData.clientId}
                onChange={handleInputChange}
              >
                <option value="">Select client (optional)</option>
                {clients.map(client => (
                  <option key={client.id} value={client.id}>
                    {client.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label htmlFor="contractId">Contract</label>
              <select
                id="contractId"
                name="contractId"
                value={formData.contractId}
                onChange={handleInputChange}
              >
                <option value="">Select contract (optional)</option>
                {contracts.map(contract => (
                  <option key={contract.id} value={contract.id}>
                    {contract.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label htmlFor="serviceScopeId">Service Scope ID</label>
              <input
                type="text"
                id="serviceScopeId"
                name="serviceScopeId"
                value={formData.serviceScopeId}
                onChange={handleInputChange}
                placeholder="Enter service scope UUID (optional)"
              />
              <small className="form-help">Enter the UUID of the service scope if applicable</small>
            </div>

            <div className="form-group">
              <label htmlFor="hardwareAssetId">Hardware Asset ID</label>
              <input
                type="text"
                id="hardwareAssetId"
                name="hardwareAssetId"
                value={formData.hardwareAssetId}
                onChange={handleInputChange}
                placeholder="Enter hardware asset UUID (optional)"
              />
              <small className="form-help">Enter the UUID of the hardware asset if applicable</small>
            </div>
          </div>
        </div>

        <div className="form-actions">
          <button type="button" onClick={handleCancel} className="btn btn-secondary">
            Cancel
          </button>
          <button type="submit" disabled={saving} className="btn btn-primary">
            {saving ? 'Saving...' : (isEdit ? 'Update Transaction' : 'Create Transaction')}
          </button>
        </div>
      </form>
    </div>
  );
};

export default FinancialTransactionFormPage; 