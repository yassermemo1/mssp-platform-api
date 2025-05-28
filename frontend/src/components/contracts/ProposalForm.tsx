import React, { useState, useEffect } from 'react';
import { 
  Proposal, 
  CreateProposalDto, 
  UpdateProposalDto,
  ProposalFormData
} from '../../types/service-scope';
import { ProposalType, ProposalStatus } from '../../types/contract';
import { apiService } from '../../services/apiService';
import { useAuth } from '../../contexts/AuthContext';
import { UserRole } from '../../types/auth';
import './ProposalForm.css';

interface ProposalFormProps {
  serviceScopeId: string;
  proposal?: Proposal | null;
  onSubmit: (data: CreateProposalDto | UpdateProposalDto, file?: File) => Promise<void>;
  onCancel: () => void;
  isLoading?: boolean;
}

const ProposalForm: React.FC<ProposalFormProps> = ({
  serviceScopeId,
  proposal,
  onSubmit,
  onCancel,
  isLoading = false
}) => {
  const { user } = useAuth();
  const [formData, setFormData] = useState<ProposalFormData>({
    proposalType: proposal?.proposalType || ProposalType.TECHNICAL,
    title: proposal?.title || '',
    description: proposal?.description || '',
    proposalValue: proposal?.proposalValue || null,
    currency: proposal?.currency || 'SAR',
    validUntilDate: proposal?.validUntilDate ? proposal.validUntilDate.split('T')[0] : '',
    estimatedDurationDays: proposal?.estimatedDurationDays || null,
    version: proposal?.version || '1.0',
    status: proposal?.status || ProposalStatus.DRAFT,
    assigneeUserId: proposal?.assigneeUserId || null,
    notes: proposal?.notes || '',
    documentFile: undefined
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [documentFileName, setDocumentFileName] = useState<string>('');
  const [users, setUsers] = useState<Array<{
    id: string;
    email: string;
    firstName?: string;
    lastName?: string;
    fullName?: string;
    role: string;
  }>>([]);
  const [loadingUsers, setLoadingUsers] = useState<boolean>(false);

  const isEditMode = !!proposal;

  // Fetch users for assignee selection
  useEffect(() => {
    const fetchUsers = async () => {
      try {
        setLoadingUsers(true);
        const response = await apiService.getUsers();
        // Filter to relevant roles for proposal assignment
        const relevantUsers = response.users.filter(u => 
          [UserRole.ADMIN, UserRole.MANAGER, UserRole.ACCOUNT_MANAGER].includes(u.role as UserRole)
        );
        setUsers(relevantUsers);
      } catch (error) {
        console.error('Failed to fetch users:', error);
      } finally {
        setLoadingUsers(false);
      }
    };

    fetchUsers();
  }, []);

  useEffect(() => {
    if (proposal?.documentLink) {
      // Extract filename from document link
      const filename = proposal.documentLink.split('/').pop() || 'Current Document';
      setDocumentFileName(filename);
    }
  }, [proposal]);

  const proposalTypeOptions = [
    { value: ProposalType.TECHNICAL, label: 'Technical Proposal' },
    { value: ProposalType.FINANCIAL, label: 'Financial Proposal' },
    { value: ProposalType.TECHNICAL_FINANCIAL, label: 'Technical & Financial' },
    { value: ProposalType.ARCHITECTURE, label: 'Architecture Proposal' },
    { value: ProposalType.IMPLEMENTATION, label: 'Implementation Proposal' },
    { value: ProposalType.PRICING, label: 'Pricing Proposal' },
    { value: ProposalType.SCOPE_CHANGE, label: 'Scope Change Proposal' },
    { value: ProposalType.OTHER, label: 'Other' }
  ];

  const proposalStatusOptions = [
    { value: ProposalStatus.DRAFT, label: 'Draft' },
    { value: ProposalStatus.IN_PREPARATION, label: 'In Preparation' },
    { value: ProposalStatus.SUBMITTED, label: 'Submitted' },
    { value: ProposalStatus.UNDER_REVIEW, label: 'Under Review' },
    { value: ProposalStatus.PENDING_APPROVAL, label: 'Pending Approval' },
    { value: ProposalStatus.PENDING_CLIENT_REVIEW, label: 'Pending Client Review' },
    { value: ProposalStatus.REQUIRES_REVISION, label: 'Requires Revision' },
    { value: ProposalStatus.APPROVED, label: 'Approved' },
    { value: ProposalStatus.REJECTED, label: 'Rejected' },
    { value: ProposalStatus.WITHDRAWN, label: 'Withdrawn' },
    { value: ProposalStatus.ARCHIVED, label: 'Archived' },
    { value: ProposalStatus.ACCEPTED_BY_CLIENT, label: 'Accepted by Client' },
    { value: ProposalStatus.IN_IMPLEMENTATION, label: 'In Implementation' },
    { value: ProposalStatus.COMPLETED, label: 'Completed' }
  ];

  const currencyOptions = [
    { value: 'SAR', label: 'SAR - Saudi Riyal' },
    { value: 'USD', label: 'USD - US Dollar' },
    { value: 'EUR', label: 'EUR - Euro' },
    { value: 'GBP', label: 'GBP - British Pound' },
    { value: 'AED', label: 'AED - UAE Dirham' }
  ];

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.proposalType) {
      newErrors.proposalType = 'Proposal type is required';
    }

    if (!formData.title.trim()) {
      newErrors.title = 'Title is required';
    }

    if (!formData.description.trim()) {
      newErrors.description = 'Description is required';
    }

    if (!formData.version.trim()) {
      newErrors.version = 'Version is required';
    }

    if (formData.proposalValue !== null && formData.proposalValue < 0) {
      newErrors.proposalValue = 'Proposal value must be non-negative';
    }

    if (formData.estimatedDurationDays !== null && formData.estimatedDurationDays < 1) {
      newErrors.estimatedDurationDays = 'Duration must be at least 1 day';
    }

    // Validate currency format
    if (formData.currency && !/^[A-Z]{3}$/.test(formData.currency)) {
      newErrors.currency = 'Currency must be a 3-letter code (e.g., SAR, USD)';
    }

    // Validate valid until date is in the future
    if (formData.validUntilDate) {
      const validDate = new Date(formData.validUntilDate);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      if (validDate <= today) {
        newErrors.validUntilDate = 'Valid until date must be in the future';
      }
    }

    // Document file validation for new proposals
    if (!isEditMode && !formData.documentFile) {
      newErrors.documentFile = 'Document file is required for new proposals';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleInputChange = (field: keyof ProposalFormData, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    
    // Clear error for this field
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Validate file type
      const allowedTypes = [
        'application/pdf',
        'application/msword',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'application/vnd.ms-excel',
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'text/plain'
      ];

      if (!allowedTypes.includes(file.type)) {
        setErrors(prev => ({ 
          ...prev, 
          documentFile: 'Please select a valid document file (PDF, DOC, DOCX, XLS, XLSX, TXT)' 
        }));
        return;
      }

      // Validate file size (10MB limit)
      if (file.size > 10 * 1024 * 1024) {
        setErrors(prev => ({ 
          ...prev, 
          documentFile: 'File size must be less than 10MB' 
        }));
        return;
      }

      setFormData(prev => ({ ...prev, documentFile: file }));
      setDocumentFileName(file.name);
      
      // Clear error
      if (errors.documentFile) {
        setErrors(prev => ({ ...prev, documentFile: '' }));
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    const submitData: CreateProposalDto | UpdateProposalDto = {
      serviceScopeId: serviceScopeId,
      proposalType: formData.proposalType,
      documentLink: proposal?.documentLink || '', // Will be updated after file upload
      version: formData.version,
      status: formData.status,
      title: formData.title,
      description: formData.description,
      proposalValue: formData.proposalValue || undefined,
      currency: formData.currency || undefined,
      validUntilDate: formData.validUntilDate || undefined,
      estimatedDurationDays: formData.estimatedDurationDays || undefined,
      assigneeUserId: formData.assigneeUserId || undefined,
      notes: formData.notes || undefined
    };

    await onSubmit(submitData, formData.documentFile);
  };

  const formatCurrency = (amount: number | null) => {
    if (!amount) return '';
    return amount.toString();
  };

  return (
    <div className="proposal-form">
      <div className="form-header">
        <h3>{isEditMode ? 'Edit Proposal' : 'Create New Proposal'}</h3>
        <p>Configure the proposal details and upload the proposal document.</p>
      </div>

      <form onSubmit={handleSubmit} className="proposal-form-content">
        {/* Basic Information */}
        <div className="form-section">
          <h4>Basic Information</h4>
          <div className="form-row">
            <div className="form-group">
              <label htmlFor="proposalType" className="form-label">
                Proposal Type <span className="required">*</span>
              </label>
              <select
                id="proposalType"
                value={formData.proposalType}
                onChange={(e) => handleInputChange('proposalType', e.target.value as ProposalType)}
                disabled={isLoading}
                className={`form-input ${errors.proposalType ? 'error' : ''}`}
              >
                {proposalTypeOptions.map(option => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
              {errors.proposalType && <div className="error-message">{errors.proposalType}</div>}
            </div>

            <div className="form-group">
              <label htmlFor="version" className="form-label">
                Version <span className="required">*</span>
              </label>
              <input
                type="text"
                id="version"
                value={formData.version}
                onChange={(e) => handleInputChange('version', e.target.value)}
                disabled={isLoading}
                className={`form-input ${errors.version ? 'error' : ''}`}
                placeholder="e.g., 1.0, 2.1, Final"
              />
              {errors.version && <div className="error-message">{errors.version}</div>}
            </div>

            <div className="form-group">
              <label htmlFor="status" className="form-label">Status</label>
              <select
                id="status"
                value={formData.status}
                onChange={(e) => handleInputChange('status', e.target.value as ProposalStatus)}
                disabled={isLoading}
                className="form-input"
              >
                {proposalStatusOptions.map(option => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Proposal Details */}
        <div className="form-section">
          <h4>Proposal Details</h4>
          <div className="form-group">
            <label htmlFor="title" className="form-label">
              Title <span className="required">*</span>
            </label>
            <input
              type="text"
              id="title"
              value={formData.title}
              onChange={(e) => handleInputChange('title', e.target.value)}
              disabled={isLoading}
              className={`form-input ${errors.title ? 'error' : ''}`}
              placeholder="Enter proposal title"
            />
            {errors.title && <div className="error-message">{errors.title}</div>}
          </div>

          <div className="form-group">
            <label htmlFor="description" className="form-label">
              Description <span className="required">*</span>
            </label>
            <textarea
              id="description"
              value={formData.description}
              onChange={(e) => handleInputChange('description', e.target.value)}
              disabled={isLoading}
              className={`form-input ${errors.description ? 'error' : ''}`}
              rows={4}
              placeholder="Provide a detailed description of the proposal..."
            />
            {errors.description && <div className="error-message">{errors.description}</div>}
          </div>
        </div>

        {/* Financial Information */}
        <div className="form-section">
          <h4>Financial & Timeline Information</h4>
          <div className="form-row">
            <div className="form-group">
              <label htmlFor="proposalValue" className="form-label">Proposal Value</label>
              <input
                type="number"
                id="proposalValue"
                value={formatCurrency(formData.proposalValue)}
                onChange={(e) => handleInputChange('proposalValue', e.target.value ? Number(e.target.value) : null)}
                disabled={isLoading}
                className={`form-input ${errors.proposalValue ? 'error' : ''}`}
                placeholder="0.00"
                min="0"
                step="0.01"
              />
              {errors.proposalValue && <div className="error-message">{errors.proposalValue}</div>}
            </div>

            <div className="form-group">
              <label htmlFor="currency" className="form-label">Currency</label>
              <select
                id="currency"
                value={formData.currency}
                onChange={(e) => handleInputChange('currency', e.target.value)}
                disabled={isLoading}
                className={`form-input ${errors.currency ? 'error' : ''}`}
              >
                {currencyOptions.map(option => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
              {errors.currency && <div className="error-message">{errors.currency}</div>}
            </div>

            <div className="form-group">
              <label htmlFor="validUntilDate" className="form-label">Valid Until Date</label>
              <input
                type="date"
                id="validUntilDate"
                value={formData.validUntilDate}
                onChange={(e) => handleInputChange('validUntilDate', e.target.value)}
                disabled={isLoading}
                className={`form-input ${errors.validUntilDate ? 'error' : ''}`}
                min={new Date().toISOString().split('T')[0]}
              />
              {errors.validUntilDate && <div className="error-message">{errors.validUntilDate}</div>}
              <p className="field-help-text">Date until which the proposal terms remain valid</p>
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label htmlFor="estimatedDurationDays" className="form-label">Estimated Duration (Days)</label>
              <input
                type="number"
                id="estimatedDurationDays"
                value={formData.estimatedDurationDays || ''}
                onChange={(e) => handleInputChange('estimatedDurationDays', e.target.value ? Number(e.target.value) : null)}
                disabled={isLoading}
                className={`form-input ${errors.estimatedDurationDays ? 'error' : ''}`}
                placeholder="30"
                min="1"
              />
              {errors.estimatedDurationDays && <div className="error-message">{errors.estimatedDurationDays}</div>}
            </div>

            <div className="form-group">
              <label htmlFor="assigneeUserId" className="form-label">Assignee</label>
              <select
                id="assigneeUserId"
                value={formData.assigneeUserId || ''}
                onChange={(e) => handleInputChange('assigneeUserId', e.target.value || null)}
                disabled={isLoading || loadingUsers}
                className={`form-input ${errors.assigneeUserId ? 'error' : ''}`}
              >
                <option value="">Select assignee (optional)</option>
                {users.map(user => (
                  <option key={user.id} value={user.id}>
                    {user.firstName && user.lastName 
                      ? `${user.firstName} ${user.lastName} (${user.email})` 
                      : user.email
                    } - {user.role}
                  </option>
                ))}
              </select>
              {errors.assigneeUserId && <div className="error-message">{errors.assigneeUserId}</div>}
              {loadingUsers && <p className="field-help-text">Loading users...</p>}
              <p className="field-help-text">Sales/account person responsible for this proposal</p>
            </div>
          </div>
        </div>

        {/* Document Upload */}
        <div className="form-section">
          <h4>Document Upload</h4>
          <div className="form-group">
            <label htmlFor="documentFile" className="form-label">
              Proposal Document {!isEditMode && <span className="required">*</span>}
            </label>
            <div className="file-upload-wrapper">
              <input
                type="file"
                id="documentFile"
                onChange={handleFileChange}
                disabled={isLoading}
                className="file-input"
                accept=".pdf,.doc,.docx,.xls,.xlsx,.txt"
              />
              <label htmlFor="documentFile" className="file-upload-label">
                <span className="file-upload-icon">📄</span>
                <span className="file-upload-text">
                  {documentFileName || 'Choose file or drag and drop'}
                </span>
              </label>
            </div>
            {errors.documentFile && <div className="error-message">{errors.documentFile}</div>}
            <p className="file-help-text">
              Supported formats: PDF, DOC, DOCX, XLS, XLSX, TXT (Max 10MB)
            </p>
          </div>
        </div>

        {/* Notes */}
        <div className="form-section">
          <div className="form-group">
            <label htmlFor="notes" className="form-label">Notes</label>
            <textarea
              id="notes"
              value={formData.notes}
              onChange={(e) => handleInputChange('notes', e.target.value)}
              disabled={isLoading}
              className="form-input"
              rows={3}
              placeholder="Additional notes or comments..."
            />
          </div>
        </div>

        {/* Form Actions */}
        <div className="form-actions">
          <button
            type="button"
            onClick={onCancel}
            disabled={isLoading}
            className="btn btn-secondary"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={isLoading || Object.keys(errors).length > 0}
            className="btn btn-primary"
          >
            {isLoading ? 'Saving...' : (isEditMode ? 'Update Proposal' : 'Create Proposal')}
          </button>
        </div>
      </form>
    </div>
  );
};

export default ProposalForm; 