/**
 * Client-related TypeScript types
 * Based on backend DTOs and entities
 */

export enum ClientStatus {
  PROSPECT = 'prospect',
  ACTIVE = 'active',
  INACTIVE = 'inactive',
  EXPIRED = 'expired',
  RENEWED = 'renewed',
}

export interface Client {
  id: string;
  companyName: string;
  contactName: string;
  contactEmail: string;
  contactPhone?: string;
  address?: string;
  industry?: string;
  status: ClientStatus;
  customFieldData?: Record<string, any>;
  createdAt: string;
  updatedAt: string;
}

export interface CreateClientDto {
  companyName: string;
  contactName: string;
  contactEmail: string;
  contactPhone?: string;
  address?: string;
  industry?: string;
  status?: ClientStatus;
  customFieldData?: Record<string, any>;
}

export interface UpdateClientDto {
  companyName?: string;
  contactName?: string;
  contactEmail?: string;
  contactPhone?: string;
  address?: string;
  industry?: string;
  status?: ClientStatus;
  customFieldData?: Record<string, any>;
} 