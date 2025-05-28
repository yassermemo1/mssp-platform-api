import React from 'react';
import { useAuth } from '../contexts/AuthContext';
import JiraTicketCountWidget from '../components/common/jira/JiraTicketCountWidget';
import JiraSLAWidget from '../components/common/jira/JiraSLAWidget';
import './DashboardPage.css';

/**
 * DashboardPage Component
 * Main operational dashboard with Jira integration
 */
const DashboardPage: React.FC = () => {
  const { user, logout } = useAuth();

  const handleLogout = () => {
    logout();
  };

  // Configuration for Jira integration
  const jiraBaseUrl = process.env.REACT_APP_JIRA_BASE_URL || 'https://jira.company.com';

  return (
    <div className="dashboard-container">
      <header className="dashboard-header">
        <div className="header-content">
          <h1>MSSP Platform Dashboard</h1>
          <div className="user-info">
            <span>Welcome, {user?.firstName} {user?.lastName}</span>
            <span className="user-role">({user?.role})</span>
            <button onClick={handleLogout} className="logout-button">
              Logout
            </button>
          </div>
        </div>
      </header>

      <main className="dashboard-main">
        <div className="dashboard-content">
          {/* Dashboard Overview */}
          <div className="dashboard-overview">
            <div className="overview-card">
              <h2>Operational Dashboard</h2>
              <p>Real-time view of tickets, SLA performance, and system status across all clients.</p>
            </div>
          </div>

          {/* Jira Integration Section */}
          <div className="dashboard-section">
            <div className="section-header">
              <h2>Ticket Management</h2>
              <p>Global ticket overview and SLA performance metrics from Jira</p>
            </div>
            
            <div className="widgets-grid">
              {/* Global Ticket Counts Widget */}
              <div className="widget-container">
                <JiraTicketCountWidget
                  title="Global Ticket Overview"
                  jiraBaseUrl={jiraBaseUrl}
                  refreshInterval={300000} // 5 minutes
                />
              </div>

              {/* Global SLA Performance Widget */}
              <div className="widget-container">
                <JiraSLAWidget
                  title="Global SLA Performance"
                  jiraBaseUrl={jiraBaseUrl}
                  refreshInterval={300000} // 5 minutes
                />
              </div>
            </div>
          </div>

          {/* Additional Dashboard Sections */}
          <div className="dashboard-section">
            <div className="section-header">
              <h2>System Status</h2>
              <p>Overall system health and performance indicators</p>
            </div>
            
            <div className="status-grid">
              <div className="status-card">
                <div className="status-indicator status-operational"></div>
                <div className="status-info">
                  <h4>Jira Integration</h4>
                  <p>Operational</p>
                </div>
              </div>
              
              <div className="status-card">
                <div className="status-indicator status-operational"></div>
                <div className="status-info">
                  <h4>Client Management</h4>
                  <p>Operational</p>
                </div>
              </div>
              
              <div className="status-card">
                <div className="status-indicator status-operational"></div>
                <div className="status-info">
                  <h4>Contract Management</h4>
                  <p>Operational</p>
                </div>
              </div>
              
              <div className="status-card">
                <div className="status-indicator status-operational"></div>
                <div className="status-info">
                  <h4>Hardware Tracking</h4>
                  <p>Operational</p>
                </div>
              </div>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="dashboard-section">
            <div className="section-header">
              <h2>Quick Actions</h2>
              <p>Common management tasks and navigation</p>
            </div>
            
            <div className="quick-actions-grid">
              <a href="/clients" className="action-card">
                <div className="action-icon">👥</div>
                <div className="action-info">
                  <h4>Manage Clients</h4>
                  <p>View and manage client information</p>
                </div>
              </a>
              
              <a href="/admin/contracts" className="action-card">
                <div className="action-icon">📄</div>
                <div className="action-info">
                  <h4>Contracts</h4>
                  <p>Review contracts and service scopes</p>
                </div>
              </a>
              
              <a href="/admin/hardware-assets" className="action-card">
                <div className="action-icon">🖥️</div>
                <div className="action-info">
                  <h4>Hardware Assets</h4>
                  <p>Track hardware inventory</p>
                </div>
              </a>
              
              <a href="/admin/financials" className="action-card">
                <div className="action-icon">💰</div>
                <div className="action-info">
                  <h4>Financial Reports</h4>
                  <p>View financial transactions</p>
                </div>
              </a>
            </div>
          </div>

          {/* User Account Info */}
          <div className="dashboard-section">
            <div className="section-header">
              <h2>Account Information</h2>
            </div>
            
            <div className="account-info-card">
              <div className="user-details">
                <h3>Your Account Details:</h3>
                <div className="details-grid">
                  <div className="detail-item">
                    <label>Email:</label>
                    <span>{user?.email}</span>
                  </div>
                  <div className="detail-item">
                    <label>Role:</label>
                    <span className="role-badge">{user?.role}</span>
                  </div>
                  <div className="detail-item">
                    <label>Status:</label>
                    <span className={`status-badge ${user?.isActive ? 'active' : 'inactive'}`}>
                      {user?.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </div>
                  <div className="detail-item">
                    <label>Member Since:</label>
                    <span>{user?.createdAt ? new Date(user.createdAt).toLocaleDateString() : 'N/A'}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default DashboardPage; 