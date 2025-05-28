import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { UserRole } from '../../types/auth';
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

  const canAccessAdmin = (): boolean => {
    if (!user) return false;
    return [UserRole.ADMIN, UserRole.MANAGER].includes(user.role);
  };

  const canAccessAssets = (): boolean => {
    if (!user) return false;
    return [UserRole.ADMIN, UserRole.MANAGER, UserRole.ASSET_MANAGER].includes(user.role);
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
          
          {canAccessAdmin() && (
            <>
              <div className="nav-divider"></div>
              <span className="nav-section-label">Admin</span>
              <Link 
                to="/admin/contracts" 
                className={isActive('/admin/contracts') ? 'nav-link active' : 'nav-link'}
              >
                Contracts
              </Link>
              <Link 
                to="/admin/proposals" 
                className={isActive('/admin/proposals') ? 'nav-link active' : 'nav-link'}
              >
                Proposal Dashboard
              </Link>
              <Link 
                to="/admin/proposals/list" 
                className={isActive('/admin/proposals/list') ? 'nav-link active' : 'nav-link'}
              >
                Proposals
              </Link>
              <Link 
                to="/admin/license-dashboard" 
                className={isActive('/admin/license-dashboard') ? 'nav-link active' : 'nav-link'}
              >
                License Dashboard
              </Link>
              <Link 
                to="/admin/license-pools" 
                className={isActive('/admin/license-pools') ? 'nav-link active' : 'nav-link'}
              >
                License Pools
              </Link>
              <Link 
                to="/admin/financials/transactions" 
                className={isActive('/admin/financials/transactions') ? 'nav-link active' : 'nav-link'}
              >
                Financial Transactions
              </Link>
              <Link 
                to="/admin/team-assignments" 
                className={isActive('/admin/team-assignments') ? 'nav-link active' : 'nav-link'}
              >
                Team Assignments
              </Link>
            </>
          )}

          {canAccessAssets() && (
            <>
              <div className="nav-divider"></div>
              <span className="nav-section-label">Hardware</span>
              <Link 
                to="/admin/hardware-assets" 
                className={isActive('/admin/hardware-assets') ? 'nav-link active' : 'nav-link'}
              >
                Hardware Assets
              </Link>
              <Link 
                to="/admin/hardware-assignments" 
                className={isActive('/admin/hardware-assignments') ? 'nav-link active' : 'nav-link'}
              >
                Assignments
              </Link>
            </>
          )}
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