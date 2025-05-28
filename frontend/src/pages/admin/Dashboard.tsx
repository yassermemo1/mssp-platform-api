import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { apiService } from '../../services/apiService';
import {
  SLADashboardData,
  TicketDashboardData,
  ServiceMetricsDashboardData,
  SubscriptionMetricsDashboardData,
  ExpirationDashboardData,
} from '../../types/dashboard';
import { TicketSummary, SLASummary } from '../../types/jira';
import BarChart from '../../components/common/charts/BarChart';
import GaugeChart from '../../components/common/charts/GaugeChart';
import JiraMetricsCards from '../../components/common/JiraMetricsCards';
import JiraTicketsModal from '../../components/common/JiraTicketsModal';
import './Dashboard.css';

/**
 * Main Operational Dashboard
 * Displays key metrics and visualizations for MSSP operations
 * Now includes Jira integration for real-time ticket and SLA data
 */
const Dashboard: React.FC = () => {
  const navigate = useNavigate();

  // State for dashboard data
  const [slaData, setSlaData] = useState<SLADashboardData | null>(null);
  const [ticketData, setTicketData] = useState<TicketDashboardData | null>(null);
  const [serviceData, setServiceData] = useState<ServiceMetricsDashboardData | null>(null);
  const [subscriptionData, setSubscriptionData] = useState<SubscriptionMetricsDashboardData | null>(null);
  const [expirationData, setExpirationData] = useState<ExpirationDashboardData | null>(null);
  
  // State for Jira integration data
  const [jiraTicketSummary, setJiraTicketSummary] = useState<TicketSummary | null>(null);
  const [jiraSLASummary, setJiraSLASummary] = useState<SLASummary | null>(null);
  const [jiraLoading, setJiraLoading] = useState(false);
  const [jiraError, setJiraError] = useState<string | null>(null);
  
  // State for modal drill-down
  const [modalState, setModalState] = useState<{
    isOpen: boolean;
    title: string;
    clientId?: string;
    status?: string;
    priority?: string;
    slaType?: 'firstResponse' | 'resolution';
    breached?: boolean;
  }>({
    isOpen: false,
    title: '',
  });
  
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch all dashboard data
  useEffect(() => {
    fetchDashboardData();
    fetchJiraData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      setError(null);

      // Fetch all data in parallel
      const [sla, tickets, services, subscriptions, expirations] = await Promise.all([
        apiService.get<SLADashboardData>('/dashboard/sla-metrics'),
        apiService.get<TicketDashboardData>('/dashboard/ticket-metrics'),
        apiService.get<ServiceMetricsDashboardData>('/dashboard/service-metrics'),
        apiService.get<SubscriptionMetricsDashboardData>('/dashboard/subscription-metrics'),
        apiService.get<ExpirationDashboardData>('/dashboard/expirations'),
      ]);

      setSlaData(sla);
      setTicketData(tickets);
      setServiceData(services);
      setSubscriptionData(subscriptions);
      setExpirationData(expirations);
    } catch (err) {
      console.error('Error fetching dashboard data:', err);
      setError('Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  const fetchJiraData = async () => {
    try {
      setJiraLoading(true);
      setJiraError(null);

      // Check Jira health first
      const healthStatus = await apiService.checkJiraHealth();
      if (!healthStatus.isHealthy) {
        setJiraError('Jira integration is not available');
        return;
      }

      // Get recent tickets for global summary
      const recentTickets = await apiService.getJiraRecentTickets(100);
      
      // Calculate global ticket summary
      const globalTicketSummary: TicketSummary = {
        totalTickets: recentTickets.length,
        openTickets: recentTickets.filter(t => 
          t.fields.status.statusCategory.key === 'new' || 
          t.fields.status.statusCategory.key === 'indeterminate'
        ).length,
        inProgressTickets: recentTickets.filter(t => 
          t.fields.status.statusCategory.key === 'indeterminate' &&
          t.fields.status.name.toLowerCase().includes('progress')
        ).length,
        resolvedTickets: recentTickets.filter(t => 
          t.fields.status.statusCategory.key === 'done'
        ).length,
        byPriority: recentTickets.reduce((acc, ticket) => {
          const priority = ticket.fields.priority.name;
          acc[priority] = (acc[priority] || 0) + 1;
          return acc;
        }, {} as Record<string, number>),
        byType: recentTickets.reduce((acc, ticket) => {
          const type = ticket.fields.issuetype.name;
          acc[type] = (acc[type] || 0) + 1;
          return acc;
        }, {} as Record<string, number>),
      };

      setJiraTicketSummary(globalTicketSummary);

      // For SLA summary, we'll use a simplified approach for global view
      // In a real implementation, you might want to aggregate SLA data from multiple clients
      const slaBreachedTickets = await apiService.getJiraSLABreachedTickets();
      const globalSLASummary: SLASummary = {
        timeToFirstResponse: {
          achieved: Math.max(0, globalTicketSummary.totalTickets - slaBreachedTickets.length),
          breached: slaBreachedTickets.length,
          achievementRate: globalTicketSummary.totalTickets > 0 
            ? (globalTicketSummary.totalTickets - slaBreachedTickets.length) / globalTicketSummary.totalTickets 
            : 1,
          averageTime: 3600000, // 1 hour in milliseconds (placeholder)
        },
        timeToResolution: {
          achieved: globalTicketSummary.resolvedTickets,
          breached: Math.max(0, slaBreachedTickets.length - globalTicketSummary.resolvedTickets),
          achievementRate: globalTicketSummary.totalTickets > 0 
            ? globalTicketSummary.resolvedTickets / globalTicketSummary.totalTickets 
            : 1,
          averageTime: 86400000, // 24 hours in milliseconds (placeholder)
        },
      };

      setJiraSLASummary(globalSLASummary);
    } catch (err) {
      console.error('Error fetching Jira data:', err);
      setJiraError('Failed to load Jira data');
    } finally {
      setJiraLoading(false);
    }
  };

  // Drill-down handlers
  const handleSLADrillDown = (metric?: string) => {
    // Navigate to SLA details page with filters
    navigate('/admin/sla-metrics', { state: { metricType: metric } });
  };

  const handleTicketDrillDown = (status?: string, priority?: string) => {
    // Navigate to tickets page with filters
    navigate('/admin/tickets', { state: { status, priority } });
  };

  const handleServiceDrillDown = (serviceId: string) => {
    // Navigate to service details
    navigate(`/admin/services/${serviceId}`);
  };

  const handleClientDrillDown = (clientId: string) => {
    // Navigate to client overview
    navigate(`/admin/clients/${clientId}/overview`);
  };

  const handleContractDrillDown = (contractId: string) => {
    // Navigate to contract details
    navigate(`/admin/contracts/${contractId}`);
  };

  // Jira drill-down handlers
  const handleJiraTicketClick = (status: string, priority?: string) => {
    let title = 'Jira Tickets';
    if (status === 'all') {
      title = 'All Jira Tickets';
    } else if (priority === 'high') {
      title = 'High Priority Jira Tickets';
    } else {
      title = `${status.charAt(0).toUpperCase() + status.slice(1)} Jira Tickets`;
    }

    setModalState({
      isOpen: true,
      title,
      status: status === 'all' ? undefined : status,
      priority,
    });
  };

  const handleJiraSLAClick = (type: 'firstResponse' | 'resolution', breached?: boolean) => {
    const title = breached 
      ? `SLA Breached Tickets - ${type === 'firstResponse' ? 'First Response' : 'Resolution'}`
      : `SLA Tickets - ${type === 'firstResponse' ? 'First Response' : 'Resolution'}`;

    setModalState({
      isOpen: true,
      title,
      slaType: type,
      breached,
    });
  };

  const closeModal = () => {
    setModalState({
      isOpen: false,
      title: '',
    });
  };

  const refreshAllData = () => {
    fetchDashboardData();
    fetchJiraData();
  };

  if (loading) {
    return (
      <div className="dashboard-container">
        <div className="loading-state">
          <div className="loading-spinner"></div>
          <p>Loading dashboard data...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="dashboard-container">
        <div className="error-state">
          <p>{error}</p>
          <button onClick={fetchDashboardData}>Retry</button>
        </div>
      </div>
    );
  }

  return (
    <div className="dashboard-container">
      <div className="dashboard-header">
        <h1>Operational Dashboard</h1>
        <button className="refresh-button" onClick={refreshAllData}>
          Refresh
        </button>
      </div>

      <div className="dashboard-grid">
        {/* Jira Integration Section - New */}
        <div className="dashboard-section jira-section">
          <JiraMetricsCards
            ticketSummary={jiraTicketSummary}
            slaSummary={jiraSLASummary}
            loading={jiraLoading}
            error={jiraError}
            onTicketClick={handleJiraTicketClick}
            onSLAClick={handleJiraSLAClick}
          />
        </div>

        {/* SLA Metrics Section */}
        <div className="dashboard-section sla-section">
          <h2>SLA Performance</h2>
          
          <div className="sla-current-month">
            <div className="metric-card">
              <h3>Current Month SLA</h3>
              <div className="metric-value">
                {slaData?.currentMonth.overallAchievement.toFixed(1)}%
              </div>
              <div className="metric-target">
                Target: {slaData?.currentMonth.targetPercentage}%
              </div>
              <div className={`metric-change ${(slaData?.currentMonth.changeFromLastMonth || 0) >= 0 ? 'positive' : 'negative'}`}>
                {(slaData?.currentMonth.changeFromLastMonth || 0) >= 0 ? '+' : ''}
                {slaData?.currentMonth.changeFromLastMonth.toFixed(1)}% from last month
              </div>
            </div>

            <div className="sla-summary-cards">
              <div className="summary-card" onClick={() => handleSLADrillDown()}>
                <span className="summary-label">Active SLAs</span>
                <span className="summary-value">{slaData?.currentMonth.activeSLAs}</span>
              </div>
              <div className="summary-card critical" onClick={() => handleSLADrillDown('breached')}>
                <span className="summary-label">Breached</span>
                <span className="summary-value">{slaData?.currentMonth.breachedSLAs}</span>
              </div>
            </div>
          </div>

          {slaData?.historical && (
            <BarChart
              data={slaData.historical.map(h => ({
                label: new Date(h.date).toLocaleDateString('en-US', { month: 'short' }),
                value: h.achievementPercentage,
                color: h.achievementPercentage >= 95 ? '#10b981' : '#f59e0b',
              }))}
              title="SLA Historical Trend"
              height={200}
              onClick={(item) => handleSLADrillDown()}
            />
          )}
        </div>

        {/* Ticket Status Section */}
        <div className="dashboard-section tickets-section">
          <h2>Ticket Status</h2>
          
          <div className="ticket-summary-grid">
            <div className="ticket-card total" onClick={() => handleTicketDrillDown()}>
              <span className="ticket-count">{ticketData?.summary.total || 0}</span>
              <span className="ticket-label">Total</span>
            </div>
            <div className="ticket-card open" onClick={() => handleTicketDrillDown('open')}>
              <span className="ticket-count">{ticketData?.summary.open || 0}</span>
              <span className="ticket-label">Open</span>
            </div>
            <div className="ticket-card critical" onClick={() => handleTicketDrillDown(undefined, 'critical')}>
              <span className="ticket-count">{ticketData?.summary.critical || 0}</span>
              <span className="ticket-label">Critical</span>
            </div>
            <div className="ticket-card high" onClick={() => handleTicketDrillDown(undefined, 'high')}>
              <span className="ticket-count">{ticketData?.summary.high || 0}</span>
              <span className="ticket-label">High</span>
            </div>
            <div className="ticket-card medium" onClick={() => handleTicketDrillDown(undefined, 'medium')}>
              <span className="ticket-count">{ticketData?.summary.medium || 0}</span>
              <span className="ticket-label">Medium</span>
            </div>
            <div className="ticket-card low" onClick={() => handleTicketDrillDown(undefined, 'low')}>
              <span className="ticket-count">{ticketData?.summary.low || 0}</span>
              <span className="ticket-label">Low</span>
            </div>
            <div className="ticket-card closed" onClick={() => handleTicketDrillDown('closed')}>
              <span className="ticket-count">{ticketData?.summary.closed || 0}</span>
              <span className="ticket-label">Closed</span>
            </div>
          </div>

          {ticketData?.topClients && (
            <div className="top-clients-list">
              <h3>Top Clients by Ticket Volume</h3>
              {ticketData.topClients.map(client => (
                <div 
                  key={client.clientId} 
                  className="client-ticket-row"
                  onClick={() => handleClientDrillDown(client.clientId)}
                >
                  <span className="client-name">{client.clientName}</span>
                  <span className="ticket-counts">
                    {client.ticketCount} tickets
                    {client.criticalCount > 0 && (
                      <span className="critical-count">({client.criticalCount} critical)</span>
                    )}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Service Performance Section */}
        <div className="dashboard-section services-section">
          <h2>Service Performance</h2>
          
          <div className="service-gauges">
            {serviceData?.edr.map((metric, index) => (
              <GaugeChart
                key={index}
                value={metric.currentValue}
                maxValue={metric.maxCapacity}
                label={`EDR - ${metric.displayName}`}
                unit={metric.unit}
                status={metric.status}
                onClick={() => handleServiceDrillDown(metric.serviceType)}
              />
            ))}
            
            {serviceData?.siem.map((metric, index) => (
              <GaugeChart
                key={index}
                value={metric.currentValue}
                maxValue={metric.maxCapacity}
                label={`SIEM - ${metric.displayName}`}
                unit={metric.unit}
                status={metric.status}
                onClick={() => handleServiceDrillDown(metric.serviceType)}
              />
            ))}
            
            {serviceData?.ndr.map((metric, index) => (
              <GaugeChart
                key={index}
                value={metric.currentValue}
                maxValue={metric.maxCapacity}
                label={`NDR - ${metric.displayName}`}
                unit={metric.unit}
                status={metric.status}
                onClick={() => handleServiceDrillDown(metric.serviceType)}
              />
            ))}
          </div>

          {serviceData?.alerts && serviceData.alerts.length > 0 && (
            <div className="service-alerts">
              <h3>Service Alerts</h3>
              {serviceData.alerts.map((alert, index) => (
                <div key={index} className={`alert-item ${alert.severity}`}>
                  <span className="alert-client">{alert.clientName}</span>
                  <span className="alert-service">{alert.serviceName}</span>
                  <span className="alert-issue">{alert.issue}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Customer Subscription Trends */}
        <div className="dashboard-section subscription-section">
          <h2>Customer Subscriptions</h2>
          
          <div className="subscription-summary">
            <div className="summary-metric">
              <span className="metric-label">Active Clients</span>
              <span className="metric-value">{subscriptionData?.currentSummary.totalActiveClients}</span>
            </div>
            <div className="summary-metric">
              <span className="metric-label">MRR</span>
              <span className="metric-value">${subscriptionData?.currentSummary.currentMRR.toLocaleString()}</span>
            </div>
            <div className="summary-metric">
              <span className="metric-label">ARR</span>
              <span className="metric-value">${subscriptionData?.currentSummary.currentARR.toLocaleString()}</span>
            </div>
            <div className="summary-metric">
              <span className="metric-label">Growth Rate</span>
              <span className="metric-value">{subscriptionData?.currentSummary.growthRate.toFixed(1)}%</span>
            </div>
          </div>

          {subscriptionData?.trends && (
            <BarChart
              data={subscriptionData.trends.slice(-6).map(t => ({
                label: new Date(t.date).toLocaleDateString('en-US', { month: 'short' }),
                value: t.activeClients,
              }))}
              title="Client Growth Trend"
              height={200}
            />
          )}
        </div>

        {/* Expirations Section */}
        <div className="dashboard-section expirations-section">
          <h2>Upcoming Expirations</h2>
          
          <div className="expiration-tabs">
            <div className="expiration-tab">
              <h3>SAF Expirations ({expirationData?.summary.totalExpiringSAFs || 0})</h3>
              <div className="expiration-list">
                {expirationData?.expiringSAFs.slice(0, 5).map(saf => (
                  <div 
                    key={saf.serviceScopeId} 
                    className="expiration-item"
                    onClick={() => handleClientDrillDown(saf.clientId)}
                  >
                    <div className="expiration-client">{saf.clientName}</div>
                    <div className="expiration-service">{saf.serviceName}</div>
                    <div className="expiration-days">{saf.daysUntilExpiration} days</div>
                  </div>
                ))}
              </div>
            </div>

            <div className="expiration-tab">
              <h3>Contract Expirations ({expirationData?.summary.totalExpiringContracts || 0})</h3>
              <div className="expiration-list">
                {expirationData?.expiringContracts.slice(0, 5).map(contract => (
                  <div 
                    key={contract.contractId} 
                    className="expiration-item"
                    onClick={() => handleContractDrillDown(contract.contractId)}
                  >
                    <div className="expiration-client">{contract.clientName}</div>
                    <div className="expiration-contract">{contract.contractName}</div>
                    <div className="expiration-days">{contract.daysUntilExpiration} days</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Jira Tickets Modal for Drill-down */}
      <JiraTicketsModal
        isOpen={modalState.isOpen}
        onClose={closeModal}
        title={modalState.title}
        clientId={modalState.clientId}
        status={modalState.status}
        priority={modalState.priority}
        slaType={modalState.slaType}
        breached={modalState.breached}
      />
    </div>
  );
};

export default Dashboard; 