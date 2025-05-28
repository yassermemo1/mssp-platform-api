import React, { useState, useEffect } from 'react';
import { apiService } from '../../services/apiService';
import { 
  Contract, 
  CreateContractDto, 
  UpdateContractDto, 
  ContractStatus
} from '../../types/contract';
import { Client } from '../../types/client';
import { CustomFieldEntityType } from '../../types/customFields';
import CustomFieldsForm from '../common/CustomFieldsForm';
import './ContractForm.css';

interface ContractFormProps {
  contract?: Contract;
  onSubmit: (data: CreateContractDto | UpdateContractDto) => Promise<void>;
  onCancel: () => void;
  isLoading?: boolean;
  isEdit?: boolean;
}

const ContractForm: React.FC<ContractFormProps> = ({
  contract,
  onSubmit,
  onCancel,
  isLoading = false,
  isEdit = false,
}) => {
  const [formData, setFormData] = useState<CreateContractDto | UpdateContractDto>({
    contractName: '',
    clientId: '',
    startDate: '',
    endDate: '',
    renewalDate: '',
    value: undefined,
    status: ContractStatus.DRAFT,
    notes: '',
    previousContractId: '',
  });

  // Custom fields state
  const [customFieldValues, setCustomFieldValues] = useState<Record<string, any>>({});
  const [customFieldsValid, setCustomFieldsValid] = useState<boolean>(true);
  const [customFieldErrors, setCustomFieldErrors] = useState<Record<string, string>>({});

  const [clients, setClients] = useState<Client[]>([]);
  const [contracts, setContracts] = useState<Contract[]>([]);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploadingFile, setUploadingFile] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [currentDocumentLink, setCurrentDocumentLink] = useState<string | null>(null);

  useEffect(() => {
    fetchClients();
    fetchContracts();
    
    if (contract) {
      setFormData({
        contractName: contract.contractName,
        clientId: contract.clientId,
        startDate: contract.startDate,
        endDate: contract.endDate,
        renewalDate: contract.renewalDate || '',
        value: contract.value || undefined,
        status: contract.status,
        notes: contract.notes || '',
        previousContractId: contract.previousContractId || '',
      });
      setCurrentDocumentLink(contract.documentLink || null);
      
      // Initialize custom field values
      if (contract.customFieldData) {
        setCustomFieldValues(contract.customFieldData);
      }
    }
  }, [contract]);

  const fetchClients = async () => {
    try {
      const response = await apiService.getClients();
      setClients(response.data);
    } catch (error) {
      console.error('Failed to fetch clients:', error);
    }
  };

  const fetchContracts = async () => {
    try {
      const response = await apiService.getContracts();
      setContracts(response.data);
    } catch (error) {
      console.error('Failed to fetch contracts:', error);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value === '' ? undefined : value,
    }));
    
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  /**
   * Handle custom field values change
   */
  const handleCustomFieldsChange = (values: Record<string, any>) => {
    setCustomFieldValues(values);
  };

  /**
   * Handle custom field validation change
   */
  const handleCustomFieldsValidationChange = (isValid: boolean, errors: Record<string, string>) => {
    setCustomFieldsValid(isValid);
    setCustomFieldErrors(errors);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Validate file type
      const allowedTypes = [
        'application/pdf',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'application/msword',
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'application/vnd.ms-excel',
        'text/plain',
      ];
      
      if (!allowedTypes.includes(file.type)) {
        setErrors(prev => ({
          ...prev,
          file: 'Invalid file type. Only PDF, DOC, DOCX, XLS, XLSX, and TXT files are allowed.',
        }));
        return;
      }
      
      // Validate file size (10MB limit)
      if (file.size > 10 * 1024 * 1024) {
        setErrors(prev => ({
          ...prev,
          file: 'File size must be less than 10MB.',
        }));
        return;
      }
      
      setSelectedFile(file);
      setErrors(prev => ({ ...prev, file: '' }));
    }
  };

  const uploadFile = async (): Promise<string | null> => {
    if (!selectedFile) return null;
    
    try {
      setUploadingFile(true);
      const response = await apiService.uploadFile('contracts', selectedFile);
      return response.file.url;
    } catch (error: any) {
      setErrors(prev => ({
        ...prev,
        file: error.message || 'Failed to upload file',
      }));
      return null;
    } finally {
      setUploadingFile(false);
    }
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};
    
    if (!formData.contractName?.trim()) {
      newErrors.contractName = 'Contract name is required';
    }
    
    if (!formData.clientId) {
      newErrors.clientId = 'Client is required';
    }
    
    if (!formData.startDate) {
      newErrors.startDate = 'Start date is required';
    }
    
    if (!formData.endDate) {
      newErrors.endDate = 'End date is required';
    }
    
    if (formData.startDate && formData.endDate) {
      const startDate = new Date(formData.startDate);
      const endDate = new Date(formData.endDate);
      
      if (endDate <= startDate) {
        newErrors.endDate = 'End date must be after start date';
      }
    }
    
    if (formData.value !== undefined && formData.value < 0) {
      newErrors.value = 'Contract value cannot be negative';
    }
    
    setErrors(newErrors);
    
    // Return true only if both standard fields and custom fields are valid
    return Object.keys(newErrors).length === 0 && customFieldsValid;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }
    
    try {
      let documentLink = currentDocumentLink;
      
      // Upload file if selected
      if (selectedFile) {
        documentLink = await uploadFile();
        if (!documentLink) {
          return; // Upload failed, error already set
        }
      }
      
      const submitData = {
        ...formData,
        documentLink: documentLink || undefined,
        value: formData.value ? Number(formData.value) : undefined,
        renewalDate: formData.renewalDate || undefined,
        previousContractId: formData.previousContractId || undefined,
      };

      // Add custom field data if any values exist
      if (Object.keys(customFieldValues).length > 0) {
        submitData.customFieldData = customFieldValues;
      }
      
      // Remove empty strings
      Object.keys(submitData).forEach(key => {
        if (submitData[key as keyof typeof submitData] === '') {
          delete submitData[key as keyof typeof submitData];
        }
      });
      
      await onSubmit(submitData);
    } catch (error: any) {
      setErrors(prev => ({
        ...prev,
        submit: error.message || 'Failed to save contract',
      }));
    }
  };

  return (
    <div className="contract-form">
      <form onSubmit={handleSubmit}>
        <div className="form-grid">
          <div className="form-group">
            <label htmlFor="contractName">Contract Name *</label>
            <input
              type="text"
              id="contractName"
              name="contractName"
              value={formData.contractName || ''}
              onChange={handleInputChange}
              className={errors.contractName ? 'error' : ''}
              placeholder="e.g., MSA - Acme Corp - 2025"
            />
            {errors.contractName && <span className="error-text">{errors.contractName}</span>}
          </div>

          <div className="form-group">
            <label htmlFor="clientId">Client *</label>
            <select
              id="clientId"
              name="clientId"
              value={formData.clientId || ''}
              onChange={handleInputChange}
              className={errors.clientId ? 'error' : ''}
            >
              <option value="">Select a client</option>
              {clients.map(client => (
                <option key={client.id} value={client.id}>
                  {client.companyName}
                </option>
              ))}
            </select>
            {errors.clientId && <span className="error-text">{errors.clientId}</span>}
          </div>

          <div className="form-group">
            <label htmlFor="startDate">Start Date *</label>
            <input
              type="date"
              id="startDate"
              name="startDate"
              value={formData.startDate || ''}
              onChange={handleInputChange}
              className={errors.startDate ? 'error' : ''}
            />
            {errors.startDate && <span className="error-text">{errors.startDate}</span>}
          </div>

          <div className="form-group">
            <label htmlFor="endDate">End Date *</label>
            <input
              type="date"
              id="endDate"
              name="endDate"
              value={formData.endDate || ''}
              onChange={handleInputChange}
              className={errors.endDate ? 'error' : ''}
            />
            {errors.endDate && <span className="error-text">{errors.endDate}</span>}
          </div>

          <div className="form-group">
            <label htmlFor="renewalDate">Renewal Date</label>
            <input
              type="date"
              id="renewalDate"
              name="renewalDate"
              value={formData.renewalDate || ''}
              onChange={handleInputChange}
            />
          </div>

          <div className="form-group">
            <label htmlFor="value">Contract Value ($)</label>
            <input
              type="number"
              id="value"
              name="value"
              value={formData.value || ''}
              onChange={handleInputChange}
              className={errors.value ? 'error' : ''}
              placeholder="0.00"
              step="0.01"
              min="0"
            />
            {errors.value && <span className="error-text">{errors.value}</span>}
          </div>

          <div className="form-group">
            <label htmlFor="status">Status</label>
            <select
              id="status"
              name="status"
              value={formData.status || ContractStatus.DRAFT}
              onChange={handleInputChange}
            >
              {Object.values(ContractStatus).map(status => (
                <option key={status} value={status}>
                  {status.replace('_', ' ').toUpperCase()}
                </option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label htmlFor="previousContractId">Previous Contract (for renewals)</label>
            <select
              id="previousContractId"
              name="previousContractId"
              value={formData.previousContractId || ''}
              onChange={handleInputChange}
            >
              <option value="">No previous contract</option>
              {contracts
                .filter(c => !contract || c.id !== contract.id) // Don't show current contract
                .map(c => (
                  <option key={c.id} value={c.id}>
                    {c.contractName}
                  </option>
                ))}
            </select>
          </div>
        </div>

        <div className="form-group full-width">
          <label htmlFor="notes">Notes</label>
          <textarea
            id="notes"
            name="notes"
            value={formData.notes || ''}
            onChange={handleInputChange}
            rows={4}
            placeholder="Additional notes or terms..."
          />
        </div>

        <div className="form-group full-width">
          <label htmlFor="document">Contract Document</label>
          <div className="file-upload-section">
            {currentDocumentLink && (
              <div className="current-file">
                <span>Current file: </span>
                <a 
                  href={`${apiService.getBaseURL()}${currentDocumentLink}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="file-link"
                >
                  View Document
                </a>
              </div>
            )}
            
            <input
              type="file"
              id="document"
              onChange={handleFileChange}
              accept=".pdf,.doc,.docx,.xls,.xlsx,.txt"
              className={errors.file ? 'error' : ''}
            />
            
            {selectedFile && (
              <div className="selected-file">
                Selected: {selectedFile.name} ({(selectedFile.size / 1024 / 1024).toFixed(2)} MB)
              </div>
            )}
            
            <div className="file-help">
              Supported formats: PDF, DOC, DOCX, XLS, XLSX, TXT (max 10MB)
            </div>
          </div>
          {errors.file && <span className="error-text">{errors.file}</span>}
        </div>

        {/* Dynamic Custom Fields Section */}
        <CustomFieldsForm
          entityType={CustomFieldEntityType.CONTRACT}
          initialValues={customFieldValues}
          onValuesChange={handleCustomFieldsChange}
          onValidationChange={handleCustomFieldsValidationChange}
          disabled={isLoading || uploadingFile}
        />

        {/* Display custom field validation errors */}
        {Object.keys(customFieldErrors).length > 0 && (
          <div className="custom-fields-errors">
            <h4>Please fix the following custom field errors:</h4>
            <ul>
              {Object.entries(customFieldErrors).map(([field, error]) => (
                <li key={field} className="custom-field-error-item">
                  {error}
                </li>
              ))}
            </ul>
          </div>
        )}

        {errors.submit && (
          <div className="error-message">
            {errors.submit}
          </div>
        )}

        <div className="form-actions">
          <button
            type="button"
            onClick={onCancel}
            className="btn btn-secondary"
            disabled={isLoading || uploadingFile}
          >
            Cancel
          </button>
          <button
            type="submit"
            className="btn btn-primary"
            disabled={isLoading || uploadingFile || !customFieldsValid}
          >
            {isLoading || uploadingFile ? (
              uploadingFile ? 'Uploading...' : 'Saving...'
            ) : (
              isEdit ? 'Update Contract' : 'Create Contract'
            )}
          </button>
        </div>
      </form>
    </div>
  );
};

export default ContractForm;