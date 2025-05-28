import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Proposal, 
  ProposalQueryOptions 
} from '../../../types/service-scope';
import { ProposalType, ProposalStatus } from '../../../types/contract';
import { UserRole } from '../../../types/auth';
import { apiService } from '../../../services/apiService';
import { useAuth } from '../../../contexts/AuthContext';
import './ProposalListPage.css';

const ProposalListPage: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [proposals, setProposals] = useState<Proposal[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [filters, setFilters] = useState<ProposalQueryOptions>({
    page: 1,
    limit: 20,
    sortBy: 'createdAt',
    sortDirection: 'DESC'
  });

  // Filter options
  const [clients, setClients] = useState<Array<{ id: string; name: string }>>([]);
  const [users, setUsers] = useState<Array<{
    id: string;
    email: string;
    firstName?: string;
    lastName?: string;
    fullName?: string;
    role: string;
  }>>([]);

  /**
   * Check if user can access proposals
   */
  const canAccessProposals = useCallback((): boolean => {
    if (!user) return false;
    return [UserRole.ADMIN, UserRole.MANAGER, UserRole.ACCOUNT_MANAGER].includes(user.role);
  }, [user]);

  /**
   * Check if user can manage proposals
   */
  const canManageProposals = useCallback((): boolean => {
    if (!user) return false;
    return [UserRole.ADMIN, UserRole.MANAGER, UserRole.ACCOUNT_MANAGER].includes(user.role);
  }, [user]);

  /**
   * Check if user can delete proposals
   */
  const canDeleteProposals = useCallback((): boolean => {
    if (!user) return false;
    return [UserRole.ADMIN, UserRole.MANAGER].includes(user.role);
  }, [user]);

  /**
   * Fetch proposals from API
   */
  const fetchProposals = useCallback(async () => {
    if (!canAccessProposals()) {
      setError('You do not have permission to view proposals.');
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      const response = await apiService.getAllProposals(filters);
      setProposals(response.data);
    } catch (err: any) {
      setError(err.message || 'Failed to fetch proposals');
      console.error('Error fetching proposals:', err);
    } finally {
      setLoading(false);
    }
  }, [filters, canAccessProposals]);

  /**
   * Fetch filter options
   */
  const fetchFilterOptions = useCallback(async () => {
    try {
      const [clientsResponse, usersResponse] = await Promise.all([
        apiService.getClientsForDropdown(),
        apiService.getUsers()
      ]);
      
      setClients(clientsResponse);
      setUsers(usersResponse.users.filter(u => 
        [UserRole.ADMIN, UserRole.MANAGER, UserRole.ACCOUNT_MANAGER].includes(u.role as UserRole)
      ));
    } catch (err) {
      console.error('Error fetching filter options:', err);
    }
  }, []);

  useEffect(() => {
    if (canAccessProposals()) {
      fetchProposals();
      fetchFilterOptions();
    }
  }, [fetchProposals, fetchFilterOptions, canAccessProposals]);

  /**
   * Handle filter changes
   */
  const handleFilterChange = (key: keyof ProposalQueryOptions, value: any) => {
    setFilters(prev => ({
      ...prev,
      [key]: value,
      page: 1 // Reset to first page when filters change
    }));
  };

  /**
   * Clear all filters
   */
  const clearFilters = () => {
    setFilters({
      page: 1,
      limit: 20,
      sortBy: 'createdAt',
      sortDirection: 'DESC'
    });
  };

  /**
   * Handle proposal deletion
   */
  const handleDeleteProposal = async (proposalId: string) => {
    if (!canDeleteProposals()) {
      alert('You do not have permission to delete proposals.');
      return;
    }

    const confirmDelete = window.confirm('Are you sure you want to delete this proposal? This action cannot be undone.');
    
    if (confirmDelete) {
      try {
        await apiService.deleteProposal(proposalId);
        await fetchProposals(); // Refresh the list
      } catch (err: any) {
        alert(err.message || 'Failed to delete proposal');
      }
    }
  };

  /**
   * Format currency value
   */
  const formatCurrency = (amount: number | null, currency: string | null) => {
    if (!amount) return 'N/A';
    const currencyCode = currency || 'SAR';
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currencyCode,
    }).format(amount);
  };

  /**
   * Format date
   */
  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  /**
   * Check if date is expiring soon
   */
  const isDateExpiring = (dateString: string | null): boolean => {
    if (!dateString) return false;
    const date = new Date(dateString);
    const now = new Date();
    const daysDiff = Math.ceil((date.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    return daysDiff <= 30 && daysDiff > 0;
  };

  /**
   * Check if date is expired
   */
  const isDateExpired = (dateString: string | null): boolean => {
    if (!dateString) return false;
    const date = new Date(dateString);
    const now = new Date();
    return date <= now;
  };

  /**
   * Get status badge class
   */
  const getStatusBadgeClass = (status: string) => {
    const statusClass = status.toLowerCase().replace(/_/g, '-');
    return `status-badge status-${statusClass}`;
  };

  /**
   * Get proposal type display name
   */
  const getProposalTypeDisplay = (type: ProposalType) => {
    const typeMap: Record<ProposalType, string> = {
      [ProposalType.TECHNICAL]: 'Technical',
      [ProposalType.FINANCIAL]: 'Financial',
      [ProposalType.TECHNICAL_FINANCIAL]: 'Technical & Financial',
      [ProposalType.ARCHITECTURE]: 'Architecture',
      [ProposalType.IMPLEMENTATION]: 'Implementation',
      [ProposalType.PRICING]: 'Pricing',
      [ProposalType.SCOPE_CHANGE]: 'Scope Change',
      [ProposalType.OTHER]: 'Other'
    };
    return typeMap[type] || type;
  };

  if (!canAccessProposals()) {
    return (
      <div className="proposal-list-page">
        <div className="access-denied">
          <h2>Access Denied</h2>
          <p>You do not have permission to view proposals. Contact your administrator if you need access.</p>
          <button onClick={() => navigate('/dashboard')} className="btn btn-primary">
            Back to Dashboard
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="proposal-list-page">
      <div className="page-header">
        <div className="header-content">
          <h1>Proposals Management</h1>
          <p>Manage and track all proposals across service scopes and contracts.</p>
        </div>
      </div>

      {/* Filters Section */}
      <div className="filters-section">
        <div className="filters-header">
          <h3>Filters</h3>
          <button onClick={clearFilters} className="btn btn-secondary btn-sm">
            Clear Filters
          </button>
        </div>
        
        <div className="filters-grid">
          <div className="filter-group">
            <label htmlFor="proposalType">Proposal Type</label>
            <select
              id="proposalType"
              value={filters.proposalType || ''}
              onChange={(e) => handleFilterChange('proposalType', e.target.value || undefined)}
            >
              <option value="">All Types</option>
              {Object.values(ProposalType).map(type => (
                <option key={type} value={type}>
                  {getProposalTypeDisplay(type)}
                </option>
              ))}
            </select>
          </div>

          <div className="filter-group">
            <label htmlFor="status">Status</label>
            <select
              id="status"
              value={filters.status || ''}
              onChange={(e) => handleFilterChange('status', e.target.value || undefined)}
            >
              <option value="">All Statuses</option>
              {Object.values(ProposalStatus).map(status => (
                <option key={status} value={status}>
                  {status.replace(/_/g, ' ').toUpperCase()}
                </option>
              ))}
            </select>
          </div>

          <div className="filter-group">
            <label htmlFor="clientId">Client</label>
            <select
              id="clientId"
              value={filters.clientId || ''}
              onChange={(e) => handleFilterChange('clientId', e.target.value || undefined)}
            >
              <option value="">All Clients</option>
              {clients.map(client => (
                <option key={client.id} value={client.id}>
                  {client.name}
                </option>
              ))}
            </select>
          </div>

          <div className="filter-group">
            <label htmlFor="assigneeUserId">Assignee</label>
            <select
              id="assigneeUserId"
              value={filters.assigneeUserId || ''}
              onChange={(e) => handleFilterChange('assigneeUserId', e.target.value || undefined)}
            >
              <option value="">All Assignees</option>
              {users.map(user => (
                <option key={user.id} value={user.id}>
                  {user.firstName && user.lastName 
                    ? `${user.firstName} ${user.lastName}` 
                    : user.email
                  }
                </option>
              ))}
            </select>
          </div>

          <div className="filter-group">
            <label htmlFor="currency">Currency</label>
            <select
              id="currency"
              value={filters.currency || ''}
              onChange={(e) => handleFilterChange('currency', e.target.value || undefined)}
            >
              <option value="">All Currencies</option>
              <option value="SAR">SAR</option>
              <option value="USD">USD</option>
              <option value="EUR">EUR</option>
              <option value="GBP">GBP</option>
              <option value="AED">AED</option>
            </select>
          </div>

          <div className="filter-group">
            <label htmlFor="search">Search</label>
            <input
              type="text"
              id="search"
              placeholder="Search proposals..."
              value={filters.search || ''}
              onChange={(e) => handleFilterChange('search', e.target.value || undefined)}
            />
          </div>
        </div>
      </div>

      {/* Sort Controls */}
      <div className="sort-section">
        <div className="sort-controls">
          <label htmlFor="sortBy">Sort by:</label>
          <select
            id="sortBy"
            value={filters.sortBy || 'createdAt'}
            onChange={(e) => handleFilterChange('sortBy', e.target.value)}
          >
            <option value="createdAt">Created Date</option>
            <option value="submittedAt">Submitted Date</option>
            <option value="proposalValue">Value</option>
            <option value="validUntilDate">Valid Until</option>
            <option value="title">Title</option>
            <option value="status">Status</option>
          </select>
          
          <select
            value={filters.sortDirection || 'DESC'}
            onChange={(e) => handleFilterChange('sortDirection', e.target.value as 'ASC' | 'DESC')}
          >
            <option value="DESC">Descending</option>
            <option value="ASC">Ascending</option>
          </select>
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="error-message">
          {error}
          <button onClick={() => setError(null)} className="close-btn">×</button>
        </div>
      )}

      {/* Loading State */}
      {loading && (
        <div className="loading">Loading proposals...</div>
      )}

      {/* Proposals List */}
      {!loading && proposals.length === 0 ? (
        <div className="no-data">
          <div className="no-data-icon">📄</div>
          <h3>No Proposals Found</h3>
          <p>No proposals match your current filters. Try adjusting your search criteria.</p>
        </div>
      ) : !loading ? (
        <div className="proposals-section">
          <div className="proposals-header">
            <h3>Proposals ({proposals.length})</h3>
          </div>
          
          <div className="proposals-grid">
            {proposals.map(proposal => (
              <div key={proposal.id} className="proposal-card">
                <div className="proposal-header">
                  <div className="proposal-title-section">
                    <h4 className="proposal-title">
                      {proposal.title || `${getProposalTypeDisplay(proposal.proposalType)} Proposal`}
                    </h4>
                    <div className="proposal-meta">
                      <span className="type-badge">
                        {getProposalTypeDisplay(proposal.proposalType)}
                      </span>
                      <span className={getStatusBadgeClass(proposal.status)}>
                        {proposal.status.replace(/_/g, ' ').toUpperCase()}
                      </span>
                      {proposal.version && (
                        <span className="version-badge">v{proposal.version}</span>
                      )}
                    </div>
                  </div>
                  
                  {canManageProposals() && (
                    <div className="proposal-actions">
                      <button
                        onClick={() => navigate(`/admin/proposals/${proposal.id}/edit`)}
                        className="btn-icon edit"
                        title="Edit Proposal"
                      >
                        ✏️
                      </button>
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
                  )}
                </div>

                <div className="proposal-details">
                  {proposal.proposalValue && (
                    <div className="detail-item">
                      <span className="label">Value:</span>
                      <span className="value">
                        {formatCurrency(proposal.proposalValue, proposal.currency)}
                      </span>
                    </div>
                  )}
                  
                  {proposal.estimatedDurationDays && (
                    <div className="detail-item">
                      <span className="label">Duration:</span>
                      <span className="value">{proposal.estimatedDurationDays} days</span>
                    </div>
                  )}
                  
                  {proposal.validUntilDate && (
                    <div className="detail-item">
                      <span className="label">Valid Until:</span>
                      <span className={`value ${isDateExpired(proposal.validUntilDate) ? 'expired' : isDateExpiring(proposal.validUntilDate) ? 'expiring' : ''}`}>
                        {formatDate(proposal.validUntilDate)}
                        {isDateExpired(proposal.validUntilDate) && ' (EXPIRED)'}
                        {isDateExpiring(proposal.validUntilDate) && ' (Expiring Soon)'}
                      </span>
                    </div>
                  )}
                  
                  {proposal.assigneeUser && (
                    <div className="detail-item">
                      <span className="label">Assignee:</span>
                      <span className="value">
                        {proposal.assigneeUser.firstName && proposal.assigneeUser.lastName 
                          ? `${proposal.assigneeUser.firstName} ${proposal.assigneeUser.lastName}`
                          : proposal.assigneeUser.email
                        }
                      </span>
                    </div>
                  )}
                  
                  <div className="detail-item">
                    <span className="label">Created:</span>
                    <span className="value">{formatDate(proposal.createdAt)}</span>
                  </div>
                  
                  {proposal.submittedAt && (
                    <div className="detail-item">
                      <span className="label">Submitted:</span>
                      <span className="value">{formatDate(proposal.submittedAt)}</span>
                    </div>
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
        </div>
      ) : null}
    </div>
  );
};

export default ProposalListPage; 