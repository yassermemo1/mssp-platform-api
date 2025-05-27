import React from 'react';
import { useAuth } from '../contexts/AuthContext';
import './DashboardPage.css';

/**
 * DashboardPage Component
 * Simple dashboard for authenticated users
 */
const DashboardPage: React.FC = () => {
  const { user, logout } = useAuth();

  const handleLogout = () => {
    logout();
  };

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
          <div className="welcome-card">
            <h2>Welcome to the MSSP Platform</h2>
            <p>You have successfully logged in to the client management system.</p>
            
            <div className="user-details">
              <h3>Your Account Details:</h3>
              <ul>
                <li><strong>Email:</strong> {user?.email}</li>
                <li><strong>Role:</strong> {user?.role}</li>
                <li><strong>Status:</strong> {user?.isActive ? 'Active' : 'Inactive'}</li>
                <li><strong>Member Since:</strong> {user?.createdAt ? new Date(user.createdAt).toLocaleDateString() : 'N/A'}</li>
              </ul>
            </div>

            <div className="next-steps">
              <h3>Next Steps:</h3>
              <p>The client management features will be implemented in the next phase. For now, you can:</p>
              <ul>
                <li>Verify that authentication is working correctly</li>
                <li>Test the logout functionality</li>
                <li>Confirm that protected routes are secure</li>
              </ul>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default DashboardPage; 