import React, { useState, useEffect, useCallback } from 'react';
import { 
  Proposal, 
  ProposalQueryOptions 
} from '../../../types/service-scope';
import { ProposalType, ProposalStatus } from '../../../types/contract';
import { UserRole } from '../../../types/auth';
import { Client } from '../../../types/client';
import { apiService } from '../../../services/apiService';
import { useAuth } from '../../../contexts/AuthContext';
import './ProposalDashboard.css';

interface ProposalStatistics {
  total: number;
  byStatus: Record<string, number>;
  byType: Record<string, number>;
  totalValue: number;
  averageValue: number;
  expiringSoon: number;
}

const ProposalDashboard: React.FC = () => {
  const { user } = useAuth();
  const [proposals, setProposals] = useState<Proposal[]>([]);
  const [statistics, setStatistics] = useState<ProposalStatistics | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [clients, setClients] = useState<Client[]>([]);
  const [users, setUsers] = useState<Array<{
    id: string;
    email: string;
    firstName?: string;
    lastName?: string;
    fullName?: string;
    role: string;
  }>>([]);

  // Filter state
  const [filters, setFilters] = useState<ProposalQueryOptions>({
    page: 1,
    limit: 20,
    sortBy: 'createdAt',
    sortDirection: 'DESC'
  });

  // Check if user can access global proposal dashboard
  const canAccessDashboard = (): boolean => {
    if (!user) return false;
    return [UserRole.ADMIN, UserRole.MANAGER].includes(user.role);
  };

  // Fetch proposals with current filters
  const fetchProposals = useCallback(async () => {
    if (!canAccessDashboard()) return;

    try {
      setIsLoading(true);
      setError(null);
      const response = await apiService.getAllProposals(filters);
      setProposals(response.data || []);
    } catch (err) {
      console.error('Failed to fetch proposals:', err);
      setError('Failed to load proposals');
    } finally {
      setIsLoading(false);
    }
  }, [filters, user]);

  // Fetch statistics
  const fetchStatistics = useCallback(async () => {
    if (!canAccessDashboard()) return;

    try {
      const response = await apiService.getProposalStatistics(filters.clientId);
      setStatistics(response.data);
    } catch (err) {
      console.error('Failed to fetch statistics:', err);
    }
  }, [filters.clientId, user]);

  // Fetch clients for filter dropdown
  const fetchClients = useCallback(async () => {
    try {
      const response = await apiService.getClients();
      setClients(response.data || []);
    } catch (err) {
      console.error('Failed to fetch clients:', err);
    }
  }, []);

  // Fetch users for filter dropdown
  const fetchUsers = useCallback(async () => {
    try {
      const response = await apiService.getUsers();
      setUsers(response.users || []);
    } catch (err) {
      console.error('Failed to fetch users:', err);
    }
  }, []);

  useEffect(() => {
    if (canAccessDashboard()) {
      fetchProposals();
      fetchStatistics();
      fetchClients();
      fetchUsers();
    }
  }, [fetchProposals, fetchStatistics, fetchClients, fetchUsers]);

  // Handle filter changes
  const handleFilterChange = (key: keyof ProposalQueryOptions, value: any) => {
    setFilters(prev => ({
      ...prev,
      [key]: value,
      page: key !== 'page' ? 1 : value // Reset to page 1 when changing filters
    }));
  };

  // Clear all filters
  const clearFilters = () => {
    setFilters({
      page: 1,
      limit: 20,
      sortBy: 'createdAt',
      sortDirection: 'DESC'
    });
  };

  // Format currency with proper currency code
  const formatCurrency = (amount: number | null, currency: string | null) => {
    if (!amount) return 'N/A';
    const currencyCode = currency || 'SAR';
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currencyCode,
    }).format(amount);
  };

  // Format date
  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  // Check if date is expiring soon (within 30 days)
  const isDateExpiring = (dateString: string | null): boolean => {
    if (!dateString) return false;
    const date = new Date(dateString);
    const now = new Date();
    const daysDiff = Math.ceil((date.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    return daysDiff <= 30 && daysDiff > 0;
  };

  // Check if date is expired
  const isDateExpired = (dateString: string | null): boolean => {
    if (!dateString) return false;
    const date = new Date(dateString);
    const now = new Date();
    return date <= now;
  };

  // Get status badge class
  const getStatusBadgeClass = (status: string) => {
    const statusClasses: Record<string, string> = {
      [ProposalStatus.DRAFT]: 'status-draft',
      [ProposalStatus.IN_PREPARATION]: 'status-in-preparation',
      [ProposalStatus.SUBMITTED]: 'status-submitted',
      [ProposalStatus.UNDER_REVIEW]: 'status-under-review',
      [ProposalStatus.PENDING_APPROVAL]: 'status-pending-approval',
      [ProposalStatus.PENDING_CLIENT_REVIEW]: 'status-pending-client-review',
      [ProposalStatus.REQUIRES_REVISION]: 'status-requires-revision',
      [ProposalStatus.APPROVED]: 'status-approved',
      [ProposalStatus.REJECTED]: 'status-rejected',
      [ProposalStatus.WITHDRAWN]: 'status-withdrawn',
      [ProposalStatus.ARCHIVED]: 'status-archived',
      [ProposalStatus.ACCEPTED_BY_CLIENT]: 'status-accepted-by-client',
      [ProposalStatus.IN_IMPLEMENTATION]: 'status-in-implementation',
      [ProposalStatus.COMPLETED]: 'status-completed'
    };
    return statusClasses[status] || 'status-default';
  };

  if (!canAccessDashboard()) {
    return (
      <div className="proposal-dashboard">
        <div className="access-denied">
          <h2>Access Denied</h2>
          <p>You don't have permission to access the global proposal dashboard.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="proposal-dashboard">
      <div className="dashboard-header">
        <h1>Proposal Dashboard</h1>
        <p>Global overview of all proposals across clients and service scopes</p>
      </div>

      {/* Statistics Section */}
      {statistics && (
        <div className="statistics-section">
          <div className="stats-grid">
            <div className="stat-card">
              <h3>Total Proposals</h3>
              <div className="stat-value">{statistics.total}</div>
            </div>
            <div className="stat-card">
              <h3>Total Value</h3>
              <div className="stat-value">{formatCurrency(statistics.totalValue, 'SAR')}</div>
            </div>
            <div className="stat-card">
              <h3>Average Value</h3>
              <div className="stat-value">{formatCurrency(statistics.averageValue, 'SAR')}</div>
            </div>
            <div className="stat-card warning">
              <h3>Expiring Soon</h3>
              <div className="stat-value">{statistics.expiringSoon}</div>
            </div>
          </div>

          <div className="status-breakdown">
            <h4>By Status</h4>
            <div className="status-stats">
              {Object.entries(statistics.byStatus).map(([status, count]) => (
                <div key={status} className="status-stat">
                  <span className={`status-badge ${getStatusBadgeClass(status)}`}>
                    {status.replace('_', ' ')}
                  </span>
                  <span className="count">{count}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

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
            <label>Client</label>
            <select
              value={filters.clientId || ''}
              onChange={(e) => handleFilterChange('clientId', e.target.value || undefined)}
            >
              <option value="">All Clients</option>
              {clients.map(client => (
                <option key={client.id} value={client.id}>{client.companyName}</option>
              ))}
            </select>
          </div>

          <div className="filter-group">
            <label>Status</label>
            <select
              value={filters.status || ''}
              onChange={(e) => handleFilterChange('status', e.target.value || undefined)}
            >
              <option value="">All Statuses</option>
              {Object.values(ProposalStatus).map(status => (
                <option key={status} value={status}>{status.replace('_', ' ')}</option>
              ))}
            </select>
          </div>

          <div className="filter-group">
            <label>Type</label>
            <select
              value={filters.proposalType || ''}
              onChange={(e) => handleFilterChange('proposalType', e.target.value || undefined)}
            >
              <option value="">All Types</option>
              {Object.values(ProposalType).map(type => (
                <option key={type} value={type}>{type.replace('_', ' ')}</option>
              ))}
            </select>
          </div>

          <div className="filter-group">
            <label>Assignee</label>
            <select
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
            <label>Currency</label>
            <select
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
            <label>Search</label>
            <input
              type="text"
              placeholder="Search title, description..."
              value={filters.search || ''}
              onChange={(e) => handleFilterChange('search', e.target.value || undefined)}
            />
          </div>
        </div>
      </div>

      {/* Proposals List */}
      <div className="proposals-section">
        <div className="proposals-header">
          <h3>Proposals ({proposals.length})</h3>
          <div className="sort-controls">
            <select
              value={filters.sortBy || 'createdAt'}
              onChange={(e) => handleFilterChange('sortBy', e.target.value)}
            >
              <option value="createdAt">Created Date</option>
              <option value="title">Title</option>
              <option value="status">Status</option>
              <option value="proposalValue">Value</option>
              <option value="validUntilDate">Valid Until</option>
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

        {isLoading ? (
          <div className="loading">Loading proposals...</div>
        ) : error ? (
          <div className="error">{error}</div>
        ) : proposals.length === 0 ? (
          <div className="no-data">No proposals found matching the current filters.</div>
        ) : (
          <div className="proposals-grid">
            {proposals.map(proposal => (
              <div key={proposal.id} className="proposal-card">
                <div className="proposal-header">
                  <div className="proposal-title-section">
                    <h4 className="proposal-title">
                      {proposal.title || `${proposal.proposalType} Proposal`}
                    </h4>
                    <span className={`status-badge ${getStatusBadgeClass(proposal.status)}`}>
                      {proposal.status.replace('_', ' ')}
                    </span>
                  </div>
                </div>

                <div className="proposal-details">
                  {proposal.serviceScope?.contract?.clientId && (
                    <span className="detail">
                      Client ID: {proposal.serviceScope.contract.clientId}
                    </span>
                  )}
                  {proposal.proposalValue && (
                    <span className="detail">
                      Value: {formatCurrency(proposal.proposalValue, proposal.currency)}
                    </span>
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
                  <span className="detail">Created: {formatDate(proposal.createdAt)}</span>
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
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default ProposalDashboard; 