import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { apiService } from '../../../services/apiService';
import { Contract, ContractStatus, ContractQueryOptions } from '../../../types/contract';
import { Client } from '../../../types/client';
import './AdminContractsListPage.css';

const AdminContractsListPage: React.FC = () => {
  const [contracts, setContracts] = useState<Contract[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filters, setFilters] = useState<ContractQueryOptions>({
    page: 1,
    limit: 10,
  });
  const [meta, setMeta] = useState({
    count: 0,
    page: 1,
    limit: 10,
    totalPages: 0,
  });

  const fetchContracts = useCallback(async () => {
    try {
      setLoading(true);
      const response = await apiService.getContracts(filters);
      setContracts(response.data);
      if (response.meta) {
        setMeta(response.meta);
      }
      setError(null);
    } catch (err: any) {
      setError(err.message || 'Failed to fetch contracts');
    } finally {
      setLoading(false);
    }
  }, [filters]);

  const fetchClients = useCallback(async () => {
    try {
      const response = await apiService.getClients();
      setClients(response.data);
    } catch (err: any) {
      console.error('Failed to fetch clients:', err);
    }
  }, []);

  useEffect(() => {
    fetchContracts();
    fetchClients();
  }, [fetchContracts, fetchClients]);

  const handleFilterChange = (key: keyof ContractQueryOptions, value: any) => {
    setFilters(prev => ({
      ...prev,
      [key]: value,
      page: 1, // Reset to first page when filtering
    }));
  };

  const handlePageChange = (page: number) => {
    setFilters(prev => ({ ...prev, page }));
  };

  const getStatusBadgeClass = (status: ContractStatus) => {
    switch (status) {
      case ContractStatus.ACTIVE:
      case ContractStatus.RENEWED_ACTIVE:
        return 'status-badge status-active';
      case ContractStatus.DRAFT:
        return 'status-badge status-draft';
      case ContractStatus.EXPIRED:
        return 'status-badge status-expired';
      case ContractStatus.TERMINATED:
      case ContractStatus.CANCELLED:
        return 'status-badge status-terminated';
      default:
        return 'status-badge';
    }
  };

  const formatCurrency = (amount: number | null | undefined) => {
    if (!amount) return 'N/A';
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString();
  };

  const getClientName = (clientId: string) => {
    const client = clients.find(c => c.id === clientId);
    return client?.companyName || 'Unknown Client';
  };

  if (loading && contracts.length === 0) {
    return (
      <div className="admin-contracts-list">
        <div className="loading">Loading contracts...</div>
      </div>
    );
  }

  return (
    <div className="admin-contracts-list">
      <div className="page-header">
        <h1>Contract Management</h1>
        <Link to="/admin/contracts/new" className="btn btn-primary">
          Create New Contract
        </Link>
      </div>

      {/* Filters */}
      <div className="filters-section">
        <div className="filters-row">
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
                  {client.companyName}
                </option>
              ))}
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
              {Object.values(ContractStatus).map(status => (
                <option key={status} value={status}>
                  {status.replace('_', ' ').toUpperCase()}
                </option>
              ))}
            </select>
          </div>

          <div className="filter-group">
            <label htmlFor="searchFilter">Search:</label>
            <input
              type="text"
              id="searchFilter"
              placeholder="Search contract names..."
              value={filters.search || ''}
              onChange={(e) => handleFilterChange('search', e.target.value || undefined)}
            />
          </div>

          <div className="filter-group">
            <label htmlFor="expiringFilter">Expiring Soon:</label>
            <select
              id="expiringFilter"
              value={filters.expiringSoonDays || ''}
              onChange={(e) => handleFilterChange('expiringSoonDays', e.target.value ? parseInt(e.target.value) : undefined)}
            >
              <option value="">All Contracts</option>
              <option value="30">Next 30 days</option>
              <option value="60">Next 60 days</option>
              <option value="90">Next 90 days</option>
            </select>
          </div>
        </div>
      </div>

      {error && (
        <div className="error-message">
          {error}
        </div>
      )}

      {/* Contracts Table */}
      <div className="contracts-table-container">
        <table className="contracts-table">
          <thead>
            <tr>
              <th>Contract Name</th>
              <th>Client</th>
              <th>Start Date</th>
              <th>End Date</th>
              <th>Status</th>
              <th>Value</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {contracts.map(contract => (
              <tr key={contract.id}>
                <td>
                  <Link to={`/admin/contracts/${contract.id}`} className="contract-name-link">
                    {contract.contractName}
                  </Link>
                </td>
                <td>{getClientName(contract.clientId)}</td>
                <td>{formatDate(contract.startDate)}</td>
                <td>{formatDate(contract.endDate)}</td>
                <td>
                  <span className={getStatusBadgeClass(contract.status)}>
                    {contract.status.replace('_', ' ').toUpperCase()}
                  </span>
                </td>
                <td>{formatCurrency(contract.value)}</td>
                <td>
                  <div className="actions">
                    <Link to={`/admin/contracts/${contract.id}`} className="btn btn-sm btn-secondary">
                      View
                    </Link>
                    <Link to={`/admin/contracts/${contract.id}/edit`} className="btn btn-sm btn-primary">
                      Edit
                    </Link>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {contracts.length === 0 && !loading && (
          <div className="no-contracts">
            <p>No contracts found matching your criteria.</p>
            <Link to="/admin/contracts/new" className="btn btn-primary">
              Create Your First Contract
            </Link>
          </div>
        )}
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
          
          <span className="page-info">
            Page {meta.page} of {meta.totalPages} ({meta.count} total contracts)
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

export default AdminContractsListPage; 