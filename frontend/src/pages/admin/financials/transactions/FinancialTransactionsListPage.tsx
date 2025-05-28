import React, { useState, useEffect, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { apiService } from '../../../../services/apiService';
import { useAuth } from '../../../../contexts/AuthContext';
import {
  FinancialTransaction,
  FinancialTransactionType,
  FinancialTransactionStatus,
  FinancialTransactionTypeLabels,
  FinancialTransactionStatusLabels,
  QueryFinancialTransactionsDto,
  isRevenueType,
  isCostType
} from '../../../../types/financial';
import { UserRole, ApiError } from '../../../../types/auth';
import './FinancialTransactionsListPage.css';

/**
 * FinancialTransactionsListPage Component
 * Displays a list of financial transactions with filtering and pagination
 * Includes role-based access control for financial data
 */
const FinancialTransactionsListPage: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  
  const [transactions, setTransactions] = useState<FinancialTransaction[]>([]);
  const [clients, setClients] = useState<Array<{ id: string; name: string }>>([]);
  const [contracts, setContracts] = useState<Array<{ id: string; name: string; clientName?: string }>>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filters, setFilters] = useState<QueryFinancialTransactionsDto>({
    page: 1,
    limit: 20,
    includeRelations: true,
  });
  const [meta, setMeta] = useState({
    count: 0,
    page: 1,
    limit: 20,
    totalPages: 0,
  });

  /**
   * Check if user has permission to view financial transactions
   */
  const canViewFinancials = (): boolean => {
    if (!user) return false;
    return [UserRole.ADMIN, UserRole.MANAGER].includes(user.role);
  };

  /**
   * Check if user has permission to edit financial transactions
   */
  const canEditFinancials = (): boolean => {
    if (!user) return false;
    return [UserRole.ADMIN, UserRole.MANAGER].includes(user.role);
  };

  /**
   * Fetch financial transactions from the backend API
   */
  const fetchTransactions = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await apiService.getFinancialTransactions(filters);
      setTransactions(response.data);
      if (response.meta) {
        setMeta(response.meta);
      }
    } catch (err) {
      const apiError = err as ApiError;
      setError(apiError.message || 'Failed to fetch financial transactions');
      console.error('Error fetching transactions:', err);
    } finally {
      setLoading(false);
    }
  }, [filters]);

  /**
   * Fetch clients for filter dropdown
   */
  const fetchClients = useCallback(async () => {
    try {
      const clientsData = await apiService.getClientsForDropdown();
      setClients(clientsData);
    } catch (err) {
      console.error('Failed to fetch clients:', err);
    }
  }, []);

  /**
   * Fetch contracts for filter dropdown
   */
  const fetchContracts = useCallback(async () => {
    try {
      const contractsData = await apiService.getContractsForDropdown();
      setContracts(contractsData);
    } catch (err) {
      console.error('Failed to fetch contracts:', err);
    }
  }, []);

  /**
   * Load data when component mounts or filters change
   */
  useEffect(() => {
    if (canViewFinancials()) {
      fetchTransactions();
      fetchClients();
      fetchContracts();
    }
  }, [fetchTransactions, fetchClients, fetchContracts, canViewFinancials]);

  /**
   * Handle filter changes
   */
  const handleFilterChange = (key: keyof QueryFinancialTransactionsDto, value: any) => {
    setFilters(prev => ({
      ...prev,
      [key]: value,
      page: 1, // Reset to first page when filtering
    }));
  };

  /**
   * Handle page changes
   */
  const handlePageChange = (page: number) => {
    setFilters(prev => ({ ...prev, page }));
  };

  /**
   * Clear all filters
   */
  const clearFilters = () => {
    setFilters({
      page: 1,
      limit: 20,
      includeRelations: true,
    });
  };

  /**
   * Get status badge CSS class
   */
  const getStatusBadgeClass = (status: FinancialTransactionStatus) => {
    switch (status) {
      case FinancialTransactionStatus.PAID:
        return 'status-badge status-paid';
      case FinancialTransactionStatus.PENDING:
        return 'status-badge status-pending';
      case FinancialTransactionStatus.OVERDUE:
        return 'status-badge status-overdue';
      case FinancialTransactionStatus.CANCELLED:
      case FinancialTransactionStatus.FAILED:
        return 'status-badge status-cancelled';
      case FinancialTransactionStatus.PROCESSING:
        return 'status-badge status-processing';
      case FinancialTransactionStatus.PARTIALLY_PAID:
        return 'status-badge status-partial';
      case FinancialTransactionStatus.REFUNDED:
        return 'status-badge status-refunded';
      case FinancialTransactionStatus.DISPUTED:
        return 'status-badge status-disputed';
      default:
        return 'status-badge';
    }
  };

  /**
   * Get transaction type badge CSS class
   */
  const getTypeBadgeClass = (type: FinancialTransactionType) => {
    if (isRevenueType(type)) {
      return 'type-badge type-revenue';
    } else if (isCostType(type)) {
      return 'type-badge type-cost';
    }
    return 'type-badge type-other';
  };

  /**
   * Format currency amount
   */
  const formatCurrency = (amount: number, currency: string = 'SAR') => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency,
      minimumFractionDigits: 2,
    }).format(amount);
  };

  /**
   * Format date
   */
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  /**
   * Get linked entity display text
   */
  const getLinkedEntityDisplay = (transaction: FinancialTransaction) => {
    const links = [];
    
    if (transaction.client) {
      links.push(`Client: ${transaction.client.companyName}`);
    }
    
    if (transaction.contract) {
      links.push(`Contract: ${transaction.contract.contractName}`);
    }
    
    if (transaction.serviceScope) {
      links.push(`Service: ${transaction.serviceScope.service?.name || 'Unknown Service'}`);
    }
    
    if (transaction.hardwareAsset) {
      links.push(`Asset: ${transaction.hardwareAsset.assetTag}`);
    }
    
    return links.length > 0 ? links.join(', ') : 'No links';
  };

  // Check permissions first
  if (!canViewFinancials()) {
    return (
      <div className="financial-transactions-list">
        <div className="error-container">
          <h3>Access Denied</h3>
          <p>You do not have permission to view financial transaction information. Contact your administrator if you need access.</p>
          <button onClick={() => navigate('/dashboard')} className="back-button">
            Back to Dashboard
          </button>
        </div>
      </div>
    );
  }

  if (loading && transactions.length === 0) {
    return (
      <div className="financial-transactions-list">
        <div className="loading-container">
          <div className="loading-spinner"></div>
          <p>Loading financial transactions...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="financial-transactions-list">
      <div className="page-header">
        <h1>Financial Transactions</h1>
        {canEditFinancials() && (
          <Link to="/admin/financials/transactions/new" className="btn btn-primary">
            Record New Transaction
          </Link>
        )}
      </div>

      {/* Filters Section */}
      <div className="filters-section">
        <div className="filters-row">
          <div className="filter-group">
            <label htmlFor="typeFilter">Type:</label>
            <select
              id="typeFilter"
              value={filters.type || ''}
              onChange={(e) => handleFilterChange('type', e.target.value || undefined)}
            >
              <option value="">All Types</option>
              <optgroup label="Revenue">
                {Object.values(FinancialTransactionType)
                  .filter(isRevenueType)
                  .map(type => (
                    <option key={type} value={type}>
                      {FinancialTransactionTypeLabels[type]}
                    </option>
                  ))}
              </optgroup>
              <optgroup label="Costs">
                {Object.values(FinancialTransactionType)
                  .filter(isCostType)
                  .map(type => (
                    <option key={type} value={type}>
                      {FinancialTransactionTypeLabels[type]}
                    </option>
                  ))}
              </optgroup>
              <option value={FinancialTransactionType.OTHER}>
                {FinancialTransactionTypeLabels[FinancialTransactionType.OTHER]}
              </option>
            </select>
          </div>

          <div className="filter-group">
            <label htmlFor="statusFilter">Status:</label>
            <select
              id="statusFilter"
              value={filters.status || ''}
              onChange={(e) => handleFilterChange('status', e.target.value || undefined)}
            >
              <option value="">All Statuses</option>
              {Object.values(FinancialTransactionStatus).map(status => (
                <option key={status} value={status}>
                  {FinancialTransactionStatusLabels[status]}
                </option>
              ))}
            </select>
          </div>

          <div className="filter-group">
            <label htmlFor="clientFilter">Client:</label>
            <select
              id="clientFilter"
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
            <label htmlFor="contractFilter">Contract:</label>
            <select
              id="contractFilter"
              value={filters.contractId || ''}
              onChange={(e) => handleFilterChange('contractId', e.target.value || undefined)}
            >
              <option value="">All Contracts</option>
              {contracts.map(contract => (
                <option key={contract.id} value={contract.id}>
                  {contract.name} {contract.clientName && `(${contract.clientName})`}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="filters-row">
          <div className="filter-group">
            <label htmlFor="dateFromFilter">Date From:</label>
            <input
              type="date"
              id="dateFromFilter"
              value={filters.transactionDateFrom || ''}
              onChange={(e) => handleFilterChange('transactionDateFrom', e.target.value || undefined)}
            />
          </div>

          <div className="filter-group">
            <label htmlFor="dateToFilter">Date To:</label>
            <input
              type="date"
              id="dateToFilter"
              value={filters.transactionDateTo || ''}
              onChange={(e) => handleFilterChange('transactionDateTo', e.target.value || undefined)}
            />
          </div>

          <div className="filter-group">
            <button onClick={clearFilters} className="btn btn-secondary">
              Clear Filters
            </button>
          </div>
        </div>
      </div>

      {error && (
        <div className="error-message">
          {error}
        </div>
      )}

      {/* Summary Stats */}
      <div className="summary-stats">
        <div className="stat-card">
          <h4>Total Transactions</h4>
          <p>{meta.count}</p>
        </div>
        <div className="stat-card">
          <h4>Revenue Transactions</h4>
          <p>{transactions.filter(t => isRevenueType(t.type)).length}</p>
        </div>
        <div className="stat-card">
          <h4>Cost Transactions</h4>
          <p>{transactions.filter(t => isCostType(t.type)).length}</p>
        </div>
        <div className="stat-card">
          <h4>Total Amount</h4>
          <p>{formatCurrency(transactions.reduce((sum, t) => sum + Number(t.amount), 0))}</p>
        </div>
      </div>

      {/* Transactions Table */}
      <div className="transactions-table-container">
        <table className="transactions-table">
          <thead>
            <tr>
              <th>Date</th>
              <th>Type</th>
              <th>Description</th>
              <th>Amount</th>
              <th>Status</th>
              <th>Linked To</th>
              <th>Recorded By</th>
              {canEditFinancials() && <th>Actions</th>}
            </tr>
          </thead>
          <tbody>
            {transactions.length === 0 ? (
              <tr>
                <td colSpan={canEditFinancials() ? 8 : 7} className="no-data">
                  {loading ? 'Loading...' : 'No financial transactions found matching the current filters.'}
                </td>
              </tr>
            ) : (
              transactions.map(transaction => (
                <tr key={transaction.id}>
                  <td>{formatDate(transaction.transactionDate)}</td>
                  <td>
                    <span className={getTypeBadgeClass(transaction.type)}>
                      {FinancialTransactionTypeLabels[transaction.type]}
                    </span>
                  </td>
                  <td>
                    <div className="description-cell">
                      <div className="description-text">{transaction.description}</div>
                      {transaction.referenceId && (
                        <div className="reference-id">Ref: {transaction.referenceId}</div>
                      )}
                    </div>
                  </td>
                  <td className={isRevenueType(transaction.type) ? 'amount-revenue' : 'amount-cost'}>
                    {formatCurrency(Number(transaction.amount), transaction.currency)}
                  </td>
                  <td>
                    <span className={getStatusBadgeClass(transaction.status)}>
                      {FinancialTransactionStatusLabels[transaction.status]}
                    </span>
                  </td>
                  <td className="linked-entities">
                    {getLinkedEntityDisplay(transaction)}
                  </td>
                  <td>
                    {transaction.recordedByUser 
                      ? `${transaction.recordedByUser.firstName} ${transaction.recordedByUser.lastName}`
                      : 'Unknown'
                    }
                  </td>
                  {canEditFinancials() && (
                    <td className="actions">
                      <Link 
                        to={`/admin/financials/transactions/${transaction.id}/edit`}
                        className="btn btn-sm btn-secondary"
                      >
                        Edit
                      </Link>
                    </td>
                  )}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {meta.totalPages > 1 && (
        <div className="pagination">
          <button
            onClick={() => handlePageChange(meta.page - 1)}
            disabled={meta.page <= 1}
            className="btn btn-secondary"
          >
            Previous
          </button>
          
          <span className="pagination-info">
            Page {meta.page} of {meta.totalPages} ({meta.count} total transactions)
          </span>
          
          <button
            onClick={() => handlePageChange(meta.page + 1)}
            disabled={meta.page >= meta.totalPages}
            className="btn btn-secondary"
          >
            Next
          </button>
        </div>
      )}
    </div>
  );
};

export default FinancialTransactionsListPage; 