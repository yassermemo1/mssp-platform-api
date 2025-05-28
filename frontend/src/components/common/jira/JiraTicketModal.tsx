import React from 'react';
import { TicketFilters } from '../../../types/jira';
import JiraTicketList from './JiraTicketList';
import './JiraTicketModal.css';

interface JiraTicketModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  clientId?: string;
  filters?: TicketFilters;
  jiraBaseUrl?: string;
}

/**
 * JiraTicketModal Component
 * Modal wrapper for displaying Jira tickets in drill-down scenarios
 */
const JiraTicketModal: React.FC<JiraTicketModalProps> = ({
  isOpen,
  onClose,
  title,
  clientId,
  filters,
  jiraBaseUrl
}) => {
  if (!isOpen) return null;

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      onClose();
    }
  };

  return (
    <div 
      className="jira-modal-backdrop" 
      onClick={handleBackdropClick}
      onKeyDown={handleKeyDown}
      tabIndex={-1}
    >
      <div className="jira-modal-container">
        <div className="jira-modal-header">
          <h2>{title}</h2>
          <button 
            className="jira-modal-close" 
            onClick={onClose}
            aria-label="Close modal"
          >
            ×
          </button>
        </div>
        
        <div className="jira-modal-content">
          <JiraTicketList
            clientId={clientId}
            filters={filters}
            initialPagination={{ maxResults: 25, startAt: 0 }}
            jiraBaseUrl={jiraBaseUrl}
          />
        </div>
      </div>
    </div>
  );
};

export default JiraTicketModal; 