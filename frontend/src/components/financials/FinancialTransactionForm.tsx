import React, { useState, useEffect } from 'react';
import {
  FinancialTransaction,
  FinancialTransactionType,
  FinancialTransactionStatus,
  FinancialTransactionTypeLabels,
  FinancialTransactionStatusLabels,
  CreateFinancialTransactionDto,
  UpdateFinancialTransactionDto,
  isRevenueType,
  isCostType
} from '../../types/financial';
import { apiService } from '../../services/apiService';
import './FinancialTransactionForm.css';

interface FinancialTransactionFormProps {
  initialData?: FinancialTransaction | null;
  onSubmit: (data: CreateFinancialTransactionDto | UpdateFinancialTransactionDto) => Promise<void>;
  onCancel: () => void;
  loading?: boolean;
  error?: string | null;
  isEditMode?: boolean;
}

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

interface ValidationErrors {
  [key: string]: string;
}

/**
 * FinancialTransactionForm Component
 * Reusable form for creating and editing financial transactions
 * Includes comprehensive validation and entity linking
 */
const FinancialTransactionForm: React.FC<FinancialTransactionFormProps> = ({
  initialData,
  onSubmit,
  onCancel,
  loading = false,
  error = null,
  isEditMode = false,
}) => {
  const [formData, setFormData] = useState<FormData>({
    type: '',
    amount: '',
    currency: 'SAR',
    transactionDate: new Date().toISOString().split('T')[0],
    description: '',
    status: '',
    referenceId: '',
    notes: '',
    dueDate: '',
    clientId: '',
    contractId: '',
    serviceScopeId: '',
    hardwareAssetId: '',
  });

  const [validationErrors, setValidationErrors] = useState<ValidationErrors>({});
  const [clients, setClients] = useState<Array<{ id: string; name: string }>>([]);
  const [contracts, setContracts] = useState<Array<{ id: string; name: string; clientName?: string }>>([]);
  const [loadingOptions, setLoadingOptions] = useState(false);

  /**
   * Load form data from initial data (for edit mode)
   */
  useEffect(() => {
    if (initialData) {
      setFormData({
        type: initialData.type,
        amount: initialData.amount.toString(),
        currency: initialData.currency,
        transactionDate: initialData.transactionDate.split('T')[0],
        description: initialData.description,
        status: initialData.status,
        referenceId: initialData.referenceId || '',
        notes: initialData.notes || '',
        dueDate: initialData.dueDate ? initialData.dueDate.split('T')[0] : '',
        clientId: initialData.clientId || '',
        contractId: initialData.contractId || '',
        serviceScopeId: initialData.serviceScopeId || '',
        hardwareAssetId: initialData.hardwareAssetId || '',
      });
    }
  }, [initialData]);

  /**
   * Load dropdown options
   */
  useEffect(() => {
    const loadOptions = async () => {
      try {
        setLoadingOptions(true);
        const [clientsData, contractsData] = await Promise.all([
          apiService.getClientsForDropdown(),
          apiService.getContractsForDropdown(),
        ]);
        setClients(clientsData);
        setContracts(contractsData);
      } catch (err) {
        console.error('Failed to load dropdown options:', err);
      } finally {
        setLoadingOptions(false);
      }
    };

    loadOptions();
  }, []);

  /**
   * Handle input changes
   */
  const handleInputChange = (field: keyof FormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    
    // Clear validation error for this field
    if (validationErrors[field]) {
      setValidationErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      });
    }
  };

  /**
   * Validate form data
   */
  const validateForm = (): boolean => {
    const errors: ValidationErrors = {};

    // Required fields
    if (!formData.type) {
      errors.type = 'Transaction type is required';
    }

    if (!formData.amount || isNaN(Number(formData.amount)) || Number(formData.amount) <= 0) {
      errors.amount = 'Valid amount greater than 0 is required';
    }

    if (!formData.currency) {
      errors.currency = 'Currency is required';
    }

    if (!formData.transactionDate) {
      errors.transactionDate = 'Transaction date is required';
    }

    if (!formData.description.trim()) {
      errors.description = 'Description is required';
    }

    if (!formData.status) {
      errors.status = 'Status is required';
    }

    // Validate currency format (3 characters)
    if (formData.currency && formData.currency.length !== 3) {
      errors.currency = 'Currency must be exactly 3 characters (e.g., SAR, USD)';
    }

    // Validate description length
    if (formData.description.length > 1000) {
      errors.description = 'Description cannot exceed 1000 characters';
    }

    // Validate notes length
    if (formData.notes.length > 2000) {
      errors.notes = 'Notes cannot exceed 2000 characters';
    }

    // Validate reference ID length
    if (formData.referenceId.length > 100) {
      errors.referenceId = 'Reference ID cannot exceed 100 characters';
    }

    // Validate due date (should be in the future for pending transactions)
    if (formData.dueDate && formData.status === FinancialTransactionStatus.PENDING) {
      const dueDate = new Date(formData.dueDate);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      if (dueDate < today) {
        errors.dueDate = 'Due date should be in the future for pending transactions';
      }
    }

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  /**
   * Handle form submission
   */
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    const submitData: CreateFinancialTransactionDto | UpdateFinancialTransactionDto = {
      type: formData.type as FinancialTransactionType,
      amount: Number(formData.amount),
      currency: formData.currency,
      transactionDate: formData.transactionDate,
      description: formData.description.trim(),
      status: formData.status as FinancialTransactionStatus,
      referenceId: formData.referenceId.trim() || undefined,
      notes: formData.notes.trim() || undefined,
      dueDate: formData.dueDate || undefined,
      clientId: formData.clientId || undefined,
      contractId: formData.contractId || undefined,
      serviceScopeId: formData.serviceScopeId || undefined,
      hardwareAssetId: formData.hardwareAssetId || undefined,
    };

    await onSubmit(submitData);
  };

  /**
   * Get transaction types grouped by category
   */
  const getTransactionTypeOptions = () => {
    const revenueTypes = Object.values(FinancialTransactionType).filter(isRevenueType);
    const costTypes = Object.values(FinancialTransactionType).filter(isCostType);
    const otherTypes = [FinancialTransactionType.OTHER];

    return { revenueTypes, costTypes, otherTypes };
  };

  const { revenueTypes, costTypes, otherTypes } = getTransactionTypeOptions();

  return (
    <div className="financial-transaction-form">
      <div className="form-header">
        <h2>{isEditMode ? 'Edit Financial Transaction' : 'Record New Financial Transaction'}</h2>
      </div>

      {error && (
        <div className="error-message">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="transaction-form">
        {/* Basic Transaction Information */}
        <div className="form-section">
          <h3>Transaction Details</h3>
          
          <div className="form-row">
            <div className="form-group">
              <label htmlFor="type">Transaction Type *</label>
              <select
                id="type"
                value={formData.type}
                onChange={(e) => handleInputChange('type', e.target.value)}
                className={validationErrors.type ? 'error' : ''}
                disabled={loading}
              >
                <option value="">Select transaction type</option>
                <optgroup label="Revenue">
                  {revenueTypes.map(type => (
                    <option key={type} value={type}>
                      {FinancialTransactionTypeLabels[type]}
                    </option>
                  ))}
                </optgroup>
                <optgroup label="Costs">
                  {costTypes.map(type => (
                    <option key={type} value={type}>
                      {FinancialTransactionTypeLabels[type]}
                    </option>
                  ))}
                </optgroup>
                <optgroup label="Other">
                  {otherTypes.map(type => (
                    <option key={type} value={type}>
                      {FinancialTransactionTypeLabels[type]}
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
                value={formData.status}
                onChange={(e) => handleInputChange('status', e.target.value)}
                className={validationErrors.status ? 'error' : ''}
                disabled={loading}
              >
                <option value="">Select status</option>
                {Object.values(FinancialTransactionStatus).map(status => (
                  <option key={status} value={status}>
                    {FinancialTransactionStatusLabels[status]}
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
                step="0.01"
                min="0.01"
                value={formData.amount}
                onChange={(e) => handleInputChange('amount', e.target.value)}
                className={validationErrors.amount ? 'error' : ''}
                disabled={loading}
                placeholder="0.00"
              />
              {validationErrors.amount && <span className="error-text">{validationErrors.amount}</span>}
            </div>

            <div className="form-group">
              <label htmlFor="currency">Currency *</label>
              <input
                type="text"
                id="currency"
                value={formData.currency}
                onChange={(e) => handleInputChange('currency', e.target.value.toUpperCase())}
                className={validationErrors.currency ? 'error' : ''}
                disabled={loading}
                placeholder="SAR"
                maxLength={3}
              />
              {validationErrors.currency && <span className="error-text">{validationErrors.currency}</span>}
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label htmlFor="transactionDate">Transaction Date *</label>
              <input
                type="date"
                id="transactionDate"
                value={formData.transactionDate}
                onChange={(e) => handleInputChange('transactionDate', e.target.value)}
                className={validationErrors.transactionDate ? 'error' : ''}
                disabled={loading}
              />
              {validationErrors.transactionDate && <span className="error-text">{validationErrors.transactionDate}</span>}
            </div>

            <div className="form-group">
              <label htmlFor="dueDate">Due Date</label>
              <input
                type="date"
                id="dueDate"
                value={formData.dueDate}
                onChange={(e) => handleInputChange('dueDate', e.target.value)}
                className={validationErrors.dueDate ? 'error' : ''}
                disabled={loading}
              />
              {validationErrors.dueDate && <span className="error-text">{validationErrors.dueDate}</span>}
              <small className="field-hint">Optional: For pending transactions</small>
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="description">Description *</label>
            <textarea
              id="description"
              value={formData.description}
              onChange={(e) => handleInputChange('description', e.target.value)}
              className={validationErrors.description ? 'error' : ''}
              disabled={loading}
              placeholder="Describe the transaction..."
              rows={3}
              maxLength={1000}
            />
            {validationErrors.description && <span className="error-text">{validationErrors.description}</span>}
            <small className="field-hint">{formData.description.length}/1000 characters</small>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label htmlFor="referenceId">Reference ID</label>
              <input
                type="text"
                id="referenceId"
                value={formData.referenceId}
                onChange={(e) => handleInputChange('referenceId', e.target.value)}
                className={validationErrors.referenceId ? 'error' : ''}
                disabled={loading}
                placeholder="Invoice #, PO #, Receipt #, etc."
                maxLength={100}
              />
              {validationErrors.referenceId && <span className="error-text">{validationErrors.referenceId}</span>}
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="notes">Notes</label>
            <textarea
              id="notes"
              value={formData.notes}
              onChange={(e) => handleInputChange('notes', e.target.value)}
              className={validationErrors.notes ? 'error' : ''}
              disabled={loading}
              placeholder="Additional notes or comments..."
              rows={3}
              maxLength={2000}
            />
            {validationErrors.notes && <span className="error-text">{validationErrors.notes}</span>}
            <small className="field-hint">{formData.notes.length}/2000 characters</small>
          </div>
        </div>

        {/* Entity Linking Section */}
        <div className="form-section">
          <h3>Link to Entities (Optional)</h3>
          <p className="section-description">
            Link this transaction to related clients, contracts, or other entities for better tracking and reporting.
          </p>

          <div className="form-row">
            <div className="form-group">
              <label htmlFor="clientId">Client</label>
              <select
                id="clientId"
                value={formData.clientId}
                onChange={(e) => handleInputChange('clientId', e.target.value)}
                disabled={loading || loadingOptions}
              >
                <option value="">Select a client</option>
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
                value={formData.contractId}
                onChange={(e) => handleInputChange('contractId', e.target.value)}
                disabled={loading || loadingOptions}
              >
                <option value="">Select a contract</option>
                {contracts.map(contract => (
                  <option key={contract.id} value={contract.id}>
                    {contract.name} {contract.clientName && `(${contract.clientName})`}
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
                value={formData.serviceScopeId}
                onChange={(e) => handleInputChange('serviceScopeId', e.target.value)}
                disabled={loading}
                placeholder="Enter service scope UUID"
              />
              <small className="field-hint">For advanced users: Enter service scope UUID directly</small>
            </div>

            <div className="form-group">
              <label htmlFor="hardwareAssetId">Hardware Asset ID</label>
              <input
                type="text"
                id="hardwareAssetId"
                value={formData.hardwareAssetId}
                onChange={(e) => handleInputChange('hardwareAssetId', e.target.value)}
                disabled={loading}
                placeholder="Enter hardware asset UUID"
              />
              <small className="field-hint">For advanced users: Enter hardware asset UUID directly</small>
            </div>
          </div>
        </div>

        {/* Form Actions */}
        <div className="form-actions">
          <button
            type="button"
            onClick={onCancel}
            className="btn btn-secondary"
            disabled={loading}
          >
            Cancel
          </button>
          <button
            type="submit"
            className="btn btn-primary"
            disabled={loading}
          >
            {loading ? 'Saving...' : (isEditMode ? 'Update Transaction' : 'Record Transaction')}
          </button>
        </div>
      </form>
    </div>
  );
};

export default FinancialTransactionForm; 