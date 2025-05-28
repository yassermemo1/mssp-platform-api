import React, { useState, useEffect, useCallback } from 'react';
import { 
  CreateServiceScopeDto, 
  UpdateServiceScopeDto,
  CreateProposalDto,
  UpdateProposalDto,
  ServiceScopeManagerState,
  ProposalManagerState
} from '../../types/service-scope';
import { SAFStatus, ProposalStatus } from '../../types/contract';
import { UserRole } from '../../types/auth';
import { apiService } from '../../services/apiService';
import { useAuth } from '../../contexts/AuthContext';
import ServiceScopeForm from './ServiceScopeForm';
import ProposalForm from './ProposalForm';
import './ServiceScopeManager.css';

interface ServiceScopeManagerProps {
  contractId: string;
}

const ServiceScopeManager: React.FC<ServiceScopeManagerProps> = ({ contractId }) => {
  const { user } = useAuth();
  const [serviceScopeState, setServiceScopeState] = useState<ServiceScopeManagerState>({
    serviceScopes: [],
    selectedServiceScope: null,
    isLoading: false,
    error: null,
    showCreateForm: false,
    showEditForm: false
  });

  const [proposalState, setProposalState] = useState<ProposalManagerState>({
    proposals: [],
    selectedProposal: null,
    isLoading: false,
    error: null,
    showCreateForm: false,
    showEditForm: false
  });

  const [activeServiceScopeId, setActiveServiceScopeId] = useState<string | null>(null);
  const [expandedServiceScopes, setExpandedServiceScopes] = useState<Set<string>>(new Set());

  /**
   * Check if user can create/edit proposals
   */
  const canManageProposals = (): boolean => {
    if (!user) return false;
    return [UserRole.ADMIN, UserRole.MANAGER, UserRole.ACCOUNT_MANAGER].includes(user.role);
  };

  /**
   * Check if user can delete proposals
   */
  const canDeleteProposals = (): boolean => {
    if (!user) return false;
    return [UserRole.ADMIN, UserRole.MANAGER].includes(user.role);
  };

  const fetchServiceScopes = useCallback(async () => {
    try {
      setServiceScopeState(prev => ({ ...prev, isLoading: true, error: null }));
      const response = await apiService.getServiceScopes(contractId);
      setServiceScopeState(prev => ({ 
        ...prev, 
        serviceScopes: response.data, 
        isLoading: false 
      }));
    } catch (error: any) {
      setServiceScopeState(prev => ({ 
        ...prev, 
        error: error.message || 'Failed to fetch service scopes', 
        isLoading: false 
      }));
    }
  }, [contractId]);

  useEffect(() => {
    fetchServiceScopes();
  }, [fetchServiceScopes]);

  const fetchProposals = async (serviceScopeId: string) => {
    try {
      setProposalState(prev => ({ ...prev, isLoading: true, error: null }));
      const response = await apiService.getProposals(serviceScopeId);
      setProposalState(prev => ({ 
        ...prev, 
        proposals: response.data, 
        isLoading: false 
      }));
    } catch (error: any) {
      setProposalState(prev => ({ 
        ...prev, 
        error: error.message || 'Failed to fetch proposals', 
        isLoading: false 
      }));
    }
  };

  const handleCreateServiceScope = async (data: CreateServiceScopeDto) => {
    try {
      setServiceScopeState(prev => ({ ...prev, isLoading: true }));
      await apiService.createServiceScope(contractId, data);
      await fetchServiceScopes();
      setServiceScopeState(prev => ({ ...prev, showCreateForm: false, isLoading: false }));
    } catch (error: any) {
      setServiceScopeState(prev => ({ 
        ...prev, 
        error: error.message || 'Failed to create service scope', 
        isLoading: false 
      }));
    }
  };

  const handleUpdateServiceScope = async (data: UpdateServiceScopeDto) => {
    if (!serviceScopeState.selectedServiceScope) return;
    
    try {
      setServiceScopeState(prev => ({ ...prev, isLoading: true }));
      await apiService.updateServiceScope(serviceScopeState.selectedServiceScope.id, data);
      await fetchServiceScopes();
      setServiceScopeState(prev => ({ 
        ...prev, 
        showEditForm: false, 
        selectedServiceScope: null, 
        isLoading: false 
      }));
    } catch (error: any) {
      setServiceScopeState(prev => ({ 
        ...prev, 
        error: error.message || 'Failed to update service scope', 
        isLoading: false 
      }));
    }
  };

  const handleDeleteServiceScope = async (serviceScopeId: string) => {
    const confirmDelete = window.confirm('Are you sure you want to delete this service scope? This action cannot be undone.');
    
    if (confirmDelete) {
      try {
        setServiceScopeState(prev => ({ ...prev, isLoading: true }));
        await apiService.deleteServiceScope(serviceScopeId);
        await fetchServiceScopes();
        setServiceScopeState(prev => ({ ...prev, isLoading: false }));
      } catch (error: any) {
        setServiceScopeState(prev => ({ 
          ...prev, 
          error: error.message || 'Failed to delete service scope', 
          isLoading: false 
        }));
      }
    }
  };

  const handleCreateProposal = async (data: CreateProposalDto, file?: File) => {
    if (!activeServiceScopeId) return;
    
    try {
      setProposalState(prev => ({ ...prev, isLoading: true }));
      
      // Create proposal first
      const response = await apiService.createProposal(activeServiceScopeId, data);
      
      // Upload document if provided
      if (file && response.data) {
        await apiService.uploadProposalDocument(response.data.id, file);
      }
      
      await fetchProposals(activeServiceScopeId);
      setProposalState(prev => ({ ...prev, showCreateForm: false, isLoading: false }));
    } catch (error: any) {
      setProposalState(prev => ({ 
        ...prev, 
        error: error.message || 'Failed to create proposal', 
        isLoading: false 
      }));
    }
  };

  const handleUpdateProposal = async (data: UpdateProposalDto, file?: File) => {
    if (!proposalState.selectedProposal || !activeServiceScopeId) return;
    
    try {
      setProposalState(prev => ({ ...prev, isLoading: true }));
      
      // Update proposal
      await apiService.updateProposal(proposalState.selectedProposal.id, data);
      
      // Upload new document if provided
      if (file) {
        await apiService.uploadProposalDocument(proposalState.selectedProposal.id, file);
      }
      
      await fetchProposals(activeServiceScopeId);
      setProposalState(prev => ({ 
        ...prev, 
        showEditForm: false, 
        selectedProposal: null, 
        isLoading: false 
      }));
    } catch (error: any) {
      setProposalState(prev => ({ 
        ...prev, 
        error: error.message || 'Failed to update proposal', 
        isLoading: false 
      }));
    }
  };

  const handleDeleteProposal = async (proposalId: string) => {
    const confirmDelete = window.confirm('Are you sure you want to delete this proposal? This action cannot be undone.');
    
    if (confirmDelete) {
      try {
        setProposalState(prev => ({ ...prev, isLoading: true }));
        await apiService.deleteProposal(proposalId);
        if (activeServiceScopeId) {
          await fetchProposals(activeServiceScopeId);
        }
        setProposalState(prev => ({ ...prev, isLoading: false }));
      } catch (error: any) {
        setProposalState(prev => ({ 
          ...prev, 
          error: error.message || 'Failed to delete proposal', 
          isLoading: false 
        }));
      }
    }
  };

  const handleUploadSAFDocument = async (serviceScopeId: string, file: File) => {
    try {
      setServiceScopeState(prev => ({ ...prev, isLoading: true }));
      await apiService.uploadSAFDocument(serviceScopeId, file);
      await fetchServiceScopes();
      setServiceScopeState(prev => ({ ...prev, isLoading: false }));
    } catch (error: any) {
      setServiceScopeState(prev => ({ 
        ...prev, 
        error: error.message || 'Failed to upload SAF document', 
        isLoading: false 
      }));
    }
  };

  const toggleServiceScopeExpansion = (serviceScopeId: string) => {
    const newExpanded = new Set(expandedServiceScopes);
    if (newExpanded.has(serviceScopeId)) {
      newExpanded.delete(serviceScopeId);
      if (activeServiceScopeId === serviceScopeId) {
        setActiveServiceScopeId(null);
        setProposalState(prev => ({ ...prev, proposals: [] }));
      }
    } else {
      newExpanded.add(serviceScopeId);
      setActiveServiceScopeId(serviceScopeId);
      fetchProposals(serviceScopeId);
    }
    setExpandedServiceScopes(newExpanded);
  };

  const formatCurrency = (amount: number | null) => {
    if (!amount) return 'N/A';
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  };

  const formatProposalValue = (amount: number | null, currency: string | null) => {
    if (!amount) return 'N/A';
    const currencyCode = currency || 'SAR';
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currencyCode,
    }).format(amount);
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const isDateExpiring = (dateString: string | null): boolean => {
    if (!dateString) return false;
    const date = new Date(dateString);
    const now = new Date();
    const daysDiff = Math.ceil((date.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    return daysDiff <= 30 && daysDiff > 0;
  };

  const isDateExpired = (dateString: string | null): boolean => {
    if (!dateString) return false;
    const date = new Date(dateString);
    const now = new Date();
    return date <= now;
  };

  const getStatusBadgeClass = (status: string) => {
    switch (status) {
      case SAFStatus.COMPLETED:
      case ProposalStatus.APPROVED:
      case ProposalStatus.ACCEPTED_BY_CLIENT:
        return 'status-badge status-success';
      case SAFStatus.IN_PROGRESS:
      case ProposalStatus.UNDER_REVIEW:
      case ProposalStatus.PENDING_APPROVAL:
        return 'status-badge status-warning';
      case SAFStatus.PENDING:
      case ProposalStatus.DRAFT:
        return 'status-badge status-info';
      case SAFStatus.ON_HOLD:
      case ProposalStatus.REQUIRES_REVISION:
        return 'status-badge status-warning';
      case SAFStatus.CANCELLED:
      case ProposalStatus.REJECTED:
        return 'status-badge status-danger';
      default:
        return 'status-badge';
    }
  };

  // Show forms
  if (serviceScopeState.showCreateForm) {
    return (
      <ServiceScopeForm
        contractId={contractId}
        onSubmit={(data) => handleCreateServiceScope(data as CreateServiceScopeDto)}
        onCancel={() => setServiceScopeState(prev => ({ ...prev, showCreateForm: false }))}
        isLoading={serviceScopeState.isLoading}
      />
    );
  }

  if (serviceScopeState.showEditForm && serviceScopeState.selectedServiceScope) {
    return (
      <ServiceScopeForm
        contractId={contractId}
        serviceScope={serviceScopeState.selectedServiceScope}
        onSubmit={(data) => handleUpdateServiceScope(data as UpdateServiceScopeDto)}
        onCancel={() => setServiceScopeState(prev => ({ 
          ...prev, 
          showEditForm: false, 
          selectedServiceScope: null 
        }))}
        isLoading={serviceScopeState.isLoading}
      />
    );
  }

  if (proposalState.showCreateForm && activeServiceScopeId) {
    return (
      <ProposalForm
        serviceScopeId={activeServiceScopeId}
        onSubmit={(data, file) => handleCreateProposal(data as CreateProposalDto, file)}
        onCancel={() => setProposalState(prev => ({ ...prev, showCreateForm: false }))}
        isLoading={proposalState.isLoading}
      />
    );
  }

  if (proposalState.showEditForm && proposalState.selectedProposal && activeServiceScopeId) {
    return (
      <ProposalForm
        serviceScopeId={activeServiceScopeId}
        proposal={proposalState.selectedProposal}
        onSubmit={(data, file) => handleUpdateProposal(data as UpdateProposalDto, file)}
        onCancel={() => setProposalState(prev => ({ 
          ...prev, 
          showEditForm: false, 
          selectedProposal: null 
        }))}
        isLoading={proposalState.isLoading}
      />
    );
  }

  return (
    <div className="service-scope-manager">
      <div className="section-header">
        <div className="header-content">
          <h2>Services, Scopes & Proposals</h2>
          <p>Manage service scopes and their associated proposals for this contract.</p>
        </div>
        <button
          onClick={() => setServiceScopeState(prev => ({ ...prev, showCreateForm: true }))}
          className="btn btn-primary"
          disabled={serviceScopeState.isLoading}
        >
          Add Service Scope
        </button>
      </div>

      {/* Error Messages */}
      {serviceScopeState.error && (
        <div className="error-message">
          {serviceScopeState.error}
          <button 
            onClick={() => setServiceScopeState(prev => ({ ...prev, error: null }))}
            className="close-btn"
          >
            ×
          </button>
        </div>
      )}

      {proposalState.error && (
        <div className="error-message">
          {proposalState.error}
          <button 
            onClick={() => setProposalState(prev => ({ ...prev, error: null }))}
            className="close-btn"
          >
            ×
          </button>
        </div>
      )}

      {/* Loading State */}
      {serviceScopeState.isLoading && (
        <div className="loading">Loading service scopes...</div>
      )}

      {/* Service Scopes List */}
      {!serviceScopeState.isLoading && serviceScopeState.serviceScopes.length === 0 ? (
        <div className="empty-state">
          <div className="empty-icon">🔧</div>
          <h3>No Service Scopes</h3>
          <p>This contract doesn't have any service scopes yet. Add a service scope to get started.</p>
          <button
            onClick={() => setServiceScopeState(prev => ({ ...prev, showCreateForm: true }))}
            className="btn btn-primary"
          >
            Add First Service Scope
          </button>
        </div>
      ) : (
        <div className="service-scopes-list">
          {serviceScopeState.serviceScopes.map(serviceScope => (
            <div key={serviceScope.id} className="service-scope-card">
              <div className="service-scope-header">
                <div className="service-scope-info">
                  <h3>{serviceScope.service?.name || 'Unknown Service'}</h3>
                  <div className="service-scope-meta">
                    <span className="category">{serviceScope.service?.category}</span>
                    <span className={getStatusBadgeClass(serviceScope.safStatus || '')}>
                      SAF: {serviceScope.safStatus?.replace('_', ' ').toUpperCase() || 'N/A'}
                    </span>
                    {serviceScope.totalValue && (
                      <span className="value">{formatCurrency(serviceScope.totalValue)}</span>
                    )}
                  </div>
                </div>
                
                <div className="service-scope-actions">
                  <button
                    onClick={() => toggleServiceScopeExpansion(serviceScope.id)}
                    className="btn btn-secondary btn-sm"
                  >
                    {expandedServiceScopes.has(serviceScope.id) ? 'Collapse' : 'Expand'}
                  </button>
                  <button
                    onClick={() => setServiceScopeState(prev => ({ 
                      ...prev, 
                      selectedServiceScope: serviceScope, 
                      showEditForm: true 
                    }))}
                    className="btn btn-secondary btn-sm"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => handleDeleteServiceScope(serviceScope.id)}
                    className="btn btn-danger btn-sm"
                  >
                    Delete
                  </button>
                </div>
              </div>

              {expandedServiceScopes.has(serviceScope.id) && (
                <div className="service-scope-details">
                  {/* Service Scope Details */}
                  <div className="details-section">
                    <h4>Scope Details</h4>
                    <div className="details-grid">
                      <div className="detail-item">
                        <label>Price:</label>
                        <span>{formatCurrency(serviceScope.price)}</span>
                      </div>
                      <div className="detail-item">
                        <label>Quantity:</label>
                        <span>{serviceScope.quantity || 'N/A'} {serviceScope.unit || ''}</span>
                      </div>
                      <div className="detail-item">
                        <label>Service Start:</label>
                        <span>{formatDate(serviceScope.safServiceStartDate)}</span>
                      </div>
                      <div className="detail-item">
                        <label>Service End:</label>
                        <span>{formatDate(serviceScope.safServiceEndDate)}</span>
                      </div>
                    </div>

                    {serviceScope.scopeDetails && Object.keys(serviceScope.scopeDetails).length > 0 && (
                      <div className="scope-configuration">
                        <h5>Configuration</h5>
                        <div className="configuration-grid">
                          {Object.entries(serviceScope.scopeDetails).map(([key, value]) => (
                            <div key={key} className="config-item">
                              <label>{key.replace(/_/g, ' ').toUpperCase()}:</label>
                              <span>{String(value)}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {serviceScope.notes && (
                      <div className="notes">
                        <h5>Notes</h5>
                        <p>{serviceScope.notes}</p>
                      </div>
                    )}
                  </div>

                  {/* SAF Document Section */}
                  <div className="saf-section">
                    <h4>Service Activation Form (SAF)</h4>
                    {serviceScope.safDocumentLink ? (
                      <div className="document-link">
                        <a 
                          href={`${apiService.getBaseURL()}${serviceScope.safDocumentLink}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="btn btn-secondary btn-sm"
                        >
                          📄 View SAF Document
                        </a>
                      </div>
                    ) : (
                      <div className="upload-saf">
                        <input
                          type="file"
                          id={`saf-upload-${serviceScope.id}`}
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file) {
                              handleUploadSAFDocument(serviceScope.id, file);
                            }
                          }}
                          accept=".pdf,.doc,.docx,.xls,.xlsx,.txt"
                          style={{ display: 'none' }}
                        />
                        <label 
                          htmlFor={`saf-upload-${serviceScope.id}`}
                          className="btn btn-secondary btn-sm"
                        >
                          📤 Upload SAF Document
                        </label>
                      </div>
                    )}
                  </div>

                  {/* Proposals Section */}
                  <div className="proposals-section">
                    <div className="proposals-header">
                      <h4>Proposals</h4>
                      {canManageProposals() && (
                        <button
                          onClick={() => {
                            setActiveServiceScopeId(serviceScope.id);
                            setProposalState(prev => ({
                              ...prev,
                              showCreateForm: true,
                              selectedProposal: null
                            }));
                          }}
                          className="btn btn-primary btn-sm"
                        >
                          + Add Proposal
                        </button>
                      )}
                    </div>

                    {proposalState.isLoading && activeServiceScopeId === serviceScope.id ? (
                      <div className="loading">Loading proposals...</div>
                    ) : proposalState.proposals.length === 0 && activeServiceScopeId === serviceScope.id ? (
                      <div className="empty-proposals">
                        <p>No proposals for this service scope yet.</p>
                      </div>
                    ) : activeServiceScopeId === serviceScope.id ? (
                      <div className="proposals-list">
                        {proposalState.proposals.map(proposal => (
                          <div className="proposal-card" key={proposal.id}>
                            <div className="proposal-header">
                              <div className="proposal-title-section">
                                <h5 className="proposal-title">
                                  {proposal.title || `${proposal.proposalType} Proposal`}
                                </h5>
                                <span className={`status-badge ${getStatusBadgeClass(proposal.status)}`}>
                                  {proposal.status}
                                </span>
                              </div>
                              <div className="proposal-actions">
                                {canManageProposals() && (
                                  <button
                                    onClick={() => {
                                      setActiveServiceScopeId(serviceScope.id);
                                      setProposalState(prev => ({ 
                                        ...prev, 
                                        selectedProposal: proposal, 
                                        showEditForm: true 
                                      }));
                                    }}
                                    className="btn-icon edit"
                                    title="Edit Proposal"
                                  >
                                    ✏️
                                  </button>
                                )}
                                {canDeleteProposals() && (
                                  <button
                                    onClick={() => handleDeleteProposal(proposal.id)}
                                    className="btn-icon delete"
                                    title="Delete Proposal"
                                  >
                                    🗑️
                                  </button>
                                )}
                              </div>
                            </div>

                            <div className="proposal-details">
                              {proposal.proposalValue && (
                                <span className="detail">Value: {formatProposalValue(proposal.proposalValue, proposal.currency)}</span>
                              )}
                              {proposal.estimatedDurationDays && (
                                <span className="detail">Duration: {proposal.estimatedDurationDays} days</span>
                              )}
                              {proposal.validUntilDate && (
                                <span className={`detail ${isDateExpired(proposal.validUntilDate) ? 'expired' : isDateExpiring(proposal.validUntilDate) ? 'expiring' : ''}`}>
                                  Valid Until: {formatDate(proposal.validUntilDate)}
                                  {isDateExpired(proposal.validUntilDate) && ' (EXPIRED)'}
                                  {isDateExpiring(proposal.validUntilDate) && ' (Expiring Soon)'}
                                </span>
                              )}
                              {proposal.assigneeUser && (
                                <span className="detail">
                                  Assignee: {proposal.assigneeUser.firstName && proposal.assigneeUser.lastName 
                                    ? `${proposal.assigneeUser.firstName} ${proposal.assigneeUser.lastName}`
                                    : proposal.assigneeUser.email
                                  }
                                </span>
                              )}
                              {proposal.submittedAt && (
                                <span className="detail">Submitted: {formatDate(proposal.submittedAt)}</span>
                              )}
                              {proposal.approvedAt && (
                                <span className="detail">Approved: {formatDate(proposal.approvedAt)}</span>
                              )}
                            </div>

                            {proposal.description && (
                              <div className="proposal-description">
                                <p>{proposal.description}</p>
                              </div>
                            )}

                            {proposal.documentLink && (
                              <div className="proposal-document">
                                <a 
                                  href={proposal.documentLink} 
                                  target="_blank" 
                                  rel="noopener noreferrer"
                                  className="document-link"
                                >
                                  📄 View Document
                                </a>
                              </div>
                            )}

                            {proposal.notes && (
                              <div className="proposal-notes">
                                <strong>Notes:</strong> {proposal.notes}
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    ) : null}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default ServiceScopeManager; 