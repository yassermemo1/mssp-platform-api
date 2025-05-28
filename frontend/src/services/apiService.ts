import axios, { AxiosInstance, AxiosRequestConfig, AxiosResponse } from 'axios';
import { LoginCredentials, LoginResponse, ApiError } from '../types/auth';
import { 
  Service, 
  CreateServiceDto, 
  UpdateServiceDto, 
  UpdateScopeDefinitionTemplateDto,
  ServiceApiResponse,
  ScopeTemplateResponse,
  ServiceQueryOptions,
  ServiceStatistics
} from '../types/service';
import {
  Contract,
  CreateContractDto,
  UpdateContractDto,
  ContractQueryOptions,
  ContractApiResponse,
  ContractStatistics,
  FileUploadResult
} from '../types/contract';
import { Client } from '../types/client';
import {
  ServiceScope,
  CreateServiceScopeDto,
  UpdateServiceScopeDto,
  ProposalQueryOptions,
  Proposal,
  CreateProposalDto,
  UpdateProposalDto
} from '../types/service-scope';
import {
  LicensePool,
  ClientLicense,
  CreateLicensePoolDto,
  UpdateLicensePoolDto,
  CreateClientLicenseDto,
  UpdateClientLicenseDto,
  LicensePoolQueryOptions,
  ClientLicenseQueryOptions,
  LicenseApiResponse,
  LicensePoolStatistics
} from '../types/license';
import {
  HardwareAsset,
  ClientHardwareAssignment,
  CreateHardwareAssetDto,
  UpdateHardwareAssetDto,
  CreateClientHardwareAssignmentDto,
  UpdateClientHardwareAssignmentDto,
  HardwareAssetQueryOptions,
  AssignmentQueryOptions,
  PaginatedResult
} from '../types/hardware';
import {
  FinancialTransaction,
  QueryFinancialTransactionsDto,
  FinancialTransactionApiResponse,
  FinancialTransactionStatistics,
  CreateFinancialTransactionDto,
  UpdateFinancialTransactionDto
} from '../types/financial';

/**
 * API Service for making HTTP requests to the backend
 * Handles authentication headers and common error responses
 */
class ApiService {
  private api: AxiosInstance;
  private readonly baseURL: string;

  constructor() {
    // Configure base URL - adjust if your backend has a different URL or global prefix
    this.baseURL = process.env.REACT_APP_API_URL || 'http://localhost:3000';
    
    this.api = axios.create({
      baseURL: this.baseURL,
      headers: {
        'Content-Type': 'application/json',
      },
      timeout: 10000, // 10 second timeout
    });

    // Request interceptor to add auth token
    this.api.interceptors.request.use(
      (config) => {
        const token = this.getStoredToken();
        if (token && config.headers) {
          config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
      },
      (error) => {
        return Promise.reject(error);
      }
    );

    // Response interceptor for common error handling
    this.api.interceptors.response.use(
      (response) => response,
      (error) => {
        if (error.response?.status === 401) {
          // Token expired or invalid - clear stored token
          this.clearStoredToken();
          // Optionally redirect to login page
          window.location.href = '/login';
        }
        return Promise.reject(this.formatError(error));
      }
    );
  }

  /**
   * Get stored JWT token from localStorage
   */
  private getStoredToken(): string | null {
    return localStorage.getItem('token');
  }

  /**
   * Clear stored JWT token
   */
  private clearStoredToken(): void {
    localStorage.removeItem('token');
  }

  /**
   * Format error response for consistent error handling
   */
  private formatError(error: any): ApiError {
    if (error.response) {
      // Server responded with error status
      return {
        message: error.response.data?.message || 'An error occurred',
        statusCode: error.response.status,
        error: error.response.data?.error,
      };
    } else if (error.request) {
      // Network error
      return {
        message: 'Network error - please check your connection',
        statusCode: 0,
      };
    } else {
      // Other error
      return {
        message: error.message || 'An unexpected error occurred',
        statusCode: 0,
      };
    }
  }

  /**
   * Authentication endpoints
   */
  async login(credentials: LoginCredentials): Promise<LoginResponse> {
    const response: AxiosResponse<LoginResponse> = await this.api.post('/auth/login', credentials);
    return response.data;
  }

  /**
   * Generic HTTP methods for authenticated requests
   */
  async get<T>(url: string, config?: AxiosRequestConfig): Promise<T> {
    const response: AxiosResponse<T> = await this.api.get(url, config);
    return response.data;
  }

  async post<T>(url: string, data?: any, config?: AxiosRequestConfig): Promise<T> {
    const response: AxiosResponse<T> = await this.api.post(url, data, config);
    return response.data;
  }

  async patch<T>(url: string, data?: any, config?: AxiosRequestConfig): Promise<T> {
    const response: AxiosResponse<T> = await this.api.patch(url, data, config);
    return response.data;
  }

  async put<T>(url: string, data?: any, config?: AxiosRequestConfig): Promise<T> {
    const response: AxiosResponse<T> = await this.api.put(url, data, config);
    return response.data;
  }

  async delete<T>(url: string, config?: AxiosRequestConfig): Promise<T> {
    const response: AxiosResponse<T> = await this.api.delete(url, config);
    return response.data;
  }

  /**
   * Check if user is authenticated by verifying token exists
   */
  isAuthenticated(): boolean {
    return !!this.getStoredToken();
  }

  /**
   * Get the current base URL
   */
  getBaseURL(): string {
    return this.baseURL;
  }

  /**
   * Service Management Methods
   */

  /**
   * Get all services with optional filtering
   */
  async getServices(options?: ServiceQueryOptions): Promise<ServiceApiResponse<Service[]>> {
    const params = new URLSearchParams();
    
    if (options?.isActive !== undefined) {
      params.append('isActive', options.isActive.toString());
    }
    if (options?.category) {
      params.append('category', options.category);
    }
    if (options?.deliveryModel) {
      params.append('deliveryModel', options.deliveryModel);
    }
    if (options?.search) {
      params.append('search', options.search);
    }
    if (options?.page) {
      params.append('page', options.page.toString());
    }
    if (options?.limit) {
      params.append('limit', options.limit.toString());
    }

    const url = `/services${params.toString() ? `?${params.toString()}` : ''}`;
    return this.get<ServiceApiResponse<Service[]>>(url);
  }

  /**
   * Get a single service by ID
   */
  async getService(id: string): Promise<ServiceApiResponse<Service>> {
    return this.get<ServiceApiResponse<Service>>(`/services/${id}`);
  }

  /**
   * Create a new service
   */
  async createService(serviceData: CreateServiceDto): Promise<ServiceApiResponse<Service>> {
    return this.post<ServiceApiResponse<Service>>('/services', serviceData);
  }

  /**
   * Update an existing service
   */
  async updateService(id: string, serviceData: UpdateServiceDto): Promise<ServiceApiResponse<Service>> {
    return this.patch<ServiceApiResponse<Service>>(`/services/${id}`, serviceData);
  }

  /**
   * Soft delete a service
   */
  async deleteService(id: string): Promise<ServiceApiResponse<Service>> {
    return this.delete<ServiceApiResponse<Service>>(`/services/${id}`);
  }

  /**
   * Reactivate a service
   */
  async reactivateService(id: string): Promise<ServiceApiResponse<Service>> {
    return this.patch<ServiceApiResponse<Service>>(`/services/${id}/reactivate`);
  }

  /**
   * Get service statistics
   */
  async getServiceStatistics(): Promise<ServiceApiResponse<ServiceStatistics>> {
    return this.get<ServiceApiResponse<ServiceStatistics>>('/services/statistics');
  }

  /**
   * Scope Definition Template Methods
   */

  /**
   * Get scope definition template for a service
   */
  async getScopeDefinitionTemplate(serviceId: string): Promise<ServiceApiResponse<ScopeTemplateResponse>> {
    return this.get<ServiceApiResponse<ScopeTemplateResponse>>(`/services/${serviceId}/scope-template`);
  }

  /**
   * Update scope definition template for a service
   */
  async updateScopeDefinitionTemplate(
    serviceId: string, 
    templateData: UpdateScopeDefinitionTemplateDto
  ): Promise<ServiceApiResponse<Partial<Service>>> {
    return this.put<ServiceApiResponse<Partial<Service>>>(`/services/${serviceId}/scope-template`, templateData);
  }

  /**
   * Contract Management Methods
   */

  /**
   * Get all contracts with optional filtering
   */
  async getContracts(options?: ContractQueryOptions): Promise<ContractApiResponse<Contract[]>> {
    const params = new URLSearchParams();
    
    if (options?.clientId) {
      params.append('clientId', options.clientId);
    }
    if (options?.status) {
      params.append('status', options.status);
    }
    if (options?.expiringSoonDays) {
      params.append('expiringSoonDays', options.expiringSoonDays.toString());
    }
    if (options?.search) {
      params.append('search', options.search);
    }
    if (options?.page) {
      params.append('page', options.page.toString());
    }
    if (options?.limit) {
      params.append('limit', options.limit.toString());
    }

    const url = `/contracts${params.toString() ? `?${params.toString()}` : ''}`;
    return this.get<ContractApiResponse<Contract[]>>(url);
  }

  /**
   * Get a single contract by ID
   */
  async getContract(id: string): Promise<ContractApiResponse<Contract>> {
    return this.get<ContractApiResponse<Contract>>(`/contracts/${id}`);
  }

  /**
   * Create a new contract
   */
  async createContract(contractData: CreateContractDto): Promise<ContractApiResponse<Contract>> {
    return this.post<ContractApiResponse<Contract>>('/contracts', contractData);
  }

  /**
   * Update an existing contract
   */
  async updateContract(id: string, contractData: UpdateContractDto): Promise<ContractApiResponse<Contract>> {
    return this.patch<ContractApiResponse<Contract>>(`/contracts/${id}`, contractData);
  }

  /**
   * Soft delete a contract (terminate)
   */
  async deleteContract(id: string): Promise<ContractApiResponse<Contract>> {
    return this.delete<ContractApiResponse<Contract>>(`/contracts/${id}`);
  }

  /**
   * Get contract statistics
   */
  async getContractStatistics(): Promise<ContractApiResponse<ContractStatistics>> {
    return this.get<ContractApiResponse<ContractStatistics>>('/contracts/statistics');
  }

  /**
   * Get contracts expiring soon
   */
  async getExpiringContracts(days?: number): Promise<ContractApiResponse<Contract[]>> {
    const url = `/contracts/expiring${days ? `?days=${days}` : ''}`;
    return this.get<ContractApiResponse<Contract[]>>(url);
  }

  /**
   * Upload contract document
   */
  async uploadContractDocument(contractId: string, file: File): Promise<ContractApiResponse<Contract>> {
    const formData = new FormData();
    formData.append('file', file);

    return this.post<ContractApiResponse<Contract>>(
      `/contracts/${contractId}/upload-document`,
      formData,
      {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      }
    );
  }

  /**
   * Generic file upload
   */
  async uploadFile(entityType: string, file: File): Promise<{ message: string; file: FileUploadResult }> {
    const formData = new FormData();
    formData.append('file', file);

    return this.post<{ message: string; file: FileUploadResult }>(
      `/files/upload/${entityType}`,
      formData,
      {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      }
    );
  }

  /**
   * Client Management Methods (Basic for contract forms)
   */

  /**
   * Get all clients (for dropdowns)
   */
  async getClients(): Promise<{ statusCode: number; message: string; data: Client[] }> {
    return this.get<{ statusCode: number; message: string; data: Client[] }>('/clients');
  }

  /**
   * User Management Methods
   */

  /**
   * Get all users for assignee selection
   */
  async getUsers(): Promise<{
    message: string;
    users: Array<{
      id: string;
      email: string;
      firstName?: string;
      lastName?: string;
      fullName?: string;
      role: string;
    }>;
  }> {
    return this.get<{
      message: string;
      users: Array<{
        id: string;
        email: string;
        firstName?: string;
        lastName?: string;
        fullName?: string;
        role: string;
      }>;
    }>('/users/all');
  }

  /**
   * Service Scope Management Methods
   */

  /**
   * Get service scopes for a contract
   */
  async getServiceScopes(contractId: string): Promise<ContractApiResponse<ServiceScope[]>> {
    return this.get<ContractApiResponse<ServiceScope[]>>(`/contracts/${contractId}/service-scopes`);
  }

  /**
   * Get a single service scope by ID
   */
  async getServiceScope(serviceScopeId: string): Promise<ContractApiResponse<ServiceScope>> {
    return this.get<ContractApiResponse<ServiceScope>>(`/service-scopes/${serviceScopeId}`);
  }

  /**
   * Create a new service scope for a contract
   */
  async createServiceScope(contractId: string, serviceScopeData: CreateServiceScopeDto): Promise<ContractApiResponse<ServiceScope>> {
    return this.post<ContractApiResponse<ServiceScope>>(`/contracts/${contractId}/service-scopes`, serviceScopeData);
  }

  /**
   * Update an existing service scope
   */
  async updateServiceScope(serviceScopeId: string, serviceScopeData: UpdateServiceScopeDto): Promise<ContractApiResponse<ServiceScope>> {
    return this.patch<ContractApiResponse<ServiceScope>>(`/service-scopes/${serviceScopeId}`, serviceScopeData);
  }

  /**
   * Delete a service scope
   */
  async deleteServiceScope(serviceScopeId: string): Promise<ContractApiResponse<ServiceScope>> {
    return this.delete<ContractApiResponse<ServiceScope>>(`/service-scopes/${serviceScopeId}`);
  }

  /**
   * Upload SAF document for a service scope
   */
  async uploadSAFDocument(serviceScopeId: string, file: File): Promise<ContractApiResponse<ServiceScope>> {
    const formData = new FormData();
    formData.append('file', file);

    return this.post<ContractApiResponse<ServiceScope>>(
      `/service-scopes/${serviceScopeId}/upload-saf`,
      formData,
      {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      }
    );
  }

  /**
   * Proposal Management Methods
   */

  /**
   * Get proposals for a service scope
   */
  async getProposals(serviceScopeId: string, options?: ProposalQueryOptions): Promise<ContractApiResponse<Proposal[]>> {
    const params = new URLSearchParams();
    
    if (options?.proposalType) {
      params.append('proposalType', options.proposalType);
    }
    if (options?.status) {
      params.append('status', options.status);
    }
    if (options?.search) {
      params.append('search', options.search);
    }
    if (options?.page) {
      params.append('page', options.page.toString());
    }
    if (options?.limit) {
      params.append('limit', options.limit.toString());
    }

    const url = `/service-scopes/${serviceScopeId}/proposals${params.toString() ? `?${params.toString()}` : ''}`;
    return this.get<ContractApiResponse<Proposal[]>>(url);
  }

  /**
   * Get a single proposal by ID
   */
  async getProposal(proposalId: string): Promise<ContractApiResponse<Proposal>> {
    return this.get<ContractApiResponse<Proposal>>(`/proposals/${proposalId}`);
  }

  /**
   * Create a new proposal for a service scope
   */
  async createProposal(serviceScopeId: string, proposalData: CreateProposalDto): Promise<ContractApiResponse<Proposal>> {
    return this.post<ContractApiResponse<Proposal>>(`/service-scopes/${serviceScopeId}/proposals`, proposalData);
  }

  /**
   * Update an existing proposal
   */
  async updateProposal(proposalId: string, proposalData: UpdateProposalDto): Promise<ContractApiResponse<Proposal>> {
    return this.patch<ContractApiResponse<Proposal>>(`/proposals/${proposalId}`, proposalData);
  }

  /**
   * Delete a proposal
   */
  async deleteProposal(proposalId: string): Promise<ContractApiResponse<Proposal>> {
    return this.delete<ContractApiResponse<Proposal>>(`/proposals/${proposalId}`);
  }

  /**
   * Upload proposal document
   */
  async uploadProposalDocument(proposalId: string, file: File): Promise<ContractApiResponse<Proposal>> {
    const formData = new FormData();
    formData.append('file', file);

    return this.post<ContractApiResponse<Proposal>>(
      `/proposals/${proposalId}/upload-document`,
      formData,
      {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      }
    );
  }

  /**
   * Get all proposals across all service scopes (admin overview)
   */
  async getAllProposals(options?: ProposalQueryOptions): Promise<ContractApiResponse<Proposal[]>> {
    const params = new URLSearchParams();
    
    if (options?.proposalType) {
      params.append('proposalType', options.proposalType);
    }
    if (options?.status) {
      params.append('status', options.status);
    }
    if (options?.assigneeUserId) {
      params.append('assigneeUserId', options.assigneeUserId);
    }
    if (options?.clientId) {
      params.append('clientId', options.clientId);
    }
    if (options?.currency) {
      params.append('currency', options.currency);
    }
    if (options?.dateFrom) {
      params.append('dateFrom', options.dateFrom);
    }
    if (options?.dateTo) {
      params.append('dateTo', options.dateTo);
    }
    if (options?.submittedDateFrom) {
      params.append('submittedDateFrom', options.submittedDateFrom);
    }
    if (options?.submittedDateTo) {
      params.append('submittedDateTo', options.submittedDateTo);
    }
    if (options?.search) {
      params.append('search', options.search);
    }
    if (options?.page) {
      params.append('page', options.page.toString());
    }
    if (options?.limit) {
      params.append('limit', options.limit.toString());
    }
    if (options?.sortBy) {
      params.append('sortBy', options.sortBy);
    }
    if (options?.sortDirection) {
      params.append('sortDirection', options.sortDirection);
    }

    const url = `/proposals${params.toString() ? `?${params.toString()}` : ''}`;
    return this.get<ContractApiResponse<Proposal[]>>(url);
  }

  /**
   * Get proposal statistics for dashboard analytics
   */
  async getProposalStatistics(clientId?: string): Promise<ContractApiResponse<{
    total: number;
    byStatus: Record<string, number>;
    byType: Record<string, number>;
    totalValue: number;
    averageValue: number;
    expiringSoon: number;
  }>> {
    const params = new URLSearchParams();
    if (clientId) {
      params.append('clientId', clientId);
    }
    
    const url = `/proposals/statistics${params.toString() ? `?${params.toString()}` : ''}`;
    return this.get<ContractApiResponse<{
      total: number;
      byStatus: Record<string, number>;
      byType: Record<string, number>;
      totalValue: number;
      averageValue: number;
      expiringSoon: number;
    }>>(url);
  }

  /**
   * License Management Methods
   */

  /**
   * License Pool Management
   */

  /**
   * Get all license pools with optional filtering
   */
  async getLicensePools(options?: LicensePoolQueryOptions): Promise<LicenseApiResponse<LicensePool[]>> {
    const params = new URLSearchParams();
    
    if (options?.vendor) {
      params.append('vendor', options.vendor);
    }
    if (options?.licenseType) {
      params.append('licenseType', options.licenseType);
    }
    if (options?.isActive !== undefined) {
      params.append('isActive', options.isActive.toString());
    }
    if (options?.search) {
      params.append('search', options.search);
    }
    if (options?.page) {
      params.append('page', options.page.toString());
    }
    if (options?.limit) {
      params.append('limit', options.limit.toString());
    }

    const url = `/license-pools${params.toString() ? `?${params.toString()}` : ''}`;
    return this.get<LicenseApiResponse<LicensePool[]>>(url);
  }

  /**
   * Get a single license pool by ID
   */
  async getLicensePool(id: string): Promise<LicenseApiResponse<LicensePool>> {
    return this.get<LicenseApiResponse<LicensePool>>(`/license-pools/${id}`);
  }

  /**
   * Create a new license pool
   */
  async createLicensePool(licensePoolData: CreateLicensePoolDto): Promise<LicenseApiResponse<LicensePool>> {
    return this.post<LicenseApiResponse<LicensePool>>('/license-pools', licensePoolData);
  }

  /**
   * Update an existing license pool
   */
  async updateLicensePool(id: string, licensePoolData: UpdateLicensePoolDto): Promise<LicenseApiResponse<LicensePool>> {
    return this.patch<LicenseApiResponse<LicensePool>>(`/license-pools/${id}`, licensePoolData);
  }

  /**
   * Delete (deactivate) a license pool
   */
  async deleteLicensePool(id: string): Promise<LicenseApiResponse<LicensePool>> {
    return this.delete<LicenseApiResponse<LicensePool>>(`/license-pools/${id}`);
  }

  /**
   * Reactivate a license pool
   */
  async reactivateLicensePool(id: string): Promise<LicenseApiResponse<LicensePool>> {
    return this.patch<LicenseApiResponse<LicensePool>>(`/license-pools/${id}/reactivate`, {});
  }

  /**
   * Get license pool statistics
   */
  async getLicensePoolStatistics(): Promise<LicenseApiResponse<LicensePoolStatistics>> {
    return this.get<LicenseApiResponse<LicensePoolStatistics>>('/license-pools/statistics');
  }

  /**
   * Client License Management
   */

  /**
   * Get all client licenses with optional filtering
   */
  async getClientLicenses(options?: ClientLicenseQueryOptions): Promise<LicenseApiResponse<ClientLicense[]>> {
    const params = new URLSearchParams();
    
    if (options?.licensePoolId) {
      params.append('licensePoolId', options.licensePoolId);
    }
    if (options?.clientId) {
      params.append('clientId', options.clientId);
    }
    if (options?.status) {
      params.append('status', options.status);
    }
    if (options?.page) {
      params.append('page', options.page.toString());
    }
    if (options?.limit) {
      params.append('limit', options.limit.toString());
    }

    const url = `/client-licenses${params.toString() ? `?${params.toString()}` : ''}`;
    return this.get<LicenseApiResponse<ClientLicense[]>>(url);
  }

  /**
   * Get client licenses for a specific license pool
   */
  async getClientLicensesByPool(licensePoolId: string): Promise<LicenseApiResponse<ClientLicense[]>> {
    return this.get<LicenseApiResponse<ClientLicense[]>>(`/license-pools/${licensePoolId}/assignments`);
  }

  /**
   * Get client licenses for a specific client
   */
  async getClientLicensesByClient(clientId: string): Promise<LicenseApiResponse<ClientLicense[]>> {
    return this.get<LicenseApiResponse<ClientLicense[]>>(`/clients/${clientId}/licenses`);
  }

  /**
   * Get a single client license by ID
   */
  async getClientLicense(id: string): Promise<LicenseApiResponse<ClientLicense>> {
    return this.get<LicenseApiResponse<ClientLicense>>(`/client-licenses/${id}`);
  }

  /**
   * Create a new client license assignment
   */
  async createClientLicense(clientLicenseData: CreateClientLicenseDto): Promise<LicenseApiResponse<ClientLicense>> {
    return this.post<LicenseApiResponse<ClientLicense>>('/client-licenses', clientLicenseData);
  }

  /**
   * Update an existing client license assignment
   */
  async updateClientLicense(id: string, clientLicenseData: UpdateClientLicenseDto): Promise<LicenseApiResponse<ClientLicense>> {
    return this.patch<LicenseApiResponse<ClientLicense>>(`/client-licenses/${id}`, clientLicenseData);
  }

  /**
   * Delete (revoke) a client license assignment
   */
  async deleteClientLicense(id: string): Promise<LicenseApiResponse<ClientLicense>> {
    return this.delete<LicenseApiResponse<ClientLicense>>(`/client-licenses/${id}`);
  }

  /**
   * Hardware Management Methods
   */

  /**
   * Hardware Asset Management
   */

  /**
   * Get all hardware assets with optional filtering and pagination
   */
  async getHardwareAssets(options?: HardwareAssetQueryOptions): Promise<PaginatedResult<HardwareAsset>> {
    const params = new URLSearchParams();
    
    if (options?.assetTag) {
      params.append('assetTag', options.assetTag);
    }
    if (options?.serialNumber) {
      params.append('serialNumber', options.serialNumber);
    }
    if (options?.assetType) {
      params.append('assetType', options.assetType);
    }
    if (options?.status) {
      params.append('status', options.status);
    }
    if (options?.location) {
      params.append('location', options.location);
    }
    if (options?.manufacturer) {
      params.append('manufacturer', options.manufacturer);
    }
    if (options?.model) {
      params.append('model', options.model);
    }
    if (options?.page) {
      params.append('page', options.page.toString());
    }
    if (options?.limit) {
      params.append('limit', options.limit.toString());
    }

    const url = `/hardware-assets${params.toString() ? `?${params.toString()}` : ''}`;
    return this.get<PaginatedResult<HardwareAsset>>(url);
  }

  /**
   * Get available hardware assets for assignment (IN_STOCK, AWAITING_DEPLOYMENT)
   */
  async getAvailableHardwareAssets(): Promise<HardwareAsset[]> {
    const response = await this.getHardwareAssets({
      status: undefined, // Will be filtered by backend to show available assets
      limit: 1000 // Get a large number for dropdown purposes
    });
    return response.data.filter(asset => 
      asset.status === 'in_stock' || asset.status === 'awaiting_deployment'
    );
  }

  /**
   * Get a single hardware asset by ID
   */
  async getHardwareAsset(id: string): Promise<HardwareAsset> {
    return this.get<HardwareAsset>(`/hardware-assets/${id}`);
  }

  /**
   * Create a new hardware asset
   */
  async createHardwareAsset(assetData: CreateHardwareAssetDto): Promise<HardwareAsset> {
    return this.post<HardwareAsset>('/hardware-assets', assetData);
  }

  /**
   * Update an existing hardware asset
   */
  async updateHardwareAsset(id: string, assetData: UpdateHardwareAssetDto): Promise<HardwareAsset> {
    return this.patch<HardwareAsset>(`/hardware-assets/${id}`, assetData);
  }

  /**
   * Update hardware asset status (for manual status changes)
   */
  async updateHardwareAssetStatus(id: string, status: string): Promise<HardwareAsset> {
    return this.patch<HardwareAsset>(`/hardware-assets/${id}`, { status });
  }

  /**
   * Client Hardware Assignment Management
   */

  /**
   * Get all hardware assignments with optional filtering
   */
  async getHardwareAssignments(options?: AssignmentQueryOptions): Promise<PaginatedResult<ClientHardwareAssignment>> {
    const params = new URLSearchParams();
    
    if (options?.status) {
      params.append('status', options.status);
    }
    if (options?.clientId) {
      params.append('clientId', options.clientId);
    }
    if (options?.hardwareAssetId) {
      params.append('hardwareAssetId', options.hardwareAssetId);
    }
    if (options?.serviceScopeId) {
      params.append('serviceScopeId', options.serviceScopeId);
    }
    if (options?.page) {
      params.append('page', options.page.toString());
    }
    if (options?.limit) {
      params.append('limit', options.limit.toString());
    }

    const url = `/client-hardware-assignments${params.toString() ? `?${params.toString()}` : ''}`;
    return this.get<PaginatedResult<ClientHardwareAssignment>>(url);
  }

  /**
   * Get hardware assignments for a specific hardware asset
   */
  async getHardwareAssetAssignments(assetId: string): Promise<ClientHardwareAssignment[]> {
    return this.get<ClientHardwareAssignment[]>(`/hardware-assets/${assetId}/assignments`);
  }

  /**
   * Get hardware assignments for a specific client
   */
  async getClientHardwareAssignments(clientId: string): Promise<ClientHardwareAssignment[]> {
    return this.get<ClientHardwareAssignment[]>(`/clients/${clientId}/hardware-assignments`);
  }

  /**
   * Get hardware assignments for a specific service scope
   */
  async getServiceScopeHardwareAssignments(serviceScopeId: string): Promise<ClientHardwareAssignment[]> {
    return this.get<ClientHardwareAssignment[]>(`/service-scopes/${serviceScopeId}/hardware-assignments`);
  }

  /**
   * Get a single hardware assignment by ID
   */
  async getHardwareAssignment(id: string): Promise<ClientHardwareAssignment> {
    return this.get<ClientHardwareAssignment>(`/client-hardware-assignments/${id}`);
  }

  /**
   * Create a new hardware assignment
   */
  async createHardwareAssignment(assignmentData: CreateClientHardwareAssignmentDto): Promise<ClientHardwareAssignment> {
    return this.post<ClientHardwareAssignment>('/client-hardware-assignments', assignmentData);
  }

  /**
   * Update an existing hardware assignment
   */
  async updateHardwareAssignment(id: string, assignmentData: UpdateClientHardwareAssignmentDto): Promise<ClientHardwareAssignment> {
    return this.patch<ClientHardwareAssignment>(`/client-hardware-assignments/${id}`, assignmentData);
  }

  /**
   * Conclude/return a hardware assignment
   */
  async concludeHardwareAssignment(id: string, returnDate?: string, notes?: string): Promise<ClientHardwareAssignment> {
    return this.patch<ClientHardwareAssignment>(`/client-hardware-assignments/${id}`, {
      status: 'returned',
      returnDate: returnDate || new Date().toISOString().split('T')[0],
      notes
    });
  }

  /**
   * Get service scopes for a specific client (for assignment dropdown)
   */
  async getClientServiceScopes(clientId: string): Promise<ServiceScope[]> {
    return this.get<ServiceScope[]>(`/clients/${clientId}/service-scopes`);
  }

  /**
   * Bulk Operations for Hardware Management
   */

  /**
   * Bulk assign multiple hardware assets to a client
   */
  async bulkAssignHardwareAssets(assignmentData: {
    hardwareAssetIds: string[];
    clientId: string;
    serviceScopeId?: string;
    assignmentDate: string;
    notes?: string;
  }): Promise<ClientHardwareAssignment[]> {
    return this.post<ClientHardwareAssignment[]>('/client-hardware-assignments/bulk-assign', assignmentData);
  }

  /**
   * Bulk return multiple hardware assignments
   */
  async bulkReturnHardwareAssignments(data: {
    assignmentIds: string[];
    returnDate?: string;
    notes?: string;
  }): Promise<ClientHardwareAssignment[]> {
    return this.patch<ClientHardwareAssignment[]>('/client-hardware-assignments/bulk-return', data);
  }

  /**
   * Bulk update hardware asset statuses
   */
  async bulkUpdateHardwareAssetStatus(data: {
    assetIds: string[];
    status: string;
    notes?: string;
  }): Promise<HardwareAsset[]> {
    return this.patch<HardwareAsset[]>('/hardware-assets/bulk-status-update', data);
  }

  /**
   * Transfer hardware assignments from one client to another
   */
  async transferHardwareAssignments(data: {
    assignmentIds: string[];
    newClientId: string;
    newServiceScopeId?: string;
    transferDate?: string;
    notes?: string;
  }): Promise<ClientHardwareAssignment[]> {
    return this.patch<ClientHardwareAssignment[]>('/client-hardware-assignments/bulk-transfer', data);
  }

  /**
   * Get hardware assignment statistics
   */
  async getHardwareAssignmentStatistics(): Promise<{
    totalAssignments: number;
    activeAssignments: number;
    returnedAssignments: number;
    lostAssignments: number;
    damagedAssignments: number;
    assignmentsByClient: Array<{ clientId: string; clientName: string; count: number }>;
    assignmentsByAssetType: Array<{ assetType: string; count: number }>;
    recentAssignments: ClientHardwareAssignment[];
  }> {
    return this.get('/client-hardware-assignments/statistics');
  }

  /**
   * Get hardware asset statistics
   */
  async getHardwareAssetStatistics(): Promise<{
    totalAssets: number;
    availableAssets: number;
    assignedAssets: number;
    maintenanceAssets: number;
    retiredAssets: number;
    assetsByType: Array<{ assetType: string; count: number }>;
    assetsByLocation: Array<{ location: string; count: number }>;
    assetsByManufacturer: Array<{ manufacturer: string; count: number }>;
    lowStockAlerts: Array<{ assetType: string; available: number; threshold: number }>;
  }> {
    return this.get('/hardware-assets/statistics');
  }

  /**
   * Search hardware assets by multiple criteria
   */
  async searchHardwareAssets(searchTerm: string): Promise<HardwareAsset[]> {
    const params = new URLSearchParams();
    params.append('search', searchTerm);
    return this.get<HardwareAsset[]>(`/hardware-assets/search?${params.toString()}`);
  }

  /**
   * Get hardware assignment history for an asset
   */
  async getHardwareAssetHistory(assetId: string): Promise<ClientHardwareAssignment[]> {
    return this.get<ClientHardwareAssignment[]>(`/hardware-assets/${assetId}/history`);
  }

  /**
   * Get overdue hardware assignments (past expected return date)
   */
  async getOverdueHardwareAssignments(): Promise<ClientHardwareAssignment[]> {
    return this.get<ClientHardwareAssignment[]>('/client-hardware-assignments/overdue');
  }

  /**
   * Generate hardware assignment report
   */
  async generateHardwareAssignmentReport(options: {
    startDate?: string;
    endDate?: string;
    clientId?: string;
    assetType?: string;
    format?: 'pdf' | 'excel' | 'csv';
  }): Promise<Blob> {
    const params = new URLSearchParams();
    
    if (options.startDate) params.append('startDate', options.startDate);
    if (options.endDate) params.append('endDate', options.endDate);
    if (options.clientId) params.append('clientId', options.clientId);
    if (options.assetType) params.append('assetType', options.assetType);
    if (options.format) params.append('format', options.format);

    const response = await this.api.get(`/client-hardware-assignments/report?${params.toString()}`, {
      responseType: 'blob'
    });
    
    return response.data;
  }

  /**
   * Delete a hardware asset (soft delete)
   */
  async deleteHardwareAsset(id: string): Promise<HardwareAsset> {
    return this.delete<HardwareAsset>(`/hardware-assets/${id}`);
  }

  /**
   * Delete a hardware assignment
   */
  async deleteHardwareAssignment(id: string): Promise<ClientHardwareAssignment> {
    return this.delete<ClientHardwareAssignment>(`/client-hardware-assignments/${id}`);
  }

  /**
   * Check asset availability for assignment
   */
  async checkAssetAvailability(assetId: string): Promise<{
    available: boolean;
    currentAssignment?: ClientHardwareAssignment;
    reason?: string;
  }> {
    return this.get(`/hardware-assets/${assetId}/availability`);
  }

  /**
   * Get recommended assets for client based on their service scopes
   */
  async getRecommendedAssetsForClient(clientId: string): Promise<HardwareAsset[]> {
    return this.get<HardwareAsset[]>(`/clients/${clientId}/recommended-assets`);
  }

  /**
   * Financial Transaction Management Methods
   */

  /**
   * Get all financial transactions with optional filtering and pagination
   */
  async getFinancialTransactions(options?: QueryFinancialTransactionsDto): Promise<FinancialTransactionApiResponse<FinancialTransaction[]>> {
    const params = new URLSearchParams();
    
    if (options?.type) params.append('type', options.type);
    if (options?.status) params.append('status', options.status);
    if (options?.clientId) params.append('clientId', options.clientId);
    if (options?.contractId) params.append('contractId', options.contractId);
    if (options?.serviceScopeId) params.append('serviceScopeId', options.serviceScopeId);
    if (options?.hardwareAssetId) params.append('hardwareAssetId', options.hardwareAssetId);
    if (options?.recordedByUserId) params.append('recordedByUserId', options.recordedByUserId);
    if (options?.transactionDateFrom) params.append('transactionDateFrom', options.transactionDateFrom);
    if (options?.transactionDateTo) params.append('transactionDateTo', options.transactionDateTo);
    if (options?.page) params.append('page', options.page.toString());
    if (options?.limit) params.append('limit', options.limit.toString());
    if (options?.includeRelations) params.append('includeRelations', options.includeRelations.toString());

    const queryString = params.toString();
    const url = queryString ? `/financial-transactions?${queryString}` : '/financial-transactions';
    
    return this.get<FinancialTransactionApiResponse<FinancialTransaction[]>>(url);
  }

  /**
   * Get a specific financial transaction by ID
   */
  async getFinancialTransaction(id: string): Promise<FinancialTransactionApiResponse<FinancialTransaction>> {
    return this.get<FinancialTransactionApiResponse<FinancialTransaction>>(`/financial-transactions/${id}`);
  }

  /**
   * Create a new financial transaction
   */
  async createFinancialTransaction(transactionData: CreateFinancialTransactionDto): Promise<FinancialTransactionApiResponse<FinancialTransaction>> {
    return this.post<FinancialTransactionApiResponse<FinancialTransaction>>('/financial-transactions', transactionData);
  }

  /**
   * Update an existing financial transaction
   */
  async updateFinancialTransaction(id: string, transactionData: UpdateFinancialTransactionDto): Promise<FinancialTransactionApiResponse<FinancialTransaction>> {
    return this.patch<FinancialTransactionApiResponse<FinancialTransaction>>(`/financial-transactions/${id}`, transactionData);
  }

  /**
   * Delete a financial transaction
   */
  async deleteFinancialTransaction(id: string): Promise<FinancialTransactionApiResponse<FinancialTransaction>> {
    return this.delete<FinancialTransactionApiResponse<FinancialTransaction>>(`/financial-transactions/${id}`);
  }

  /**
   * Get financial transaction statistics
   */
  async getFinancialTransactionStatistics(): Promise<FinancialTransactionApiResponse<FinancialTransactionStatistics>> {
    return this.get<FinancialTransactionApiResponse<FinancialTransactionStatistics>>('/financial-transactions/statistics');
  }

  /**
   * Get contracts for dropdown selection (simplified)
   */
  async getContractsForDropdown(): Promise<Array<{ id: string; name: string; clientName?: string }>> {
    const response = await this.getContracts({ limit: 100 });
    return response.data.map(contract => ({
      id: contract.id,
      name: contract.contractName,
      clientName: contract.client?.companyName || `Client ID: ${contract.clientId}`
    }));
  }

  /**
   * Get clients for dropdown selection (simplified)
   */
  async getClientsForDropdown(): Promise<Array<{ id: string; name: string }>> {
    const response = await this.getClients();
    return response.data.map(client => ({
      id: client.id,
      name: client.companyName
    }));
  }
}

// Export singleton instance
export const apiService = new ApiService();
export default apiService; 