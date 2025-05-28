import React from 'react';
import { TicketSummary, SLASummary } from '../../types/jira';
import './JiraMetricsCards.css';

interface JiraMetricsCardsProps {
  ticketSummary?: TicketSummary | null;
  slaSummary?: SLASummary | null;
  loading?: boolean;
  error?: string | null;
  onTicketClick?: (status: string, priority?: string) => void;
  onSLAClick?: (type: 'firstResponse' | 'resolution', breached?: boolean) => void;
  showClientId?: boolean;
}

/**
 * JiraMetricsCards Component
 * Displays ticket and SLA metrics in card format for dashboards
 */
const JiraMetricsCards: React.FC<JiraMetricsCardsProps> = ({
  ticketSummary,
  slaSummary,
  loading = false,
  error = null,
  onTicketClick,
  onSLAClick,
  showClientId = false,
}) => {
  const formatPercentage = (value: number): string => {
    return `${Math.round(value * 100)}%`;
  };

  const formatTime = (milliseconds: number): string => {
    const hours = Math.floor(milliseconds / (1000 * 60 * 60));
    const minutes = Math.floor((milliseconds % (1000 * 60 * 60)) / (1000 * 60));
    
    if (hours > 24) {
      const days = Math.floor(hours / 24);
      const remainingHours = hours % 24;
      return `${days}d ${remainingHours}h`;
    } else if (hours > 0) {
      return `${hours}h ${minutes}m`;
    } else {
      return `${minutes}m`;
    }
  };

  const handleTicketCardClick = (status: string, priority?: string) => {
    if (onTicketClick) {
      onTicketClick(status, priority);
    }
  };

  const handleSLACardClick = (type: 'firstResponse' | 'resolution', breached?: boolean) => {
    if (onSLAClick) {
      onSLAClick(type, breached);
    }
  };

  if (loading) {
    return (
      <div className="jira-metrics-cards">
        <div className="metrics-header">
          <h3>Ticket & SLA Metrics</h3>
          <div className="jira-badge">
            <span>Data from Jira</span>
          </div>
        </div>
        <div className="loading-state">
          <div className="loading-spinner"></div>
          <p>Loading metrics from Jira...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="jira-metrics-cards">
        <div className="metrics-header">
          <h3>Ticket & SLA Metrics</h3>
          <div className="jira-badge">
            <span>Data from Jira</span>
          </div>
        </div>
        <div className="error-state">
          <p>Could not load metrics from Jira</p>
          <p className="error-details">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="jira-metrics-cards">
      <div className="metrics-header">
        <h3>Ticket & SLA Metrics</h3>
        <div className="jira-badge">
          <span>Data from Jira</span>
        </div>
      </div>

      {showClientId && ticketSummary?.clientId && (
        <div className="client-info">
          <span>Client: {ticketSummary.clientId}</span>
        </div>
      )}

      <div className="metrics-grid">
        {/* Ticket Summary Cards */}
        {ticketSummary && (
          <>
            {/* Total Tickets */}
            <div 
              className="metric-card clickable"
              onClick={() => handleTicketCardClick('all')}
            >
              <div className="metric-value">{ticketSummary.totalTickets}</div>
              <div className="metric-label">Total Tickets</div>
              <div className="metric-trend">All statuses</div>
            </div>

            {/* Open Tickets */}
            <div 
              className="metric-card clickable status-open"
              onClick={() => handleTicketCardClick('open')}
            >
              <div className="metric-value">{ticketSummary.openTickets}</div>
              <div className="metric-label">Open Tickets</div>
              <div className="metric-trend">
                {ticketSummary.totalTickets > 0 
                  ? formatPercentage(ticketSummary.openTickets / ticketSummary.totalTickets)
                  : '0%'
                } of total
              </div>
            </div>

            {/* In Progress Tickets */}
            <div 
              className="metric-card clickable status-progress"
              onClick={() => handleTicketCardClick('in-progress')}
            >
              <div className="metric-value">{ticketSummary.inProgressTickets}</div>
              <div className="metric-label">In Progress</div>
              <div className="metric-trend">
                {ticketSummary.totalTickets > 0 
                  ? formatPercentage(ticketSummary.inProgressTickets / ticketSummary.totalTickets)
                  : '0%'
                } of total
              </div>
            </div>

            {/* Resolved Tickets */}
            <div 
              className="metric-card clickable status-resolved"
              onClick={() => handleTicketCardClick('resolved')}
            >
              <div className="metric-value">{ticketSummary.resolvedTickets}</div>
              <div className="metric-label">Resolved</div>
              <div className="metric-trend">
                {ticketSummary.totalTickets > 0 
                  ? formatPercentage(ticketSummary.resolvedTickets / ticketSummary.totalTickets)
                  : '0%'
                } of total
              </div>
            </div>

            {/* High Priority Tickets */}
            {(ticketSummary.byPriority['High'] || ticketSummary.byPriority['Highest']) && (
              <div 
                className="metric-card clickable priority-high"
                onClick={() => handleTicketCardClick('all', 'high')}
              >
                <div className="metric-value">
                  {(ticketSummary.byPriority['High'] || 0) + (ticketSummary.byPriority['Highest'] || 0)}
                </div>
                <div className="metric-label">High Priority</div>
                <div className="metric-trend">Needs attention</div>
              </div>
            )}
          </>
        )}

        {/* SLA Summary Cards */}
        {slaSummary && (
          <>
            {/* Time to First Response */}
            <div 
              className="metric-card sla-card clickable"
              onClick={() => handleSLACardClick('firstResponse')}
            >
              <div className="metric-value">
                {formatPercentage(slaSummary.timeToFirstResponse.achievementRate)}
              </div>
              <div className="metric-label">First Response SLA</div>
              <div className="metric-trend">
                {slaSummary.timeToFirstResponse.achieved} achieved, {slaSummary.timeToFirstResponse.breached} breached
              </div>
              <div className="metric-detail">
                Avg: {formatTime(slaSummary.timeToFirstResponse.averageTime)}
              </div>
            </div>

            {/* Time to Resolution */}
            <div 
              className="metric-card sla-card clickable"
              onClick={() => handleSLACardClick('resolution')}
            >
              <div className="metric-value">
                {formatPercentage(slaSummary.timeToResolution.achievementRate)}
              </div>
              <div className="metric-label">Resolution SLA</div>
              <div className="metric-trend">
                {slaSummary.timeToResolution.achieved} achieved, {slaSummary.timeToResolution.breached} breached
              </div>
              <div className="metric-detail">
                Avg: {formatTime(slaSummary.timeToResolution.averageTime)}
              </div>
            </div>

            {/* SLA Breaches */}
            {(slaSummary.timeToFirstResponse.breached > 0 || slaSummary.timeToResolution.breached > 0) && (
              <div 
                className="metric-card sla-breach clickable"
                onClick={() => handleSLACardClick('firstResponse', true)}
              >
                <div className="metric-value">
                  {slaSummary.timeToFirstResponse.breached + slaSummary.timeToResolution.breached}
                </div>
                <div className="metric-label">SLA Breaches</div>
                <div className="metric-trend">Requires immediate attention</div>
              </div>
            )}
          </>
        )}

        {/* Empty State */}
        {!ticketSummary && !slaSummary && (
          <div className="empty-state">
            <p>No ticket or SLA data available</p>
            <p className="empty-subtitle">Check your Jira integration configuration</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default JiraMetricsCards; 