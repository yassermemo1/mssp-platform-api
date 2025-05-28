import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { apiService } from '../../../services/apiService';
import { ClientOverviewData } from '../../../types/dashboard';
import { TicketSummary, SLASummary } from '../../../types/jira';
import JiraMetricsCards from '../../../components/common/JiraMetricsCards';
import JiraTicketsModal from '../../../components/common/JiraTicketsModal';
import './ClientOverview.css';

/**
 * Client Overview Page (360 View)
 * Comprehensive view of all client-related information
 * Now includes Jira integration for client-specific ticket and SLA data
 */
const ClientOverview: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  
  const [data, setData] = useState<ClientOverviewData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'overview' | 'contracts' | 'services' | 'financials' | 'team' | 'metrics' | 'tickets'>('overview');

  // Jira integration state
  const [jiraTicketSummary, setJiraTicketSummary] = useState<TicketSummary | null>(null);
  const [jiraSLASummary, setJiraSLASummary] = useState<SLASummary | null>(null);
  const [jiraLoading, setJiraLoading] = useState(false);
  const [jiraError, setJiraError] = useState<string | null>(null);
  
  // Modal state for drill-down
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

  useEffect(() => {
    if (id) {
      fetchClientOverview();
      fetchJiraData();
    }
  }, [id]);

  const fetchClientOverview = async () => {
    try {
      setLoading(true);
      setError(null);
      const overviewData = await apiService.get<ClientOverviewData>(`/clients/${id}/overview`);
      setData(overviewData);
    } catch (err) {
      console.error('Error fetching client overview:', err);
      setError('Failed to load client overview');
    } finally {
      setLoading(false);
    }
  };

  const fetchJiraData = async () => {
    if (!id) return;

    try {
      setJiraLoading(true);
      setJiraError(null);

      // Check Jira health first
      const healthStatus = await apiService.checkJiraHealth();
      if (!healthStatus.isHealthy) {
        setJiraError('Jira integration is not available');
        return;
      }

      // Fetch client-specific Jira data
      const [ticketSummary, slaSummary] = await Promise.all([
        apiService.getJiraClientTicketSummary(id),
        apiService.getJiraClientSLASummary(id),
      ]);

      setJiraTicketSummary(ticketSummary);
      setJiraSLASummary(slaSummary);
    } catch (err) {
      console.error('Error fetching Jira data:', err);
      setJiraError('Failed to load Jira data for this client');
    } finally {
      setJiraLoading(false);
    }
  };

  // Jira drill-down handlers
  const handleJiraTicketClick = (status: string, priority?: string) => {
    let title = `${data?.profile.companyName} - Jira Tickets`;
    if (status === 'all') {
      title = `${data?.profile.companyName} - All Jira Tickets`;
    } else if (priority === 'high') {
      title = `${data?.profile.companyName} - High Priority Jira Tickets`;
    } else {
      title = `${data?.profile.companyName} - ${status.charAt(0).toUpperCase() + status.slice(1)} Jira Tickets`;
    }

    setModalState({
      isOpen: true,
      title,
      clientId: id,
      status: status === 'all' ? undefined : status,
      priority,
    });
  };

  const handleJiraSLAClick = (type: 'firstResponse' | 'resolution', breached?: boolean) => {
    const title = breached 
      ? `${data?.profile.companyName} - SLA Breached Tickets (${type === 'firstResponse' ? 'First Response' : 'Resolution'})`
      : `${data?.profile.companyName} - SLA Tickets (${type === 'firstResponse' ? 'First Response' : 'Resolution'})`;

    setModalState({
      isOpen: true,
      title,
      clientId: id,
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

  const getHealthStatusColor = (status: string) => {
    switch (status) {
      case 'critical':
        return '#ef4444';
      case 'warning':
        return '#f59e0b';
      case 'good':
      default:
        return '#10b981';
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  };

  const formatDate = (date: Date | string | null) => {
    if (!date) return 'N/A';
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  if (loading) {
    return (
      <div className="client-overview-container">
        <div className="loading-state">
          <div className="loading-spinner"></div>
          <p>Loading client overview...</p>
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="client-overview-container">
        <div className="error-state">
          <p>{error || 'Failed to load client data'}</p>
          <button onClick={fetchClientOverview}>Retry</button>
        </div>
      </div>
    );
  }

  return (
    <div className="client-overview-container">
      {/* Header Section */}
      <div className="overview-header">
        <div className="header-content">
          <div className="header-title">
            <h1>{data.profile.companyName}</h1>
            <div className="header-meta">
              <span className={`status-badge ${data.profile.status.toLowerCase()}`}>
                {data.profile.status}
              </span>
              <span className="industry">{data.profile.industry}</span>
              <span className="source">Source: {data.profile.source}</span>
            </div>
          </div>
          <div className="header-actions">
            <div 
              className="health-indicator"
              style={{ backgroundColor: getHealthStatusColor(data.summary.healthStatus) }}
            >
              <span className="health-label">Health Status</span>
              <span className="health-value">{data.summary.healthStatus.toUpperCase()}</span>
            </div>
            <Link to={`/admin/clients/${id}/edit`} className="edit-button">
              Edit Client
            </Link>
          </div>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="summary-cards">
        <div className="summary-card">
          <div className="card-icon contracts"></div>
          <div className="card-content">
            <span className="card-value">{data.summary.totalActiveContracts}</span>
            <span className="card-label">Active Contracts</span>
          </div>
        </div>
        <div className="summary-card">
          <div className="card-icon services"></div>
          <div className="card-content">
            <span className="card-value">{data.summary.totalActiveServices}</span>
            <span className="card-label">Active Services</span>
          </div>
        </div>
        <div className="summary-card">
          <div className="card-icon value"></div>
          <div className="card-content">
            <span className="card-value">{formatCurrency(data.summary.totalValue)}</span>
            <span className="card-label">Total Value</span>
          </div>
        </div>
        <div className="summary-card">
          <div className="card-icon metrics"></div>
          <div className="card-content">
            <span className="card-value">{data.metrics.currentSLAAchievement.toFixed(1)}%</span>
            <span className="card-label">SLA Achievement</span>
          </div>
        </div>
        {/* New Jira Summary Card */}
        {jiraTicketSummary && (
          <div className="summary-card">
            <div className="card-icon tickets"></div>
            <div className="card-content">
              <span className="card-value">{jiraTicketSummary.totalTickets}</span>
              <span className="card-label">Jira Tickets</span>
              {jiraTicketSummary.openTickets > 0 && (
                <span className="card-sublabel">{jiraTicketSummary.openTickets} open</span>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Tab Navigation */}
      <div className="tab-navigation">
        <button 
          className={`tab-button ${activeTab === 'overview' ? 'active' : ''}`}
          onClick={() => setActiveTab('overview')}
        >
          Overview
        </button>
        <button 
          className={`tab-button ${activeTab === 'contracts' ? 'active' : ''}`}
          onClick={() => setActiveTab('contracts')}
        >
          Contracts ({data.contracts.length})
        </button>
        <button 
          className={`tab-button ${activeTab === 'services' ? 'active' : ''}`}
          onClick={() => setActiveTab('services')}
        >
          Services ({data.services.length})
        </button>
        <button 
          className={`tab-button ${activeTab === 'financials' ? 'active' : ''}`}
          onClick={() => setActiveTab('financials')}
        >
          Financials
        </button>
        <button 
          className={`tab-button ${activeTab === 'team' ? 'active' : ''}`}
          onClick={() => setActiveTab('team')}
        >
          Team ({data.team.totalTeamMembers})
        </button>
        <button 
          className={`tab-button ${activeTab === 'metrics' ? 'active' : ''}`}
          onClick={() => setActiveTab('metrics')}
        >
          Metrics
        </button>
        {/* New Tickets Tab */}
        <button 
          className={`tab-button ${activeTab === 'tickets' ? 'active' : ''}`}
          onClick={() => setActiveTab('tickets')}
        >
          Tickets {jiraTicketSummary && `(${jiraTicketSummary.totalTickets})`}
        </button>
      </div>

      {/* Tab Content */}
      <div className="tab-content">
        {activeTab === 'overview' && (
          <div className="overview-tab">
            <div className="overview-grid">
              {/* Contact Information */}
              <div className="info-section">
                <h3>Contact Information</h3>
                <div className="info-grid">
                  <div className="info-item">
                    <span className="info-label">Primary Contact</span>
                    <span className="info-value">{data.profile.contactName}</span>
                  </div>
                  <div className="info-item">
                    <span className="info-label">Email</span>
                    <a href={`mailto:${data.profile.contactEmail}`} className="info-value link">
                      {data.profile.contactEmail}
                    </a>
                  </div>
                  <div className="info-item">
                    <span className="info-label">Phone</span>
                    <a href={`tel:${data.profile.contactPhone}`} className="info-value link">
                      {data.profile.contactPhone}
                    </a>
                  </div>
                  <div className="info-item">
                    <span className="info-label">Website</span>
                    <a href={data.profile.website} target="_blank" rel="noopener noreferrer" className="info-value link">
                      {data.profile.website}
                    </a>
                  </div>
                  <div className="info-item">
                    <span className="info-label">Address</span>
                    <span className="info-value">{data.profile.address}</span>
                  </div>
                  <div className="info-item">
                    <span className="info-label">Client Since</span>
                    <span className="info-value">{formatDate(data.profile.clientSince)}</span>
                  </div>
                </div>
              </div>

              {/* Account Management */}
              <div className="info-section">
                <h3>Account Management</h3>
                {data.profile.accountManager ? (
                  <div className="account-manager-card">
                    <div className="manager-info">
                      <span className="manager-name">{data.profile.accountManager.name}</span>
                      <a href={`mailto:${data.profile.accountManager.email}`} className="manager-email">
                        {data.profile.accountManager.email}
                      </a>
                    </div>
                  </div>
                ) : (
                  <p className="no-data">No account manager assigned</p>
                )}
              </div>

              {/* Quick Metrics */}
              <div className="info-section">
                <h3>Quick Metrics</h3>
                <div className="quick-metrics">
                  <div className="metric-item">
                    <span className="metric-label">Open Tickets</span>
                    <span className="metric-value">{data.metrics.openTickets}</span>
                  </div>
                  <div className="metric-item critical">
                    <span className="metric-label">Critical Tickets</span>
                    <span className="metric-value">{data.metrics.criticalTickets}</span>
                  </div>
                  <div className="metric-item">
                    <span className="metric-label">Avg Resolution Time</span>
                    <span className="metric-value">{data.metrics.avgResolutionTime.toFixed(1)}h</span>
                  </div>
                  {/* Add Jira metrics if available */}
                  {jiraTicketSummary && (
                    <>
                      <div className="metric-item jira">
                        <span className="metric-label">Jira Tickets (Total)</span>
                        <span className="metric-value">{jiraTicketSummary.totalTickets}</span>
                      </div>
                      <div className="metric-item jira">
                        <span className="metric-label">Jira Tickets (Open)</span>
                        <span className="metric-value">{jiraTicketSummary.openTickets}</span>
                      </div>
                    </>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'contracts' && (
          <div className="contracts-tab">
            <h3>Active Contracts</h3>
            <div className="contracts-list">
              {data.contracts.map(contract => (
                <div 
                  key={contract.id} 
                  className={`contract-item ${contract.isExpiringSoon ? 'expiring' : ''}`}
                  onClick={() => navigate(`/admin/contracts/${contract.id}`)}
                >
                  <div className="contract-header">
                    <span className="contract-name">{contract.contractName}</span>
                    <span className={`contract-status ${contract.status.toLowerCase()}`}>
                      {contract.status}
                    </span>
                  </div>
                  <div className="contract-details">
                    <div className="detail-item">
                      <span className="detail-label">Period</span>
                      <span className="detail-value">
                        {formatDate(contract.startDate)} - {formatDate(contract.endDate)}
                      </span>
                    </div>
                    <div className="detail-item">
                      <span className="detail-label">Value</span>
                      <span className="detail-value">{formatCurrency(contract.value)}</span>
                    </div>
                    <div className="detail-item">
                      <span className="detail-label">Services</span>
                      <span className="detail-value">{contract.serviceCount}</span>
                    </div>
                    {contract.isExpiringSoon && (
                      <div className="detail-item expiring">
                        <span className="detail-label">Expires In</span>
                        <span className="detail-value">{contract.daysUntilExpiration} days</span>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'services' && (
          <div className="services-tab">
            <h3>Active Services</h3>
            <div className="services-grid">
              {data.services.map(service => (
                <div key={service.id} className="service-card">
                  <div className="service-header">
                    <span className="service-name">{service.serviceName}</span>
                    <span className={`service-status ${service.isActive ? 'active' : 'inactive'}`}>
                      {service.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </div>
                  <div className="service-info">
                    <div className="info-row">
                      <span className="info-label">Category</span>
                      <span className="info-value">{service.serviceCategory}</span>
                    </div>
                    <div className="info-row">
                      <span className="info-label">Contract</span>
                      <span className="info-value">{service.contractName}</span>
                    </div>
                    <div className="info-row">
                      <span className="info-label">SAF Status</span>
                      <span className={`info-value saf-status ${service.safStatus.toLowerCase()}`}>
                        {service.safStatus}
                      </span>
                    </div>
                    {service.keyParameters && Object.keys(service.keyParameters).length > 0 && (
                      <div className="key-parameters">
                        <span className="params-label">Key Parameters:</span>
                        {Object.entries(service.keyParameters).map(([key, value]) => (
                          <div key={key} className="param-item">
                            <span className="param-key">{key}:</span>
                            <span className="param-value">{value}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'financials' && (
          <div className="financials-tab">
            <div className="financial-summary">
              <div className="financial-card">
                <span className="financial-label">Total Contract Value</span>
                <span className="financial-value">{formatCurrency(data.financials.totalContractValue)}</span>
              </div>
              <div className="financial-card">
                <span className="financial-label">Total Paid</span>
                <span className="financial-value paid">{formatCurrency(data.financials.totalPaidAmount)}</span>
              </div>
              <div className="financial-card">
                <span className="financial-label">Pending Amount</span>
                <span className="financial-value pending">{formatCurrency(data.financials.totalPendingAmount)}</span>
              </div>
            </div>

            <div className="payment-info">
              <div className="payment-item">
                <span className="payment-label">Last Payment</span>
                <span className="payment-value">{formatDate(data.financials.lastPaymentDate)}</span>
              </div>
              <div className="payment-item">
                <span className="payment-label">Next Payment Due</span>
                <span className="payment-value">{formatDate(data.financials.nextPaymentDue)}</span>
              </div>
            </div>

            <h3>Recent Transactions</h3>
            <div className="transactions-list">
              {data.financials.recentTransactions.map(transaction => (
                <div key={transaction.id} className="transaction-item">
                  <div className="transaction-info">
                    <span className="transaction-desc">{transaction.description}</span>
                    <span className="transaction-date">{formatDate(transaction.date)}</span>
                  </div>
                  <div className="transaction-details">
                    <span className={`transaction-type ${transaction.type.toLowerCase()}`}>
                      {transaction.type}
                    </span>
                    <span className={`transaction-status ${transaction.status.toLowerCase()}`}>
                      {transaction.status}
                    </span>
                    <span className="transaction-amount">{formatCurrency(transaction.amount)}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'team' && (
          <div className="team-tab">
            <h3>Assigned Team Members</h3>
            <div className="team-grid">
              {data.team.teamMembers.map(member => (
                <div key={member.id} className="team-member-card">
                  <div className="member-header">
                    <span className="member-name">{member.name}</span>
                    {member.isPrimary && <span className="primary-badge">Primary</span>}
                  </div>
                  <div className="member-details">
                    <a href={`mailto:${member.email}`} className="member-email">{member.email}</a>
                    <span className="member-role">{member.assignmentRole}</span>
                    <span className="member-since">Assigned: {formatDate(member.assignedDate)}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'metrics' && (
          <div className="metrics-tab">
            <div className="metrics-summary">
              <div className="metric-card">
                <span className="metric-label">SLA Achievement</span>
                <span className="metric-value large">{data.metrics.currentSLAAchievement.toFixed(1)}%</span>
              </div>
              <div className="metric-card">
                <span className="metric-label">Open Tickets</span>
                <span className="metric-value">{data.metrics.openTickets}</span>
                {data.metrics.criticalTickets > 0 && (
                  <span className="metric-sublabel">{data.metrics.criticalTickets} critical</span>
                )}
              </div>
              <div className="metric-card">
                <span className="metric-label">Avg Resolution Time</span>
                <span className="metric-value">{data.metrics.avgResolutionTime.toFixed(1)}h</span>
              </div>
            </div>

            {/* Jira Metrics Integration */}
            {(jiraTicketSummary || jiraSLASummary) && (
              <div className="jira-metrics-section">
                <h3>Jira Integration Metrics</h3>
                <JiraMetricsCards
                  ticketSummary={jiraTicketSummary}
                  slaSummary={jiraSLASummary}
                  loading={jiraLoading}
                  error={jiraError}
                  onTicketClick={handleJiraTicketClick}
                  onSLAClick={handleJiraSLAClick}
                  showClientId={false}
                />
              </div>
            )}

            <h3>Service Health</h3>
            <div className="service-health-grid">
              {data.metrics.serviceHealth.map((health, index) => (
                <div key={index} className={`health-card ${health.status}`}>
                  <span className="health-service">{health.serviceName}</span>
                  <span className="health-metric">{health.metric}</span>
                  <span className="health-value">{health.value}</span>
                  <span className={`health-status ${health.status}`}>{health.status.toUpperCase()}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* New Tickets Tab */}
        {activeTab === 'tickets' && (
          <div className="tickets-tab">
            <JiraMetricsCards
              ticketSummary={jiraTicketSummary}
              slaSummary={jiraSLASummary}
              loading={jiraLoading}
              error={jiraError}
              onTicketClick={handleJiraTicketClick}
              onSLAClick={handleJiraSLAClick}
              showClientId={false}
            />
          </div>
        )}
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

export default ClientOverview; 