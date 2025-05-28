import { ServiceScope } from './service-scope';

/**
 * Hardware Asset Type Enumeration
 * Defines the different types of hardware assets that can be managed
 */
export enum HardwareAssetType {
  SERVER = 'server',
  WORKSTATION = 'workstation',
  LAPTOP = 'laptop',
  DESKTOP = 'desktop',
  NETWORK_DEVICE = 'network_device',
  FIREWALL = 'firewall',
  SWITCH = 'switch',
  ROUTER = 'router',
  ACCESS_POINT = 'access_point',
  STORAGE_DEVICE = 'storage_device',
  SECURITY_APPLIANCE = 'security_appliance',
  MONITORING_DEVICE = 'monitoring_device',
  PRINTER = 'printer',
  MOBILE_DEVICE = 'mobile_device',
  TABLET = 'tablet',
  OTHER = 'other',
}

/**
 * Hardware Asset Status Enumeration
 * Defines the different lifecycle states of hardware assets
 */
export enum HardwareAssetStatus {
  IN_STOCK = 'in_stock',
  AWAITING_DEPLOYMENT = 'awaiting_deployment',
  IN_USE = 'in_use',
  UNDER_MAINTENANCE = 'under_maintenance',
  AWAITING_REPAIR = 'awaiting_repair',
  RETIRED = 'retired',
  DISPOSED = 'disposed',
  LOST = 'lost',
  STOLEN = 'stolen',
}

/**
 * Hardware Assignment Status Enumeration
 * Defines the different states of hardware assignments to clients
 */
export enum HardwareAssignmentStatus {
  ACTIVE = 'active',
  RETURNED = 'returned',
  REPLACED = 'replaced',
  MAINTENANCE = 'maintenance',
  LOST = 'lost',
  DAMAGED = 'damaged',
  CANCELLED = 'cancelled',
}

/**
 * HardwareAsset Interface
 * Represents hardware inventory items managed by the MSSP
 */
export interface HardwareAsset {
  id: string;
  assetTag: string;
  serialNumber: string | null;
  deviceName: string | null;
  manufacturer: string | null;
  model: string | null;
  assetType: HardwareAssetType;
  status: HardwareAssetStatus;
  purchaseDate: string | null;
  purchaseCost: number | null;
  warrantyExpiryDate: string | null;
  location: string | null;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
  assignments?: ClientHardwareAssignment[];
  
  // Virtual properties
  isAvailable?: boolean;
  isInUse?: boolean;
  isRetired?: boolean;
  displayName?: string;
  isUnderWarranty?: boolean;
}

/**
 * ClientHardwareAssignment Interface
 * Represents the assignment of hardware assets to clients
 */
export interface ClientHardwareAssignment {
  id: string;
  assignmentDate: string;
  status: HardwareAssignmentStatus;
  returnDate: string | null;
  notes: string | null;
  hardwareAssetId: string;
  clientId: string;
  serviceScopeId: string | null;
  createdAt: string;
  updatedAt: string;
  
  // Related entities
  hardwareAsset?: HardwareAsset;
  client?: {
    id: string;
    companyName: string;
    contactName?: string;
    contactEmail?: string;
    contactPhone?: string;
  };
  serviceScope?: ServiceScope;
  
  // Virtual properties
  displayName?: string;
  isActive?: boolean;
}

/**
 * CreateHardwareAssetDto
 * Data Transfer Object for creating new hardware assets
 */
export interface CreateHardwareAssetDto {
  assetTag: string;
  serialNumber?: string;
  deviceName?: string;
  manufacturer?: string;
  model?: string;
  assetType: HardwareAssetType;
  status?: HardwareAssetStatus;
  purchaseDate?: string;
  purchaseCost?: number;
  warrantyExpiryDate?: string;
  location?: string;
  notes?: string;
}

/**
 * UpdateHardwareAssetDto
 * Data Transfer Object for updating hardware assets
 */
export interface UpdateHardwareAssetDto extends Partial<CreateHardwareAssetDto> {}

/**
 * CreateClientHardwareAssignmentDto
 * Data Transfer Object for creating new hardware assignments
 */
export interface CreateClientHardwareAssignmentDto {
  hardwareAssetId: string;
  clientId: string;
  serviceScopeId?: string;
  assignmentDate: string;
  status?: HardwareAssignmentStatus;
  returnDate?: string;
  notes?: string;
}

/**
 * UpdateClientHardwareAssignmentDto
 * Data Transfer Object for updating hardware assignments
 */
export interface UpdateClientHardwareAssignmentDto extends Partial<CreateClientHardwareAssignmentDto> {}

/**
 * HardwareAssetQueryOptions
 * Query options for filtering hardware assets
 */
export interface HardwareAssetQueryOptions {
  assetTag?: string;
  serialNumber?: string;
  assetType?: HardwareAssetType;
  status?: HardwareAssetStatus;
  location?: string;
  manufacturer?: string;
  model?: string;
  page?: number;
  limit?: number;
}

/**
 * AssignmentQueryOptions
 * Query options for filtering hardware assignments
 */
export interface AssignmentQueryOptions {
  status?: HardwareAssignmentStatus;
  clientId?: string;
  hardwareAssetId?: string;
  serviceScopeId?: string;
  page?: number;
  limit?: number;
}

/**
 * PaginatedResult
 * Generic interface for paginated API responses
 */
export interface PaginatedResult<T> {
  data: T[];
  count: number;
  page: number;
  limit: number;
  totalPages: number;
}

/**
 * HardwareAssetWithCurrentAssignment
 * Extended interface that includes current assignment information
 */
export interface HardwareAssetWithCurrentAssignment extends HardwareAsset {
  currentAssignment?: {
    id: string;
    clientName: string;
    serviceScopeName?: string;
    assignmentDate: string;
  };
} 