import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  ClientTeamAssignmentWithDetails, 
  TeamAssignmentFilters, 
  ClientAssignmentRole,
  formatAssignmentRole,
  getAssignmentRoleOptions 
} from '../../../types/team-assignment';
import { ApiError, UserRole } from '../../../types/auth';
import { apiService } from '../../../services/apiService';
import { useAuth } from '../../../contexts/AuthContext';

/**
 * AdminTeamAssignmentsListPage Component
 * Main admin page for viewing and managing all team assignments
 * Includes filtering, search, and management actions
 */
const AdminTeamAssignmentsListPage: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  
  const [assignments, setAssignments] = useState<ClientTeamAssignmentWithDetails[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [filters, setFilters] = useState<TeamAssignmentFilters>({
    isActive: true // Default to showing only active assignments
  });

  /**
   * Check if user has permission to manage team assignments
   */
  const canManageAssignments = (): boolean => {
    if (!user) return false;
    return [UserRole.ADMIN, UserRole.MANAGER, UserRole.ACCOUNT_MANAGER].includes(user.role);
  };

  /**
   * Fetch team assignments from the backend API
   */
  const fetchAssignments = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      const params = new URLSearchParams();
      
      // Apply filters
      if (filters.clientId) params.append('clientId', filters.clientId);
      if (filters.userId) params.append('userId', filters.userId);
      if (filters.assignmentRole) params.append('assignmentRole', filters.assignmentRole);
      if (filters.isActive !== undefined) params.append('isActive', filters.isActive.toString());
      if (filters.assignmentDateFrom) params.append('assignmentDateFrom', filters.assignmentDateFrom);
      if (filters.assignmentDateTo) params.append('assignmentDateTo', filters.assignmentDateTo);
      if (filters.endDateFrom) params.append('endDateFrom', filters.endDateFrom);
      if (filters.endDateTo) params.append('endDateTo', filters.endDateTo);
      
      const assignmentsData = await apiService.get<ClientTeamAssignmentWithDetails[]>(
        `/team-assignments?${params.toString()}`
      );
      setAssignments(assignmentsData);
    } catch (err) {
      const apiError = err as ApiError;
      setError(apiError.message || 'Failed to load team assignments');
      console.error('Error fetching team assignments:', err);
    } finally {
      setLoading(false);
    }
  }, [filters]);

  /**
   * Load assignments when component mounts or filters change
   */
  useEffect(() => {
    fetchAssignments();
  }, [fetchAssignments]);

  /**
   * Handle filter changes
   */
  const handleFilterChange = (field: keyof TeamAssignmentFilters, value: string | boolean | undefined) => {
    setFilters(prev => ({
      ...prev,
      [field]: value === '' ? undefined : value
    }));
  };

  /**
   * Handle deactivating an assignment
   */
  const handleDeactivateAssignment = async (assignmentId: string) => {
    if (!window.confirm('Are you sure you want to deactivate this assignment?')) {
      return;
    }

    try {
      await apiService.delete(`/team-assignments/${assignmentId}`);
      await fetchAssignments(); // Refresh the list
    } catch (err) {
      const apiError = err as ApiError;
      alert(apiError.message || 'Failed to deactivate assignment');
    }
  };

  /**
   * Handle reactivating an assignment
   */
  const handleReactivateAssignment = async (assignmentId: string) => {
    if (!window.confirm('Are you sure you want to reactivate this assignment?')) {
      return;
    }

    try {
      await apiService.patch(`/team-assignments/${assignmentId}/reactivate`, {});
      await fetchAssignments(); // Refresh the list
    } catch (err) {
      const apiError = err as ApiError;
      alert(apiError.message || 'Failed to reactivate assignment');
    }
  };

  /**
   * Format date for display
   */
  const formatDate = (dateString: string | null): string => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString();
  };

  /**
   * Get status badge class
   */
  const getStatusBadgeClass = (assignment: ClientTeamAssignmentWithDetails): string => {
    if (!assignment.isActive) return 'status-badge inactive';
    if (assignment.endDate && new Date(assignment.endDate) < new Date()) return 'status-badge expired';
    return 'status-badge active';
  };

  /**
   * Get status text
   */
  const getStatusText = (assignment: ClientTeamAssignmentWithDetails): string => {
    if (!assignment.isActive) return 'Inactive';
    if (assignment.endDate && new Date(assignment.endDate) < new Date()) return 'Expired';
    return 'Active';
  };

  // Check permissions first
  if (!canManageAssignments()) {
    return (
      <div className="admin-page-container">
        <div className="error-container">
          <h3>Access Denied</h3>
          <p>You do not have permission to manage team assignments. Contact your administrator if you need access.</p>
          <button onClick={() => navigate('/dashboard')} className="back-button">
            Back to Dashboard
          </button>
        </div>
      </div>
    );
  }

  const roleOptions = getAssignmentRoleOptions();

  return (
    <div className="admin-page-container">
      <div className="page-header">
        <h1>Team Assignments</h1>
        <button 
          onClick={() => navigate('/admin/team-assignments/new')}
          className="primary-button"
        >
          Create New Assignment
        </button>
      </div>

      {/* Filters Section */}
      <div className="filters-section">
        <h3>Filters</h3>
        <div className="filters-grid">
          <div className="filter-group">
            <label>Status</label>
            <select
              value={filters.isActive === undefined ? '' : filters.isActive.toString()}
              onChange={(e) => handleFilterChange('isActive', 
                e.target.value === '' ? undefined : e.target.value === 'true'
              )}
            >
              <option value="">All</option>
              <option value="true">Active</option>
              <option value="false">Inactive</option>
            </select>
          </div>

          <div className="filter-group">
            <label>Assignment Role</label>
            <select
              value={filters.assignmentRole || ''}
              onChange={(e) => handleFilterChange('assignmentRole', 
                e.target.value as ClientAssignmentRole || undefined
              )}
            >
              <option value="">All Roles</option>
              {roleOptions.map(option => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>

          <div className="filter-group">
            <label>Assignment Date From</label>
            <input
              type="date"
              value={filters.assignmentDateFrom || ''}
              onChange={(e) => handleFilterChange('assignmentDateFrom', e.target.value)}
            />
          </div>

          <div className="filter-group">
            <label>Assignment Date To</label>
            <input
              type="date"
              value={filters.assignmentDateTo || ''}
              onChange={(e) => handleFilterChange('assignmentDateTo', e.target.value)}
            />
          </div>
        </div>

        <div className="filter-actions">
          <button 
            onClick={() => setFilters({ isActive: true })}
            className="secondary-button"
          >
            Clear Filters
          </button>
        </div>
      </div>

      {/* Loading State */}
      {loading && (
        <div className="loading-container">
          <div className="loading-spinner"></div>
          <p>Loading team assignments...</p>
        </div>
      )}

      {/* Error State */}
      {error && !loading && (
        <div className="error-container">
          <h3>Error Loading Assignments</h3>
          <p>{error}</p>
          <button onClick={fetchAssignments} className="retry-button">
            Try Again
          </button>
        </div>
      )}

      {/* Assignments List */}
      {!loading && !error && (
        <div className="assignments-section">
          <div className="section-header">
            <h3>Assignments ({assignments.length})</h3>
          </div>

          {assignments.length === 0 ? (
            <div className="empty-state">
              <p>No team assignments found matching your criteria.</p>
              <button 
                onClick={() => navigate('/admin/team-assignments/new')}
                className="primary-button"
              >
                Create First Assignment
              </button>
            </div>
          ) : (
            <div className="assignments-table-container">
              <table className="assignments-table">
                <thead>
                  <tr>
                    <th>Team Member</th>
                    <th>Client</th>
                    <th>Role</th>
                    <th>Assignment Date</th>
                    <th>End Date</th>
                    <th>Status</th>
                    <th>Priority</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {assignments.map(assignment => (
                    <tr key={assignment.id}>
                      <td>
                        <div className="user-info">
                          <div className="user-name">
                            {assignment.user.firstName} {assignment.user.lastName}
                          </div>
                          <div className="user-email">{assignment.user.email}</div>
                        </div>
                      </td>
                      <td>
                        <div className="client-info">
                          <div className="client-name">{assignment.client.companyName}</div>
                        </div>
                      </td>
                      <td>
                        <span className="role-badge">
                          {formatAssignmentRole(assignment.assignmentRole)}
                        </span>
                      </td>
                      <td>{formatDate(assignment.assignmentDate)}</td>
                      <td>{formatDate(assignment.endDate)}</td>
                      <td>
                        <span className={getStatusBadgeClass(assignment)}>
                          {getStatusText(assignment)}
                        </span>
                      </td>
                      <td>{assignment.priority || 'N/A'}</td>
                      <td>
                        <div className="action-buttons">
                          <button
                            onClick={() => navigate(`/admin/team-assignments/${assignment.id}/edit`)}
                            className="edit-button"
                            title="Edit Assignment"
                          >
                            Edit
                          </button>
                          {assignment.isActive ? (
                            <button
                              onClick={() => handleDeactivateAssignment(assignment.id)}
                              className="deactivate-button"
                              title="Deactivate Assignment"
                            >
                              Deactivate
                            </button>
                          ) : (
                            <button
                              onClick={() => handleReactivateAssignment(assignment.id)}
                              className="activate-button"
                              title="Reactivate Assignment"
                            >
                              Reactivate
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default AdminTeamAssignmentsListPage; 