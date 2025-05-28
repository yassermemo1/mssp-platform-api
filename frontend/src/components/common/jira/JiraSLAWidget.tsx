import React, { useState, useEffect } from 'react';
import { SLASummary, TicketFilters, JiraDataState } from '../../../types/jira';
import { apiService } from '../../../services/apiService';
import JiraTicketModal from './JiraTicketModal';
import './JiraSLAWidget.css';

interface JiraSLAWidgetProps {
  clientId?: string; // If provided, shows client-specific data
  title?: string;
  jiraBaseUrl?: string;
  refreshInterval?: number; // Auto-refresh interval in milliseconds
}

/**
 * JiraSLAWidget Component
 * Displays SLA metrics with drill-down capabilities
 */
const JiraSLAWidget: React.FC<JiraSLAWidgetProps> = ({
  clientId,
  title = 'SLA Performance',
  jiraBaseUrl,
  refreshInterval = 300000 // 5 minutes default
}) => {
  const [slaSummary, setSlaSummary] = useState<SLASummary | null>(null);
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
   * Fetch SLA summary from the backend
   */
  const fetchSLASummary = async () => {
    try {
      setDataState(prev => ({ ...prev, loading: true, error: null }));

      let endpoint: string;
      if (clientId) {
        endpoint = `/jira/clients/${clientId}/sla-summary`;
      } else {
        // Global SLA summary would need to be implemented
        endpoint = '/jira/global-sla-summary';
      }

      const data = await apiService.get<SLASummary>(endpoint);
      setSlaSummary(data);
      setDataState({
        loading: false,
        error: null,
        lastUpdated: new Date()
      });
    } catch (err: any) {
      setDataState({
        loading: false,
        error: err.message || 'Failed to load SLA data from Jira',
        lastUpdated: new Date()
      });
      console.error('Error fetching Jira SLA summary:', err);
    }
  };

  useEffect(() => {
    fetchSLASummary();

    // Set up auto-refresh if interval is provided
    if (refreshInterval > 0) {
      const interval = setInterval(fetchSLASummary, refreshInterval);
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
   * Format time duration
   */
  const formatDuration = (milliseconds: number): string => {
    const hours = Math.floor(milliseconds / (1000 * 60 * 60));
    const minutes = Math.floor((milliseconds % (1000 * 60 * 60)) / (1000 * 60));
    
    if (hours > 24) {
      const days = Math.floor(hours / 24);
      const remainingHours = hours % 24;
      return `${days}d ${remainingHours}h`;
    }
    
    if (hours > 0) {
      return `${hours}h ${minutes}m`;
    }
    
    return `${minutes}m`;
  };

  /**
   * Format percentage
   */
  const formatPercentage = (value: number): string => {
    return `${Math.round(value * 10) / 10}%`;
  };

  /**
   * Get compliance status class
   */
  const getComplianceClass = (rate: number): string => {
    if (rate >= 95) return 'compliance-excellent';
    if (rate >= 85) return 'compliance-good';
    if (rate >= 70) return 'compliance-warning';
    return 'compliance-poor';
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

  if (dataState.loading && !slaSummary) {
    return (
      <div className="jira-sla-widget-container">
        <div className="widget-header">
          <h3>{title}</h3>
          <span className="jira-badge">
            <img src="/jira-icon.svg" alt="Jira" className="jira-icon" />
            Jira
          </span>
        </div>
        <div className="widget-loading">
          <div className="loading-spinner"></div>
          <p>Loading SLA data...</p>
        </div>
      </div>
    );
  }

  if (dataState.error) {
    return (
      <div className="jira-sla-widget-container">
        <div className="widget-header">
          <h3>{title}</h3>
          <span className="jira-badge">
            <img src="/jira-icon.svg" alt="Jira" className="jira-icon" />
            Jira
          </span>
        </div>
        <div className="widget-error">
          <p>{dataState.error}</p>
          <button onClick={fetchSLASummary} className="retry-button">
            Retry
          </button>
        </div>
      </div>
    );
  }

  if (!slaSummary) {
    return null;
  }

  return (
    <>
      <div className="jira-sla-widget-container">
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
              onClick={fetchSLASummary} 
              className="refresh-button"
              disabled={dataState.loading}
              title="Refresh data"
            >
              🔄
            </button>
          </div>
        </div>

        <div className="widget-content">
          {/* Overall SLA Metrics */}
          <div className="sla-overview">
            <div className="sla-metric-card">
              <div className="sla-metric-header">
                <h4>Time to First Response</h4>
                <div className={`compliance-badge ${getComplianceClass(slaSummary.timeToFirstResponse.achievementRate)}`}>
                  {formatPercentage(slaSummary.timeToFirstResponse.achievementRate)}
                </div>
              </div>
              <div className="sla-metric-details">
                <div className="metric-row">
                  <span>Average Response Time:</span>
                  <span>{formatDuration(slaSummary.timeToFirstResponse.averageResponseTime || slaSummary.timeToFirstResponse.averageTime)}</span>
                </div>
                <div className="metric-row">
                  <span>Currently Breached:</span>
                  <span 
                    className={(slaSummary.timeToFirstResponse.currentlyBreached || slaSummary.timeToFirstResponse.breached) > 0 ? 'breach-count clickable' : 'breach-count'}
                    onClick={() => (slaSummary.timeToFirstResponse.currentlyBreached || slaSummary.timeToFirstResponse.breached) > 0 && 
                      handleDrillDown('Response Time SLA Breaches', {})}
                  >
                    {slaSummary.timeToFirstResponse.currentlyBreached || slaSummary.timeToFirstResponse.breached}
                  </span>
                </div>
                <div className="metric-row">
                  <span>At Risk:</span>
                  <span className="risk-count">{slaSummary.timeToFirstResponse.atRisk || 0}</span>
                </div>
              </div>
            </div>

            <div className="sla-metric-card">
              <div className="sla-metric-header">
                <h4>Time to Resolution</h4>
                <div className={`compliance-badge ${getComplianceClass(slaSummary.timeToResolution.achievementRate)}`}>
                  {formatPercentage(slaSummary.timeToResolution.achievementRate)}
                </div>
              </div>
              <div className="sla-metric-details">
                <div className="metric-row">
                  <span>Average Resolution Time:</span>
                  <span>{formatDuration(slaSummary.timeToResolution.averageResolutionTime || slaSummary.timeToResolution.averageTime)}</span>
                </div>
                <div className="metric-row">
                  <span>Currently Breached:</span>
                  <span 
                    className={(slaSummary.timeToResolution.currentlyBreached || slaSummary.timeToResolution.breached) > 0 ? 'breach-count clickable' : 'breach-count'}
                    onClick={() => (slaSummary.timeToResolution.currentlyBreached || slaSummary.timeToResolution.breached) > 0 && 
                      handleDrillDown('Resolution Time SLA Breaches', {})}
                  >
                    {slaSummary.timeToResolution.currentlyBreached || slaSummary.timeToResolution.breached}
                  </span>
                </div>
                <div className="metric-row">
                  <span>At Risk:</span>
                  <span className="risk-count">{slaSummary.timeToResolution.atRisk || 0}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Priority Breakdown */}
          {slaSummary.byPriority && (
            <div className="priority-breakdown">
              <h4>SLA Performance by Priority</h4>
              <div className="priority-grid">
                {Object.entries(slaSummary.byPriority).map(([priority, data]) => (
                  data && (
                    <div 
                      key={priority} 
                      className={`priority-card priority-${priority} ${data.total > 0 ? 'clickable' : ''}`}
                      onClick={() => data.total > 0 && handleDrillDown(`${priority.charAt(0).toUpperCase() + priority.slice(1)} Priority Tickets`, { priority: priority.charAt(0).toUpperCase() + priority.slice(1) })}
                    >
                      <div className="priority-header">
                        <span className="priority-name">{priority.charAt(0).toUpperCase() + priority.slice(1)}</span>
                        <span className="priority-count">{data.total}</span>
                      </div>
                      {data.total > 0 && (
                        <div className="priority-details">
                          <div className="priority-metric">
                            <span>Breached:</span>
                            <span className={data.breached > 0 ? 'breach-indicator' : ''}>{data.breached}</span>
                          </div>
                          <div className="priority-metric">
                            <span>Avg Response:</span>
                            <span>{formatDuration(data.averageResponseTime)}</span>
                          </div>
                        </div>
                      )}
                    </div>
                  )
                ))}
              </div>
            </div>
          )}

          {/* Trends */}
          {slaSummary.trends && (
            <div className="trends-section">
              <h4>Recent Trends</h4>
              <div className="trends-grid">
                {slaSummary.trends.last7Days && (
                  <div className="trend-card">
                    <div className="trend-period">Last 7 Days</div>
                    <div className="trend-metrics">
                      <div className="trend-metric">
                        <span>Created:</span>
                        <span>{slaSummary.trends.last7Days.ticketsCreated}</span>
                      </div>
                      <div className="trend-metric">
                        <span>Resolved:</span>
                        <span>{slaSummary.trends.last7Days.ticketsResolved}</span>
                      </div>
                      <div className="trend-metric">
                        <span>SLA Breaches:</span>
                        <span className={slaSummary.trends.last7Days.slaBreaches > 0 ? 'breach-indicator' : ''}>
                          {slaSummary.trends.last7Days.slaBreaches}
                        </span>
                      </div>
                    </div>
                  </div>
                )}

                {slaSummary.trends.last30Days && (
                  <div className="trend-card">
                    <div className="trend-period">Last 30 Days</div>
                    <div className="trend-metrics">
                      <div className="trend-metric">
                        <span>Created:</span>
                        <span>{slaSummary.trends.last30Days.ticketsCreated}</span>
                      </div>
                      <div className="trend-metric">
                        <span>Resolved:</span>
                        <span>{slaSummary.trends.last30Days.ticketsResolved}</span>
                      </div>
                      <div className="trend-metric">
                        <span>SLA Breaches:</span>
                        <span className={slaSummary.trends.last30Days.slaBreaches > 0 ? 'breach-indicator' : ''}>
                          {slaSummary.trends.last30Days.slaBreaches}
                        </span>
                      </div>
                    </div>
                  </div>
                )}
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

export default JiraSLAWidget; 