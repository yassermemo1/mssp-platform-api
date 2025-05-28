/**
 * Team Assignment related TypeScript types
 */

import { User } from './auth';
import { Client } from './client';

export enum ClientAssignmentRole {
  ACCOUNT_MANAGER = 'ACCOUNT_MANAGER',
  LEAD_ENGINEER = 'LEAD_ENGINEER',
  PROJECT_MANAGER = 'PROJECT_MANAGER',
  SUPPORT_CONTACT = 'SUPPORT_CONTACT',
  SALES_LEAD = 'SALES_LEAD',
  CONSULTANT = 'CONSULTANT',
  SECURITY_ANALYST = 'SECURITY_ANALYST',
  TECHNICAL_LEAD = 'TECHNICAL_LEAD',
  IMPLEMENTATION_SPECIALIST = 'IMPLEMENTATION_SPECIALIST',
  BACKUP_CONTACT = 'BACKUP_CONTACT',
}

export interface ClientTeamAssignment {
  id: string;
  assignmentRole: ClientAssignmentRole;
  assignmentDate: string | null;
  endDate: string | null;
  isActive: boolean;
  notes: string | null;
  priority: number | null;
  userId: string;
  clientId: string;
  createdAt: string;
  updatedAt: string;
  user?: User;
  client?: Client;
}

export interface CreateTeamAssignmentDto {
  userId: string;
  clientId: string;
  assignmentRole: ClientAssignmentRole;
  assignmentDate?: string;
  endDate?: string;
  notes?: string;
  priority?: number;
}

export interface UpdateTeamAssignmentDto {
  assignmentRole?: ClientAssignmentRole;
  assignmentDate?: string;
  endDate?: string;
  notes?: string;
  priority?: number;
  isActive?: boolean;
}

export interface TeamAssignmentFilters {
  clientId?: string;
  userId?: string;
  assignmentRole?: ClientAssignmentRole;
  isActive?: boolean;
  assignmentDateFrom?: string;
  assignmentDateTo?: string;
  endDateFrom?: string;
  endDateTo?: string;
}

export interface TeamAssignmentStats {
  totalAssignments: number;
  activeAssignments: number;
  inactiveAssignments: number;
  expiredAssignments: number;
  roleDistribution: Record<ClientAssignmentRole, number>;
}

export interface ClientTeamAssignmentWithDetails extends ClientTeamAssignment {
  user: User;
  client: Client;
}

// Helper type for form data
export interface TeamAssignmentFormData {
  userId: string;
  clientId: string;
  assignmentRole: ClientAssignmentRole;
  assignmentDate: string;
  endDate: string;
  notes: string;
  priority: number | null;
}

// Helper functions for role display
export const formatAssignmentRole = (role: ClientAssignmentRole): string => {
  return role.replace(/_/g, ' ').toLowerCase().replace(/\b\w/g, l => l.toUpperCase());
};

export const getAssignmentRoleOptions = (): Array<{ value: ClientAssignmentRole; label: string }> => {
  return Object.values(ClientAssignmentRole).map(role => ({
    value: role,
    label: formatAssignmentRole(role)
  }));
}; 