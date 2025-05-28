import React, { useState, useMemo } from 'react';
import { JiraIssue } from '../../types/jira';
import { apiService } from '../../services/apiService';
import './JiraTicketsList.css';

interface JiraTicketsListProps {
  tickets: JiraIssue[];
  loading?: boolean;
  error?: string | null;
  title?: string;
  showClientFilter?: boolean;
  onTicketClick?: (ticket: JiraIssue) => void;
  maxHeight?: string;
  showPagination?: boolean;
  pageSize?: number;
}

type SortField = 'created' | 'updated' | 'priority' | 'status' | 'summary';
type SortDirection = 'asc' | 'desc';

/**
 * JiraTicketsList Component
 * Reusable component for displaying lists of Jira tickets with sorting and filtering
 */
const JiraTicketsList: React.FC<JiraTicketsListProps> = ({
  tickets,
  loading = false,
  error = null,
  title = 'Jira Tickets',
  showClientFilter = false,
  onTicketClick,
  maxHeight = '400px',
  showPagination = true,
  pageSize = 10,
}) => {
  const [sortField, setSortField] = useState<SortField>('created');
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc');
  const [filterStatus, setFilterStatus] = useState<string>('');
  const [filterPriority, setFilterPriority] = useState<string>('');
  const [currentPage, setCurrentPage] = useState(1);

  // Get unique values for filters
  const uniqueStatuses = useMemo(() => {
    const statuses = tickets.map(ticket => ticket.fields.status.name);
    return Array.from(new Set(statuses)).sort();
  }, [tickets]);

  const uniquePriorities = useMemo(() => {
    const priorities = tickets.map(ticket => ticket.fields.priority.name);
    return Array.from(new Set(priorities)).sort();
  }, [tickets]);

  // Filter and sort tickets
  const filteredAndSortedTickets = useMemo(() => {
    let filtered = tickets;

    // Apply filters
    if (filterStatus) {
      filtered = filtered.filter(ticket => ticket.fields.status.name === filterStatus);
    }
    if (filterPriority) {
      filtered = filtered.filter(ticket => ticket.fields.priority.name === filterPriority);
    }

    // Apply sorting
    filtered.sort((a, b) => {
      let aValue: any;
      let bValue: any;

      switch (sortField) {
        case 'created':
          aValue = new Date(a.fields.created);
          bValue = new Date(b.fields.created);
          break;
        case 'updated':
          aValue = new Date(a.fields.updated);
          bValue = new Date(b.fields.updated);
          break;
        case 'priority':
          // Priority order: Highest, High, Medium, Low, Lowest
          const priorityOrder = { 'Highest': 5, 'High': 4, 'Medium': 3, 'Low': 2, 'Lowest': 1 };
          aValue = priorityOrder[a.fields.priority.name as keyof typeof priorityOrder] || 0;
          bValue = priorityOrder[b.fields.priority.name as keyof typeof priorityOrder] || 0;
          break;
        case 'status':
          aValue = a.fields.status.name;
          bValue = b.fields.status.name;
          break;
        case 'summary':
          aValue = a.fields.summary;
          bValue = b.fields.summary;
          break;
        default:
          aValue = a.fields.created;
          bValue = b.fields.created;
      }

      if (aValue < bValue) return sortDirection === 'asc' ? -1 : 1;
      if (aValue > bValue) return sortDirection === 'asc' ? 1 : -1;
      return 0;
    });

    return filtered;
  }, [tickets, filterStatus, filterPriority, sortField, sortDirection]);

  // Pagination
  const totalPages = Math.ceil(filteredAndSortedTickets.length / pageSize);
  const paginatedTickets = useMemo(() => {
    if (!showPagination) return filteredAndSortedTickets;
    
    const startIndex = (currentPage - 1) * pageSize;
    const endIndex = startIndex + pageSize;
    return filteredAndSortedTickets.slice(startIndex, endIndex);
  }, [filteredAndSortedTickets, currentPage, pageSize, showPagination]);

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('desc');
    }
  };

  const handleTicketClick = (ticket: JiraIssue) => {
    if (onTicketClick) {
      onTicketClick(ticket);
    } else {
      // Default behavior: open in Jira
      const jiraUrl = apiService.getJiraTicketUrl(ticket.key);
      window.open(jiraUrl, '_blank', 'noopener,noreferrer');
    }
  };

  const formatDate = (dateString: string): string => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getPriorityClass = (priority: string): string => {
    switch (priority.toLowerCase()) {
      case 'highest':
        return 'priority-highest';
      case 'high':
        return 'priority-high';
      case 'medium':
        return 'priority-medium';
      case 'low':
        return 'priority-low';
      case 'lowest':
        return 'priority-lowest';
      default:
        return 'priority-medium';
    }
  };

  const getStatusClass = (statusCategory: string): string => {
    switch (statusCategory.toLowerCase()) {
      case 'new':
      case 'indeterminate':
        return 'status-new';
      case 'done':
        return 'status-done';
      default:
        return 'status-progress';
    }
  };

  if (loading) {
    return (
      <div className="jira-tickets-list">
        <div className="tickets-header">
          <h3>{title}</h3>
          <div className="jira-badge">
            <span>Data from Jira</span>
          </div>
        </div>
        <div className="loading-state">
          <div className="loading-spinner"></div>
          <p>Loading tickets from Jira...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="jira-tickets-list">
        <div className="tickets-header">
          <h3>{title}</h3>
          <div className="jira-badge">
            <span>Data from Jira</span>
          </div>
        </div>
        <div className="error-state">
          <p>Could not load ticket data from Jira</p>
          <p className="error-details">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="jira-tickets-list">
      <div className="tickets-header">
        <h3>{title}</h3>
        <div className="jira-badge">
          <span>Data from Jira</span>
        </div>
      </div>

      {/* Filters */}
      <div className="tickets-filters">
        <div className="filter-group">
          <label>Status:</label>
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
          >
            <option value="">All Statuses</option>
            {uniqueStatuses.map(status => (
              <option key={status} value={status}>{status}</option>
            ))}
          </select>
        </div>
        <div className="filter-group">
          <label>Priority:</label>
          <select
            value={filterPriority}
            onChange={(e) => setFilterPriority(e.target.value)}
          >
            <option value="">All Priorities</option>
            {uniquePriorities.map(priority => (
              <option key={priority} value={priority}>{priority}</option>
            ))}
          </select>
        </div>
        <div className="results-count">
          {filteredAndSortedTickets.length} ticket{filteredAndSortedTickets.length !== 1 ? 's' : ''}
        </div>
      </div>

      {/* Tickets Table */}
      <div className="tickets-table-container" style={{ maxHeight }}>
        {paginatedTickets.length === 0 ? (
          <div className="empty-state">
            <p>No tickets found matching the current filters.</p>
          </div>
        ) : (
          <table className="tickets-table">
            <thead>
              <tr>
                <th 
                  className={`sortable ${sortField === 'summary' ? `sorted-${sortDirection}` : ''}`}
                  onClick={() => handleSort('summary')}
                >
                  Summary
                </th>
                <th 
                  className={`sortable ${sortField === 'status' ? `sorted-${sortDirection}` : ''}`}
                  onClick={() => handleSort('status')}
                >
                  Status
                </th>
                <th 
                  className={`sortable ${sortField === 'priority' ? `sorted-${sortDirection}` : ''}`}
                  onClick={() => handleSort('priority')}
                >
                  Priority
                </th>
                <th>Assignee</th>
                <th 
                  className={`sortable ${sortField === 'created' ? `sorted-${sortDirection}` : ''}`}
                  onClick={() => handleSort('created')}
                >
                  Created
                </th>
                <th 
                  className={`sortable ${sortField === 'updated' ? `sorted-${sortDirection}` : ''}`}
                  onClick={() => handleSort('updated')}
                >
                  Updated
                </th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {paginatedTickets.map((ticket) => (
                <tr key={ticket.id} className="ticket-row">
                  <td className="ticket-summary">
                    <div className="summary-content">
                      <span className="ticket-key">{ticket.key}</span>
                      <span className="ticket-title">{ticket.fields.summary}</span>
                    </div>
                  </td>
                  <td>
                    <span className={`status-badge ${getStatusClass(ticket.fields.status.statusCategory.key)}`}>
                      {ticket.fields.status.name}
                    </span>
                  </td>
                  <td>
                    <span className={`priority-badge ${getPriorityClass(ticket.fields.priority.name)}`}>
                      {ticket.fields.priority.name}
                    </span>
                  </td>
                  <td className="assignee">
                    {ticket.fields.assignee ? ticket.fields.assignee.displayName : 'Unassigned'}
                  </td>
                  <td className="date-cell">
                    {formatDate(ticket.fields.created)}
                  </td>
                  <td className="date-cell">
                    {formatDate(ticket.fields.updated)}
                  </td>
                  <td className="actions-cell">
                    <button
                      className="view-in-jira-btn"
                      onClick={() => handleTicketClick(ticket)}
                      title="View in Jira"
                    >
                      View
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Pagination */}
      {showPagination && totalPages > 1 && (
        <div className="pagination">
          <button
            className="pagination-btn"
            onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
            disabled={currentPage === 1}
          >
            Previous
          </button>
          <span className="pagination-info">
            Page {currentPage} of {totalPages}
          </span>
          <button
            className="pagination-btn"
            onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
            disabled={currentPage === totalPages}
          >
            Next
          </button>
        </div>
      )}
    </div>
  );
};

export default JiraTicketsList; 