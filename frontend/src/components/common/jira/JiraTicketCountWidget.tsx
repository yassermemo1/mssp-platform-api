import React, { useState, useEffect } from 'react';
import { TicketCounts, TicketFilters, JiraDataState } from '../../../types/jira';
import { apiService } from '../../../services/apiService';
import JiraTicketModal from './JiraTicketModal';
import './JiraTicketCountWidget.css';

interface JiraTicketCountWidgetProps {
  clientId?: string; // If provided, shows client-specific data
  title?: string;
  jiraBaseUrl?: string;
  refreshInterval?: number; // Auto-refresh interval in milliseconds
}

/**
 * JiraTicketCountWidget Component
 * Displays ticket counts with drill-down capabilities
 */
const JiraTicketCountWidget: React.FC<JiraTicketCountWidgetProps> = ({
  clientId,
  title = 'Ticket Overview',
  jiraBaseUrl,
  refreshInterval = 300000 // 5 minutes default
}) => {
  const [ticketCounts, setTicketCounts] = useState<TicketCounts | null>(null);
  const [dataState, setDataState] = useState<JiraDataState>({
    loading: true,
    error: null
  });
  const [modal, setModal] = useState<{
    isOpen: boolean;
    title: string;
    filters: TicketFilters;
  }>({
    isOpen: false,
    title: '',
    filters: {}
  });

  /**
   * Fetch ticket counts from the backend
   */
  const fetchTicketCounts = async () => {
    try {
      setDataState(prev => ({ ...prev, loading: true, error: null }));

      let endpoint: string;
      if (clientId) {
        endpoint = `/jira/clients/${clientId}/ticket-counts`;
      } else {
        endpoint = '/jira/global-ticket-summary';
      }

      const data = await apiService.get<TicketCounts>(endpoint);
      setTicketCounts(data);
      setDataState({
        loading: false,
        error: null,
        lastUpdated: new Date()
      });
    } catch (err: any) {
      setDataState({
        loading: false,
        error: err.message || 'Failed to load ticket data from Jira',
        lastUpdated: new Date()
      });
      console.error('Error fetching Jira ticket counts:', err);
    }
  };

  useEffect(() => {
    fetchTicketCounts();

    // Set up auto-refresh if interval is provided
    if (refreshInterval > 0) {
      const interval = setInterval(fetchTicketCounts, refreshInterval);
      return () => clearInterval(interval);
    }
  }, [clientId, refreshInterval]);

  /**
   * Handle drill-down clicks
   */
  const handleDrillDown = (title: string, filters: TicketFilters) => {
    setModal({
      isOpen: true,
      title,
      filters
    });
  };

  /**
   * Close modal
   */
  const closeModal = () => {
    setModal(prev => ({ ...prev, isOpen: false }));
  };

  /**
   * Format last updated time
   */
  const formatLastUpdated = (date: Date): string => {
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    
    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    
    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `${diffHours}h ago`;
    
    return date.toLocaleDateString();
  };

  if (dataState.loading && !ticketCounts) {
    return (
      <div className="jira-widget-container">
        <div className="widget-header">
          <h3>{title}</h3>
          <span className="jira-badge">
            <img src="/jira-icon.svg" alt="Jira" className="jira-icon" />
            Jira
          </span>
        </div>
        <div className="widget-loading">
          <div className="loading-spinner"></div>
          <p>Loading ticket data...</p>
        </div>
      </div>
    );
  }

  if (dataState.error) {
    return (
      <div className="jira-widget-container">
        <div className="widget-header">
          <h3>{title}</h3>
          <span className="jira-badge">
            <img src="/jira-icon.svg" alt="Jira" className="jira-icon" />
            Jira
          </span>
        </div>
        <div className="widget-error">
          <p>{dataState.error}</p>
          <button onClick={fetchTicketCounts} className="retry-button">
            Retry
          </button>
        </div>
      </div>
    );
  }

  if (!ticketCounts) {
    return null;
  }

  return (
    <>
      <div className="jira-widget-container">
        <div className="widget-header">
          <div className="header-left">
            <h3>{title}</h3>
            <span className="jira-badge">
              <img src="/jira-icon.svg" alt="Jira" className="jira-icon" />
              Jira
            </span>
          </div>
          <div className="header-right">
            {dataState.lastUpdated && (
              <span className="last-updated">
                Updated {formatLastUpdated(dataState.lastUpdated)}
              </span>
            )}
            <button 
              onClick={fetchTicketCounts} 
              className="refresh-button"
              disabled={dataState.loading}
              title="Refresh data"
            >
              🔄
            </button>
          </div>
        </div>

        <div className="widget-content">
          {/* Total Tickets */}
          <div className="metric-card total-tickets">
            <div className="metric-value">{ticketCounts.total}</div>
            <div className="metric-label">Total Tickets</div>
          </div>

          {/* Status Breakdown */}
          <div className="metrics-section">
            <h4>By Status</h4>
            <div className="metrics-grid">
              <div 
                className="metric-item clickable"
                onClick={() => handleDrillDown('Open Tickets', { statusCategory: 'To Do' })}
              >
                <div className="metric-value status-open">{ticketCounts.byStatus.open}</div>
                <div className="metric-label">Open</div>
              </div>
              <div 
                className="metric-item clickable"
                onClick={() => handleDrillDown('In Progress Tickets', { statusCategory: 'In Progress' })}
              >
                <div className="metric-value status-progress">{ticketCounts.byStatus.inProgress}</div>
                <div className="metric-label">In Progress</div>
              </div>
              <div 
                className="metric-item clickable"
                onClick={() => handleDrillDown('Resolved Tickets', { statusCategory: 'Done' })}
              >
                <div className="metric-value status-resolved">{ticketCounts.byStatus.resolved}</div>
                <div className="metric-label">Resolved</div>
              </div>
              <div 
                className="metric-item clickable"
                onClick={() => handleDrillDown('Closed Tickets', { statusCategory: 'Done' })}
              >
                <div className="metric-value status-closed">{ticketCounts.byStatus.closed}</div>
                <div className="metric-label">Closed</div>
              </div>
            </div>
          </div>

          {/* Priority Breakdown */}
          <div className="metrics-section">
            <h4>By Priority</h4>
            <div className="metrics-grid">
              <div 
                className="metric-item clickable priority-critical"
                onClick={() => handleDrillDown('Critical Priority Tickets', { priority: 'Critical' })}
              >
                <div className="metric-value">{ticketCounts.byPriority.critical}</div>
                <div className="metric-label">Critical</div>
              </div>
              <div 
                className="metric-item clickable priority-high"
                onClick={() => handleDrillDown('High Priority Tickets', { priority: 'High' })}
              >
                <div className="metric-value">{ticketCounts.byPriority.high}</div>
                <div className="metric-label">High</div>
              </div>
              <div 
                className="metric-item clickable priority-medium"
                onClick={() => handleDrillDown('Medium Priority Tickets', { priority: 'Medium' })}
              >
                <div className="metric-value">{ticketCounts.byPriority.medium}</div>
                <div className="metric-label">Medium</div>
              </div>
              <div 
                className="metric-item clickable priority-low"
                onClick={() => handleDrillDown('Low Priority Tickets', { priority: 'Low' })}
              >
                <div className="metric-value">{ticketCounts.byPriority.low}</div>
                <div className="metric-label">Low</div>
              </div>
            </div>
          </div>

          {/* SLA Breaches */}
          {ticketCounts.breached.total > 0 && (
            <div className="metrics-section">
              <h4>SLA Status</h4>
              <div className="sla-breach-alert">
                <div className="breach-icon">⚠️</div>
                <div className="breach-info">
                  <div className="breach-count">{ticketCounts.breached.total}</div>
                  <div className="breach-label">SLA Breaches</div>
                </div>
                <button 
                  className="view-breaches-button"
                  onClick={() => handleDrillDown('SLA Breached Tickets', {})}
                >
                  View Details
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Drill-down Modal */}
      <JiraTicketModal
        isOpen={modal.isOpen}
        onClose={closeModal}
        title={modal.title}
        clientId={clientId}
        filters={modal.filters}
        jiraBaseUrl={jiraBaseUrl}
      />
    </>
  );
};

export default JiraTicketCountWidget; 