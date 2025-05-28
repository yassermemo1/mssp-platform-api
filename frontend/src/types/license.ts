// Import Client from client types
import { Client } from './client';

/**
 * License Type Enumeration
 * Defines the different types of licenses available
 */
export enum LicenseType {
  PERPETUAL = 'perpetual',
  SUBSCRIPTION = 'subscription',
  CONCURRENT = 'concurrent',
  NAMED_USER = 'named_user',
  DEVICE_BASED = 'device_based',
  USAGE_BASED = 'usage_based',
  ENTERPRISE = 'enterprise',
  TRIAL = 'trial',
}

/**
 * Client License Status Enumeration
 * Tracks the status of license assignments to clients
 */
export enum ClientLicenseStatus {
  ACTIVE = 'active',
  INACTIVE = 'inactive',
  EXPIRED = 'expired',
  REVOKED = 'revoked',
  PENDING = 'pending',
  SUSPENDED = 'suspended',
}

/**
 * LicensePool Entity Interface
 * Represents a pool of licenses for a specific product
 */
export interface LicensePool {
  id: string;
  productName: string;
  vendor: string;
  licenseType: LicenseType;
  totalSeats: number;
  assignedSeats?: number; // Calculated field
  availableSeats?: number; // Calculated field
  purchasedDate: string;
  expiryDate?: string;
  licenseKeyOrAgreementId?: string;
  costPerSeat?: number;
  notes?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  clientLicenses?: ClientLicense[];
}

/**
 * ClientLicense Entity Interface
 * Represents the assignment of licenses from a pool to a client
 */
export interface ClientLicense {
  id: string;
  licensePoolId: string;
  clientId: string;
  assignedSeats: number;
  assignmentDate: string;
  status: ClientLicenseStatus;
  expiryDateOverride?: string;
  specificLicenseKeys?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
  licensePool?: LicensePool;
  client?: Client;
}

/**
 * Data Transfer Objects for API requests
 */
export interface CreateLicensePoolDto {
  productName: string;
  vendor: string;
  licenseType: LicenseType;
  totalSeats: number;
  purchasedDate: string;
  expiryDate?: string;
  licenseKeyOrAgreementId?: string;
  costPerSeat?: number;
  notes?: string;
  isActive?: boolean;
}

export interface UpdateLicensePoolDto {
  productName?: string;
  vendor?: string;
  licenseType?: LicenseType;
  totalSeats?: number;
  purchasedDate?: string;
  expiryDate?: string;
  licenseKeyOrAgreementId?: string;
  costPerSeat?: number;
  notes?: string;
  isActive?: boolean;
}

export interface CreateClientLicenseDto {
  licensePoolId: string;
  clientId: string;
  assignedSeats: number;
  assignmentDate: string;
  status?: ClientLicenseStatus;
  expiryDateOverride?: string;
  specificLicenseKeys?: string;
  notes?: string;
}

export interface UpdateClientLicenseDto {
  assignedSeats?: number;
  status?: ClientLicenseStatus;
  expiryDateOverride?: string;
  specificLicenseKeys?: string;
  notes?: string;
}

/**
 * Query Options for filtering licenses
 */
export interface LicensePoolQueryOptions {
  vendor?: string;
  licenseType?: LicenseType;
  isActive?: boolean;
  search?: string;
  page?: number;
  limit?: number;
}

export interface ClientLicenseQueryOptions {
  licensePoolId?: string;
  clientId?: string;
  status?: ClientLicenseStatus;
  page?: number;
  limit?: number;
}

/**
 * API Response interfaces
 */
export interface LicenseApiResponse<T> {
  statusCode: number;
  message: string;
  data: T;
  meta?: {
    count: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

/**
 * License Pool Statistics
 */
export interface LicensePoolStatistics {
  totalPools: number;
  totalSeats: number;
  assignedSeats: number;
  availableSeats: number;
  expiringPools: LicensePool[];
  byLicenseType: Record<LicenseType, number>;
  byVendor: Record<string, number>;
} 