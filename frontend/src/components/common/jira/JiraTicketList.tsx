import React, { useState, useEffect } from 'react';
import { JiraTicket, TicketFilters, PaginationParams, JiraTicketsResponse } from '../../../types/jira';
import { apiService } from '../../../services/apiService';
import './JiraTicketList.css';

interface JiraTicketListProps {
  clientId?: string; // If provided, shows client-specific tickets
  filters?: TicketFilters;
  initialPagination?: PaginationParams;
  showClientColumn?: boolean; // For global views
  jiraBaseUrl?: string; // For direct links to Jira
}

/**
 * JiraTicketList Component
 * Displays a paginated list of Jira tickets with filtering and direct links
 */
const JiraTicketList: React.FC<JiraTicketListProps> = ({
  clientId,
  filters = {},
  initialPagination = { maxResults: 50, startAt: 0 },
  showClientColumn = false,
  jiraBaseUrl
}) => {
  const [tickets, setTickets] = useState<JiraTicket[]>([]);
  const [total, setTotal] = useState<number>(0);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [pagination, setPagination] = useState<PaginationParams>(initialPagination);
  const [currentFilters, setCurrentFilters] = useState<TicketFilters>(filters);

  /**
   * Fetch tickets from the backend
   */
  const fetchTickets = async () => {
    try {
      setLoading(true);
      setError(null);

      let endpoint: string;
      let params: Record<string, string> = {
        maxResults: pagination.maxResults.toString(),
        startAt: pagination.startAt.toString()
      };

      if (currentFilters.statusCategory) {
        params.statusCategory = currentFilters.statusCategory;
      }
      if (currentFilters.priority) {
        params.priority = currentFilters.priority;
      }

      if (clientId) {
        // Client-specific tickets
        endpoint = `/jira/clients/${clientId}/tickets`;
      } else {
        // Global tickets (would need to be implemented in backend)
        endpoint = '/jira/global-tickets';
      }

      const queryString = new URLSearchParams(params).toString();
      const response = await apiService.get<JiraTicketsResponse>(`${endpoint}?${queryString}`);
      
      setTickets(response.tickets);
      setTotal(response.total);
    } catch (err: any) {
      setError(err.message || 'Failed to load Jira tickets');
      console.error('Error fetching Jira tickets:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTickets();
  }, [clientId, pagination, currentFilters]);

  /**
   * Handle pagination changes
   */
  const handlePageChange = (newStartAt: number) => {
    setPagination(prev => ({ ...prev, startAt: newStartAt }));
  };

  /**
   * Handle filter changes
   */
  const handleFilterChange = (newFilters: TicketFilters) => {
    setCurrentFilters(newFilters);
    setPagination(prev => ({ ...prev, startAt: 0 })); // Reset to first page
  };

  /**
   * Get priority badge class
   */
  const getPriorityClass = (priority: string): string => {
    switch (priority.toLowerCase()) {
      case 'critical':
      case 'highest':
        return 'priority-critical';
      case 'high':
        return 'priority-high';
      case 'medium':
        return 'priority-medium';
      case 'low':
      case 'lowest':
        return 'priority-low';
      default:
        return 'priority-default';
    }
  };

  /**
   * Get status badge class
   */
  const getStatusClass = (statusCategory: string): string => {
    switch (statusCategory.toLowerCase()) {
      case 'to do':
        return 'status-todo';
      case 'in progress':
        return 'status-inprogress';
      case 'done':
        return 'status-done';
      default:
        return 'status-default';
    }
  };

  /**
   * Format date for display
   */
  const formatDate = (dateString: string): string => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  /**
   * Generate Jira ticket URL
   */
  const getJiraTicketUrl = (ticketKey: string): string | null => {
    if (!jiraBaseUrl) return null;
    return `${jiraBaseUrl}/browse/${ticketKey}`;
  };

  /**
   * Check if ticket has SLA breach
   */
  const hasSlaBreach = (ticket: JiraTicket): boolean => {
    const now = new Date();
    
    // Check Time to First Response breach
    if (ticket.slaFields?.timeToFirstResponse?.ongoingCycle?.breachTime) {
      const breachTime = new Date(ticket.slaFields.timeToFirstResponse.ongoingCycle.breachTime.epochMillis);
      if (breachTime < now) return true;
    }
    
    // Check Time to Resolution breach
    if (ticket.slaFields?.timeToResolution?.ongoingCycle?.breachTime) {
      const breachTime = new Date(ticket.slaFields.timeToResolution.ongoingCycle.breachTime.epochMillis);
      if (breachTime < now) return true;
    }
    
    return false;
  };

  if (loading) {
    return (
      <div className="jira-ticket-list-container">
        <div className="loading-container">
          <div className="loading-spinner"></div>
          <p>Loading Jira tickets...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="jira-ticket-list-container">
        <div className="error-container">
          <h4>Unable to Load Jira Tickets</h4>
          <p>{error}</p>
          <button onClick={fetchTickets} className="retry-button">
            Try Again
          </button>
        </div>
      </div>
    );
  }

  const totalPages = Math.ceil(total / pagination.maxResults);
  const currentPage = Math.floor(pagination.startAt / pagination.maxResults) + 1;

  return (
    <div className="jira-ticket-list-container">
      <div className="jira-ticket-list-header">
        <div className="header-info">
          <h3>
            Jira Tickets 
            <span className="jira-badge">
              <img src="/jira-icon.svg" alt="Jira" className="jira-icon" />
              Data from Jira
            </span>
          </h3>
          <p className="ticket-count">
            Showing {pagination.startAt + 1}-{Math.min(pagination.startAt + pagination.maxResults, total)} of {total} tickets
          </p>
        </div>

        {/* Filters */}
        <div className="ticket-filters">
          <select
            value={currentFilters.statusCategory || ''}
            onChange={(e) => handleFilterChange({ ...currentFilters, statusCategory: e.target.value || undefined })}
            className="filter-select"
          >
            <option value="">All Statuses</option>
            <option value="To Do">To Do</option>
            <option value="In Progress">In Progress</option>
            <option value="Done">Done</option>
          </select>

          <select
            value={currentFilters.priority || ''}
            onChange={(e) => handleFilterChange({ ...currentFilters, priority: e.target.value || undefined })}
            className="filter-select"
          >
            <option value="">All Priorities</option>
            <option value="Critical">Critical</option>
            <option value="High">High</option>
            <option value="Medium">Medium</option>
            <option value="Low">Low</option>
          </select>
        </div>
      </div>

      {tickets.length === 0 ? (
        <div className="no-tickets">
          <p>No tickets found matching the current filters.</p>
        </div>
      ) : (
        <>
          <div className="ticket-table-container">
            <table className="ticket-table">
              <thead>
                <tr>
                  <th>Key</th>
                  <th>Summary</th>
                  <th>Status</th>
                  <th>Priority</th>
                  <th>Assignee</th>
                  <th>Created</th>
                  <th>Updated</th>
                  <th>SLA</th>
                  {jiraBaseUrl && <th>Actions</th>}
                </tr>
              </thead>
              <tbody>
                {tickets.map((ticket) => (
                  <tr key={ticket.key} className={hasSlaBreach(ticket) ? 'sla-breach' : ''}>
                    <td className="ticket-key">
                      <strong>{ticket.key}</strong>
                    </td>
                    <td className="ticket-summary">
                      <span title={ticket.summary}>
                        {ticket.summary.length > 60 
                          ? `${ticket.summary.substring(0, 60)}...` 
                          : ticket.summary
                        }
                      </span>
                    </td>
                    <td>
                      <span className={`status-badge ${getStatusClass(ticket.status.statusCategory.name)}`}>
                        {ticket.status.name}
                      </span>
                    </td>
                    <td>
                      <span className={`priority-badge ${getPriorityClass(ticket.priority.name)}`}>
                        {ticket.priority.name}
                      </span>
                    </td>
                    <td className="assignee">
                      {ticket.assignee ? ticket.assignee.displayName : 'Unassigned'}
                    </td>
                    <td className="date-cell">
                      {formatDate(ticket.created)}
                    </td>
                    <td className="date-cell">
                      {formatDate(ticket.updated)}
                    </td>
                    <td className="sla-cell">
                      {hasSlaBreach(ticket) && (
                        <span className="sla-breach-indicator" title="SLA Breach">
                          ⚠️
                        </span>
                      )}
                    </td>
                    {jiraBaseUrl && (
                      <td className="actions-cell">
                        <a
                          href={getJiraTicketUrl(ticket.key)!}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="jira-link"
                          title="View in Jira"
                        >
                          View in Jira
                        </a>
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="pagination-container">
              <button
                onClick={() => handlePageChange(pagination.startAt - pagination.maxResults)}
                disabled={pagination.startAt === 0}
                className="pagination-button"
              >
                Previous
              </button>
              
              <span className="pagination-info">
                Page {currentPage} of {totalPages}
              </span>
              
              <button
                onClick={() => handlePageChange(pagination.startAt + pagination.maxResults)}
                disabled={pagination.startAt + pagination.maxResults >= total}
                className="pagination-button"
              >
                Next
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default JiraTicketList; 