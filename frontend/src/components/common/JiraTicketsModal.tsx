import React, { useState, useEffect } from 'react';
import { JiraIssue } from '../../types/jira';
import { apiService } from '../../services/apiService';
import JiraTicketsList from './JiraTicketsList';
import './JiraTicketsModal.css';

interface JiraTicketsModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  clientId?: string;
  status?: string;
  priority?: string;
  slaType?: 'firstResponse' | 'resolution';
  breached?: boolean;
}

/**
 * JiraTicketsModal Component
 * Modal for displaying detailed ticket lists with drill-down functionality
 */
const JiraTicketsModal: React.FC<JiraTicketsModalProps> = ({
  isOpen,
  onClose,
  title,
  clientId,
  status,
  priority,
  slaType,
  breached,
}) => {
  const [tickets, setTickets] = useState<JiraIssue[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      fetchTickets();
    }
  }, [isOpen, clientId, status, priority, slaType, breached]);

  const fetchTickets = async () => {
    setLoading(true);
    setError(null);

    try {
      let fetchedTickets: JiraIssue[] = [];

      if (breached && slaType) {
        // Fetch SLA breached tickets
        fetchedTickets = await apiService.getJiraSLABreachedTickets(clientId);
      } else if (priority === 'high') {
        // Fetch high priority tickets
        fetchedTickets = await apiService.getJiraHighPriorityTickets(clientId);
      } else if (status && status !== 'all') {
        // Fetch tickets by status
        const statusMap: Record<string, string> = {
          'open': 'Open',
          'in-progress': 'In Progress',
          'resolved': 'Resolved',
          'closed': 'Closed',
        };
        const jiraStatus = statusMap[status] || status;
        fetchedTickets = await apiService.getJiraTicketsByStatus(jiraStatus, clientId);
      } else if (clientId) {
        // Fetch all tickets for client
        fetchedTickets = await apiService.getJiraClientTickets(clientId);
      } else {
        // Fetch recent tickets
        fetchedTickets = await apiService.getJiraRecentTickets(100);
      }

      // Apply additional filtering if needed
      if (priority && priority !== 'high') {
        const priorityMap: Record<string, string[]> = {
          'highest': ['Highest'],
          'high': ['High', 'Highest'],
          'medium': ['Medium'],
          'low': ['Low', 'Lowest'],
        };
        const allowedPriorities = priorityMap[priority.toLowerCase()] || [priority];
        fetchedTickets = fetchedTickets.filter(ticket => 
          allowedPriorities.includes(ticket.fields.priority.name)
        );
      }

      setTickets(fetchedTickets);
    } catch (err) {
      console.error('Error fetching tickets:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch tickets');
    } finally {
      setLoading(false);
    }
  };

  const handleTicketClick = (ticket: JiraIssue) => {
    // Open ticket in Jira
    const jiraUrl = apiService.getJiraTicketUrl(ticket.key);
    window.open(jiraUrl, '_blank', 'noopener,noreferrer');
  };

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  const handleKeyDown = (e: KeyboardEvent) => {
    if (e.key === 'Escape') {
      onClose();
    }
  };

  useEffect(() => {
    if (isOpen) {
      document.addEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'hidden';
    } else {
      document.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'unset';
    }

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  if (!isOpen) {
    return null;
  }

  return (
    <div className="jira-tickets-modal-overlay" onClick={handleBackdropClick}>
      <div className="jira-tickets-modal">
        <div className="modal-header">
          <h2>{title}</h2>
          <button 
            className="close-button"
            onClick={onClose}
            aria-label="Close modal"
          >
            ×
          </button>
        </div>

        <div className="modal-content">
          <JiraTicketsList
            tickets={tickets}
            loading={loading}
            error={error}
            title=""
            onTicketClick={handleTicketClick}
            maxHeight="60vh"
            showPagination={true}
            pageSize={20}
          />
        </div>

        <div className="modal-footer">
          <div className="ticket-count">
            {!loading && !error && (
              <span>{tickets.length} ticket{tickets.length !== 1 ? 's' : ''} found</span>
            )}
          </div>
          <div className="modal-actions">
            <button className="btn-secondary" onClick={onClose}>
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default JiraTicketsModal; 