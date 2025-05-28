import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { apiService } from '../../../services/apiService';
import { 
  LicensePool, 
  ClientLicense, 
  ClientLicenseStatus,
  LicenseType
} from '../../../types/license';
import './LicenseDashboardPage.css';

interface LicenseStats {
  totalPools: number;
  activePools: number;
  totalSeats: number;
  assignedSeats: number;
  availableSeats: number;
  utilizationRate: number;
  totalAssignments: number;
  activeAssignments: number;
  expiringSoon: number;
}

interface PoolUtilization {
  pool: LicensePool;
  utilizationRate: number;
  assignedSeats: number;
  availableSeats: number;
}

const LicenseDashboardPage: React.FC = () => {
  const [stats, setStats] = useState<LicenseStats | null>(null);
  const [topPools, setTopPools] = useState<PoolUtilization[]>([]);
  const [recentAssignments, setRecentAssignments] = useState<ClientLicense[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const [poolsResponse, assignmentsResponse] = await Promise.all([
        apiService.getLicensePools(),
        apiService.getClientLicenses()
      ]);

      const pools = poolsResponse.data;
      const assignments = assignmentsResponse.data;

      // Calculate statistics
      const stats = calculateStats(pools, assignments);
      setStats(stats);

      // Calculate pool utilization
      const poolUtilization = calculatePoolUtilization(pools, assignments);
      setTopPools(poolUtilization.slice(0, 5)); // Top 5 most utilized pools

      // Get recent assignments (last 10)
      const sortedAssignments = assignments
        .sort((a, b) => new Date(b.assignmentDate).getTime() - new Date(a.assignmentDate).getTime())
        .slice(0, 10);
      setRecentAssignments(sortedAssignments);

      setError(null);
    } catch (err: any) {
      setError(err.message || 'Failed to fetch dashboard data');
    } finally {
      setLoading(false);
    }
  };

  const calculateStats = (pools: LicensePool[], assignments: ClientLicense[]): LicenseStats => {
    const activePools = pools.filter(pool => pool.isActive);
    const totalSeats = pools.reduce((sum, pool) => sum + pool.totalSeats, 0);
    const assignedSeats = assignments
      .filter(assignment => assignment.status === ClientLicenseStatus.ACTIVE)
      .reduce((sum, assignment) => sum + assignment.assignedSeats, 0);
    
    const activeAssignments = assignments.filter(assignment => 
      assignment.status === ClientLicenseStatus.ACTIVE
    );

    // Count assignments expiring in the next 30 days
    const thirtyDaysFromNow = new Date();
    thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);
    
    const expiringSoon = assignments.filter(assignment => {
      if (assignment.status !== ClientLicenseStatus.ACTIVE) return false;
      
      const expiryDate = assignment.expiryDateOverride 
        ? new Date(assignment.expiryDateOverride)
        : assignment.licensePool?.expiryDate 
          ? new Date(assignment.licensePool.expiryDate)
          : null;
      
      return expiryDate && expiryDate <= thirtyDaysFromNow && expiryDate > new Date();
    }).length;

    return {
      totalPools: pools.length,
      activePools: activePools.length,
      totalSeats,
      assignedSeats,
      availableSeats: totalSeats - assignedSeats,
      utilizationRate: totalSeats > 0 ? (assignedSeats / totalSeats) * 100 : 0,
      totalAssignments: assignments.length,
      activeAssignments: activeAssignments.length,
      expiringSoon
    };
  };

  const calculatePoolUtilization = (pools: LicensePool[], assignments: ClientLicense[]): PoolUtilization[] => {
    return pools.map(pool => {
      const poolAssignments = assignments.filter(
        assignment => assignment.licensePoolId === pool.id && 
        assignment.status === ClientLicenseStatus.ACTIVE
      );
      
      const assignedSeats = poolAssignments.reduce((sum, assignment) => sum + assignment.assignedSeats, 0);
      const availableSeats = pool.totalSeats - assignedSeats;
      const utilizationRate = pool.totalSeats > 0 ? (assignedSeats / pool.totalSeats) * 100 : 0;

      return {
        pool,
        utilizationRate,
        assignedSeats,
        availableSeats
      };
    }).sort((a, b) => b.utilizationRate - a.utilizationRate);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString();
  };

  const getUtilizationColor = (rate: number) => {
    if (rate >= 90) return '#e53e3e'; // Red
    if (rate >= 75) return '#dd6b20'; // Orange
    if (rate >= 50) return '#d69e2e'; // Yellow
    return '#38a169'; // Green
  };

  const getStatusBadgeClass = (status: ClientLicenseStatus) => {
    switch (status) {
      case ClientLicenseStatus.ACTIVE:
        return 'status-badge status-active';
      case ClientLicenseStatus.INACTIVE:
        return 'status-badge status-inactive';
      case ClientLicenseStatus.EXPIRED:
        return 'status-badge status-expired';
      case ClientLicenseStatus.REVOKED:
        return 'status-badge status-revoked';
      case ClientLicenseStatus.PENDING:
        return 'status-badge status-pending';
      case ClientLicenseStatus.SUSPENDED:
        return 'status-badge status-suspended';
      default:
        return 'status-badge status-default';
    }
  };

  if (loading) {
    return (
      <div className="license-dashboard">
        <div className="loading-container">
          <div className="loading-spinner"></div>
          <p>Loading dashboard...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="license-dashboard">
        <div className="error-message">
          <h3>Error Loading Dashboard</h3>
          <p>{error}</p>
          <button onClick={fetchDashboardData} className="btn btn-primary">
            Retry
          </button>
        </div>
      </div>
    );
  }

  if (!stats) {
    return (
      <div className="license-dashboard">
        <div className="error-message">
          <h3>No Data Available</h3>
          <p>Unable to load dashboard statistics.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="license-dashboard">
      <div className="dashboard-header">
        <h1>License Management Dashboard</h1>
        <div className="header-actions">
          <Link to="/admin/license-pools" className="btn btn-outline">
            Manage Pools
          </Link>
          <Link to="/admin/license-pools/new" className="btn btn-primary">
            Create New Pool
          </Link>
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-icon pools-icon">📦</div>
          <div className="stat-content">
            <h3>License Pools</h3>
            <div className="stat-value">{stats.activePools} / {stats.totalPools}</div>
            <div className="stat-label">Active Pools</div>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon seats-icon">🪑</div>
          <div className="stat-content">
            <h3>Total Seats</h3>
            <div className="stat-value">{stats.totalSeats.toLocaleString()}</div>
            <div className="stat-label">Available Licenses</div>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon utilization-icon">📊</div>
          <div className="stat-content">
            <h3>Utilization</h3>
            <div className="stat-value">{stats.utilizationRate.toFixed(1)}%</div>
            <div className="stat-label">{stats.assignedSeats} / {stats.totalSeats} Assigned</div>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon assignments-icon">👥</div>
          <div className="stat-content">
            <h3>Assignments</h3>
            <div className="stat-value">{stats.activeAssignments}</div>
            <div className="stat-label">Active Assignments</div>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon expiring-icon">⚠️</div>
          <div className="stat-content">
            <h3>Expiring Soon</h3>
            <div className="stat-value">{stats.expiringSoon}</div>
            <div className="stat-label">Next 30 Days</div>
          </div>
        </div>
      </div>

      <div className="dashboard-content">
        {/* Pool Utilization */}
        <div className="dashboard-section">
          <div className="section-header">
            <h2>Top Pool Utilization</h2>
            <Link to="/admin/license-pools" className="view-all-link">
              View All Pools →
            </Link>
          </div>
          <div className="pool-utilization-list">
            {topPools.map(poolUtil => (
              <div key={poolUtil.pool.id} className="pool-utilization-item">
                <div className="pool-info">
                  <div className="pool-name">
                    <Link to={`/admin/license-pools/${poolUtil.pool.id}/assignments`}>
                      {poolUtil.pool.productName}
                    </Link>
                  </div>
                  <div className="pool-vendor">{poolUtil.pool.vendor}</div>
                </div>
                <div className="utilization-bar">
                  <div 
                    className="utilization-fill"
                    style={{ 
                      width: `${poolUtil.utilizationRate}%`,
                      backgroundColor: getUtilizationColor(poolUtil.utilizationRate)
                    }}
                  ></div>
                </div>
                <div className="utilization-stats">
                  <span className="utilization-rate">{poolUtil.utilizationRate.toFixed(1)}%</span>
                  <span className="seat-info">{poolUtil.assignedSeats} / {poolUtil.pool.totalSeats}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Recent Assignments */}
        <div className="dashboard-section">
          <div className="section-header">
            <h2>Recent Assignments</h2>
            <Link to="/admin/license-pools" className="view-all-link">
              View All Assignments →
            </Link>
          </div>
          <div className="recent-assignments">
            {recentAssignments.length === 0 ? (
              <div className="no-assignments">
                <p>No recent assignments found.</p>
              </div>
            ) : (
              <table className="assignments-table">
                <thead>
                  <tr>
                    <th>Client</th>
                    <th>Product</th>
                    <th>Seats</th>
                    <th>Date</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {recentAssignments.map(assignment => (
                    <tr key={assignment.id}>
                      <td>
                        <Link to={`/admin/clients/${assignment.clientId}/licenses`}>
                          {assignment.client?.companyName || 'Unknown Client'}
                        </Link>
                      </td>
                      <td>
                        <Link to={`/admin/license-pools/${assignment.licensePoolId}/assignments`}>
                          {assignment.licensePool?.productName || 'Unknown Product'}
                        </Link>
                      </td>
                      <td>{assignment.assignedSeats}</td>
                      <td>{formatDate(assignment.assignmentDate)}</td>
                      <td>
                        <span className={getStatusBadgeClass(assignment.status)}>
                          {assignment.status.replace('_', ' ').toUpperCase()}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default LicenseDashboardPage; 