import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  ClientTeamAssignmentWithDetails, 
  formatAssignmentRole 
} from '../../types/team-assignment';
import { ApiError, UserRole } from '../../types/auth';
import { apiService } from '../../services/apiService';
import { useAuth } from '../../contexts/AuthContext';

interface ClientTeamAssignmentsProps {
  clientId: string;
  clientName?: string;
  showHeader?: boolean;
  maxItems?: number;
}

/**
 * ClientTeamAssignments Component
 * Displays team assignments for a specific client
 * Can be integrated into client detail pages or used standalone
 */
const ClientTeamAssignments: React.FC<ClientTeamAssignmentsProps> = ({
  clientId,
  clientName,
  showHeader = true,
  maxItems
}) => {
  const navigate = useNavigate();
  const { user } = useAuth();
  
  const [assignments, setAssignments] = useState<ClientTeamAssignmentWithDetails[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  /**
   * Check if user has permission to manage team assignments
   */
  const canManageAssignments = (): boolean => {
    if (!user) return false;
    return [UserRole.ADMIN, UserRole.MANAGER, UserRole.ACCOUNT_MANAGER].includes(user.role);
  };

  /**
   * Check if user can view team assignments
   */
  const canViewAssignments = (): boolean => {
    if (!user) return false;
    // Most roles can view assignments for transparency
    return [
      UserRole.ADMIN, 
      UserRole.MANAGER, 
      UserRole.ACCOUNT_MANAGER,
      UserRole.PROJECT_MANAGER,
      UserRole.ENGINEER
    ].includes(user.role);
  };

  /**
   * Fetch team assignments for the specific client
   */
  const fetchClientAssignments = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      const params = new URLSearchParams();
      params.append('clientId', clientId);
      params.append('isActive', 'true'); // Only show active assignments by default
      
      const assignmentsData = await apiService.get<ClientTeamAssignmentWithDetails[]>(
        `/team-assignments?${params.toString()}`
      );
      
      // Apply maxItems limit if specified
      const limitedAssignments = maxItems ? assignmentsData.slice(0, maxItems) : assignmentsData;
      setAssignments(limitedAssignments);
    } catch (err) {
      const apiError = err as ApiError;
      setError(apiError.message || 'Failed to load team assignments');
      console.error('Error fetching client assignments:', err);
    } finally {
      setLoading(false);
    }
  }, [clientId, maxItems]);

  /**
   * Load assignments when component mounts or clientId changes
   */
  useEffect(() => {
    if (clientId) {
      fetchClientAssignments();
    }
  }, [fetchClientAssignments, clientId]);

  /**
   * Handle deactivating an assignment
   */
  const handleDeactivateAssignment = async (assignmentId: string) => {
    if (!window.confirm('Are you sure you want to deactivate this assignment?')) {
      return;
    }

    try {
      await apiService.delete(`/team-assignments/${assignmentId}`);
      await fetchClientAssignments(); // Refresh the list
    } catch (err) {
      const apiError = err as ApiError;
      alert(apiError.message || 'Failed to deactivate assignment');
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

  // Check permissions
  if (!canViewAssignments()) {
    return (
      <div className="client-team-assignments">
        {showHeader && (
          <div className="section-header">
            <h3>Team Assignments</h3>
          </div>
        )}
        <div className="access-denied">
          <p>You do not have permission to view team assignments.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="client-team-assignments">
      {showHeader && (
        <div className="section-header">
          <h3>Team Assignments {clientName && `for ${clientName}`}</h3>
          {canManageAssignments() && (
            <div className="header-actions">
              <button
                onClick={() => navigate(`/admin/team-assignments/new?clientId=${clientId}`)}
                className="primary-button"
              >
                Assign Team Member
              </button>
              <button
                onClick={() => navigate(`/admin/team-assignments?clientId=${clientId}`)}
                className="secondary-button"
              >
                View All
              </button>
            </div>
          )}
        </div>
      )}

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
          <p>{error}</p>
          <button onClick={fetchClientAssignments} className="retry-button">
            Try Again
          </button>
        </div>
      )}

      {/* Assignments List */}
      {!loading && !error && (
        <div className="assignments-content">
          {assignments.length === 0 ? (
            <div className="empty-state">
              <p>No team members are currently assigned to this client.</p>
              {canManageAssignments() && (
                <button
                  onClick={() => navigate(`/admin/team-assignments/new?clientId=${clientId}`)}
                  className="primary-button"
                >
                  Assign First Team Member
                </button>
              )}
            </div>
          ) : (
            <div className="assignments-list">
              {assignments.map(assignment => (
                <div key={assignment.id} className="assignment-card">
                  <div className="assignment-header">
                    <div className="user-info">
                      <h4>{assignment.user.firstName} {assignment.user.lastName}</h4>
                      <p className="user-email">{assignment.user.email}</p>
                    </div>
                    <div className="assignment-status">
                      <span className={getStatusBadgeClass(assignment)}>
                        {getStatusText(assignment)}
                      </span>
                    </div>
                  </div>
                  
                  <div className="assignment-details">
                    <div className="detail-item">
                      <span className="label">Role:</span>
                      <span className="value role-badge">
                        {formatAssignmentRole(assignment.assignmentRole)}
                      </span>
                    </div>
                    
                    <div className="detail-item">
                      <span className="label">Assignment Date:</span>
                      <span className="value">{formatDate(assignment.assignmentDate)}</span>
                    </div>
                    
                    {assignment.endDate && (
                      <div className="detail-item">
                        <span className="label">End Date:</span>
                        <span className="value">{formatDate(assignment.endDate)}</span>
                      </div>
                    )}
                    
                    {assignment.priority && (
                      <div className="detail-item">
                        <span className="label">Priority:</span>
                        <span className="value">{assignment.priority}</span>
                      </div>
                    )}
                    
                    {assignment.notes && (
                      <div className="detail-item">
                        <span className="label">Notes:</span>
                        <span className="value">{assignment.notes}</span>
                      </div>
                    )}
                  </div>

                  {canManageAssignments() && (
                    <div className="assignment-actions">
                      <button
                        onClick={() => navigate(`/admin/team-assignments/${assignment.id}/edit`)}
                        className="edit-button"
                      >
                        Edit
                      </button>
                      {assignment.isActive && (
                        <button
                          onClick={() => handleDeactivateAssignment(assignment.id)}
                          className="deactivate-button"
                        >
                          Deactivate
                        </button>
                      )}
                    </div>
                  )}
                </div>
              ))}
              
              {maxItems && assignments.length >= maxItems && (
                <div className="view-more">
                  <button
                    onClick={() => navigate(`/admin/team-assignments?clientId=${clientId}`)}
                    className="secondary-button"
                  >
                    View All Assignments
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default ClientTeamAssignments; 