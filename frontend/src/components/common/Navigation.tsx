import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import './Navigation.css';

/**
 * Navigation Component
 * Simple navigation bar for the application
 */
const Navigation: React.FC = () => {
  const { user, logout } = useAuth();
  const location = useLocation();

  const isActive = (path: string): boolean => {
    return location.pathname === path || location.pathname.startsWith(path + '/');
  };

  return (
    <nav className="navigation">
      <div className="nav-container">
        <div className="nav-brand">
          <Link to="/dashboard">MSSP Platform</Link>
        </div>
        
        <div className="nav-links">
          <Link 
            to="/dashboard" 
            className={isActive('/dashboard') ? 'nav-link active' : 'nav-link'}
          >
            Dashboard
          </Link>
          <Link 
            to="/clients" 
            className={isActive('/clients') ? 'nav-link active' : 'nav-link'}
          >
            Clients
          </Link>
        </div>

        <div className="nav-user">
          <span className="user-info">
            {user?.firstName} {user?.lastName} ({user?.role})
          </span>
          <button onClick={logout} className="logout-button">
            Logout
          </button>
        </div>
      </div>
    </nav>
  );
};

export default Navigation; 