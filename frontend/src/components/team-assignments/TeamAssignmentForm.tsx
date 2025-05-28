import React, { useState, useEffect } from 'react';
import { 
  ClientTeamAssignment, 
  CreateTeamAssignmentDto, 
  UpdateTeamAssignmentDto, 
  ClientAssignmentRole,
  getAssignmentRoleOptions,
  TeamAssignmentFormData 
} from '../../types/team-assignment';
import { User } from '../../types/auth';
import { Client } from '../../types/client';
import { apiService } from '../../services/apiService';

interface BaseTeamAssignmentFormProps {
  onCancel: () => void;
  loading?: boolean;
  error?: string | null;
}

interface CreateTeamAssignmentFormProps extends BaseTeamAssignmentFormProps {
  isEditMode: false;
  initialData?: null;
  onSubmit: (data: CreateTeamAssignmentDto) => Promise<void>;
  preSelectedClientId?: string | null;
  preSelectedUserId?: string | null;
}

interface EditTeamAssignmentFormProps extends BaseTeamAssignmentFormProps {
  isEditMode: true;
  initialData: ClientTeamAssignment;
  onSubmit: (data: UpdateTeamAssignmentDto) => Promise<void>;
  preSelectedClientId?: never;
  preSelectedUserId?: never;
}

type TeamAssignmentFormProps = CreateTeamAssignmentFormProps | EditTeamAssignmentFormProps;

/**
 * TeamAssignmentForm Component
 * Reusable form for creating and editing team assignments
 * Handles user and client selection with searchable dropdowns
 */
const TeamAssignmentForm: React.FC<TeamAssignmentFormProps> = (props) => {
  const {
    onSubmit,
    onCancel,
    loading = false,
    error = null,
    isEditMode
  } = props;
  
  const initialData = isEditMode ? props.initialData : null;
  const preSelectedClientId = isEditMode ? null : props.preSelectedClientId;
  const preSelectedUserId = isEditMode ? null : props.preSelectedUserId;

  const [formData, setFormData] = useState<TeamAssignmentFormData>({
    userId: initialData?.userId || preSelectedUserId || '',
    clientId: initialData?.clientId || preSelectedClientId || '',
    assignmentRole: initialData?.assignmentRole || ClientAssignmentRole.ACCOUNT_MANAGER,
    assignmentDate: initialData?.assignmentDate || new Date().toISOString().split('T')[0],
    endDate: initialData?.endDate || '',
    notes: initialData?.notes || '',
    priority: initialData?.priority || null
  });

  const [users, setUsers] = useState<User[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [loadingUsers, setLoadingUsers] = useState<boolean>(false);
  const [loadingClients, setLoadingClients] = useState<boolean>(false);
  const [userSearchTerm, setUserSearchTerm] = useState<string>('');
  const [clientSearchTerm, setClientSearchTerm] = useState<string>('');

  /**
   * Fetch users for selection dropdown
   */
  const fetchUsers = async (search?: string) => {
    try {
      setLoadingUsers(true);
      const params = new URLSearchParams();
      if (search) params.append('search', search);
      params.append('isActive', 'true');
      
      const usersData = await apiService.get<User[]>(`/users?${params.toString()}`);
      setUsers(usersData);
    } catch (err) {
      console.error('Error fetching users:', err);
    } finally {
      setLoadingUsers(false);
    }
  };

  /**
   * Fetch clients for selection dropdown
   */
  const fetchClients = async (search?: string) => {
    try {
      setLoadingClients(true);
      const params = new URLSearchParams();
      if (search) params.append('search', search);
      
      const clientsData = await apiService.get<Client[]>(`/clients?${params.toString()}`);
      setClients(clientsData);
    } catch (err) {
      console.error('Error fetching clients:', err);
    } finally {
      setLoadingClients(false);
    }
  };

  /**
   * Load initial data on component mount
   */
  useEffect(() => {
    fetchUsers();
    fetchClients();
  }, []);

  /**
   * Handle user search with debouncing
   */
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (userSearchTerm) {
        fetchUsers(userSearchTerm);
      } else {
        fetchUsers();
      }
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [userSearchTerm]);

  /**
   * Handle client search with debouncing
   */
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (clientSearchTerm) {
        fetchClients(clientSearchTerm);
      } else {
        fetchClients();
      }
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [clientSearchTerm]);

  /**
   * Handle form field changes
   */
  const handleChange = (field: keyof TeamAssignmentFormData, value: string | number | null) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  /**
   * Handle form submission
   */
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (isEditMode) {
      // Edit mode - only send updatable fields
      const updateData: UpdateTeamAssignmentDto = {
        assignmentRole: formData.assignmentRole,
        assignmentDate: formData.assignmentDate || undefined,
        endDate: formData.endDate || undefined,
        notes: formData.notes || undefined,
        priority: formData.priority || undefined
      };
      await (onSubmit as EditTeamAssignmentFormProps['onSubmit'])(updateData);
    } else {
      // Create mode - send all required fields
      const createData: CreateTeamAssignmentDto = {
        userId: formData.userId,
        clientId: formData.clientId,
        assignmentRole: formData.assignmentRole,
        assignmentDate: formData.assignmentDate || undefined,
        endDate: formData.endDate || undefined,
        notes: formData.notes || undefined,
        priority: formData.priority || undefined
      };
      await (onSubmit as CreateTeamAssignmentFormProps['onSubmit'])(createData);
    }
  };

  /**
   * Get user display name
   */
  const getUserDisplayName = (user: User): string => {
    return `${user.firstName} ${user.lastName} (${user.email})`;
  };

  /**
   * Get client display name
   */
  const getClientDisplayName = (client: Client): string => {
    return `${client.companyName}`;
  };

  const roleOptions = getAssignmentRoleOptions();

  return (
    <div className="team-assignment-form-container">
      <div className="form-header">
        <h2>{isEditMode ? 'Edit Team Assignment' : 'Create New Team Assignment'}</h2>
      </div>

      {error && (
        <div className="error-message">
          <p>{error}</p>
        </div>
      )}

      <form onSubmit={handleSubmit} className="team-assignment-form">
        {/* User Selection */}
        <div className="form-group">
          <label htmlFor="userId">Team Member *</label>
          {isEditMode ? (
            <div className="readonly-field">
              {initialData?.user ? getUserDisplayName(initialData.user) : 'Loading...'}
            </div>
          ) : (
            <>
              <input
                type="text"
                placeholder="Search team members..."
                value={userSearchTerm}
                onChange={(e) => setUserSearchTerm(e.target.value)}
                className="search-input"
              />
              <select
                id="userId"
                value={formData.userId}
                onChange={(e) => handleChange('userId', e.target.value)}
                required
                disabled={loadingUsers}
              >
                <option value="">Select a team member</option>
                {users.map(user => (
                  <option key={user.id} value={user.id}>
                    {getUserDisplayName(user)}
                  </option>
                ))}
              </select>
              {loadingUsers && <div className="loading-indicator">Loading users...</div>}
            </>
          )}
        </div>

        {/* Client Selection */}
        <div className="form-group">
          <label htmlFor="clientId">Client *</label>
          {isEditMode ? (
            <div className="readonly-field">
              {initialData?.client ? getClientDisplayName(initialData.client) : 'Loading...'}
            </div>
          ) : (
            <>
              <input
                type="text"
                placeholder="Search clients..."
                value={clientSearchTerm}
                onChange={(e) => setClientSearchTerm(e.target.value)}
                className="search-input"
              />
              <select
                id="clientId"
                value={formData.clientId}
                onChange={(e) => handleChange('clientId', e.target.value)}
                required
                disabled={loadingClients}
              >
                <option value="">Select a client</option>
                {clients.map(client => (
                  <option key={client.id} value={client.id}>
                    {getClientDisplayName(client)}
                  </option>
                ))}
              </select>
              {loadingClients && <div className="loading-indicator">Loading clients...</div>}
            </>
          )}
        </div>

        {/* Assignment Role */}
        <div className="form-group">
          <label htmlFor="assignmentRole">Assignment Role *</label>
          <select
            id="assignmentRole"
            value={formData.assignmentRole}
            onChange={(e) => handleChange('assignmentRole', e.target.value as ClientAssignmentRole)}
            required
          >
            {roleOptions.map(option => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>

        {/* Assignment Date */}
        <div className="form-group">
          <label htmlFor="assignmentDate">Assignment Date</label>
          <input
            type="date"
            id="assignmentDate"
            value={formData.assignmentDate}
            onChange={(e) => handleChange('assignmentDate', e.target.value)}
          />
        </div>

        {/* End Date */}
        <div className="form-group">
          <label htmlFor="endDate">End Date (Optional)</label>
          <input
            type="date"
            id="endDate"
            value={formData.endDate}
            onChange={(e) => handleChange('endDate', e.target.value)}
          />
        </div>

        {/* Priority */}
        <div className="form-group">
          <label htmlFor="priority">Priority (Optional)</label>
          <input
            type="number"
            id="priority"
            min="1"
            max="10"
            value={formData.priority || ''}
            onChange={(e) => handleChange('priority', e.target.value ? parseInt(e.target.value) : null)}
            placeholder="1 = Highest Priority"
          />
        </div>

        {/* Notes */}
        <div className="form-group">
          <label htmlFor="notes">Notes (Optional)</label>
          <textarea
            id="notes"
            value={formData.notes}
            onChange={(e) => handleChange('notes', e.target.value)}
            rows={4}
            placeholder="Additional notes about this assignment..."
          />
        </div>

        {/* Form Actions */}
        <div className="form-actions">
          <button
            type="button"
            onClick={onCancel}
            className="cancel-button"
            disabled={loading}
          >
            Cancel
          </button>
          <button
            type="submit"
            className="submit-button"
            disabled={loading || !formData.userId || !formData.clientId}
          >
            {loading ? 'Saving...' : (isEditMode ? 'Update Assignment' : 'Create Assignment')}
          </button>
        </div>
      </form>
    </div>
  );
};

export default TeamAssignmentForm; 