import {
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, FindManyOptions, Like, Between, Not } from 'typeorm';
import { ServiceScope } from '../../entities/service-scope.entity';
import { Contract } from '../../entities/contract.entity';
import { Service } from '../../entities/service.entity';
import { CreateServiceScopeDto, UpdateServiceScopeDto, ServiceScopeQueryDto } from './dto';
import { SAFStatus } from '../../enums';

/**
 * Interface for paginated service scope results
 */
export interface PaginatedServiceScopes {
  data: ServiceScope[];
  count: number;
  totalPages: number;
  page: number;
  limit: number;
}

/**
 * ServiceScopesService
 * Business logic for comprehensive service scope management
 * 
 * This service handles:
 * - Service scope CRUD operations with validation
 * - Contract-service linking and relationship management
 * - Scope detail management with dynamic configuration
 * - Pricing calculations and financial tracking
 * - SAF (Service Activation Form) lifecycle management
 * - Advanced querying with filtering and pagination
 */
@Injectable()
export class ServiceScopesService {
  private readonly logger = new Logger(ServiceScopesService.name);

  constructor(
    @InjectRepository(ServiceScope)
    private readonly serviceScopeRepository: Repository<ServiceScope>,
    @InjectRepository(Contract)
    private readonly contractRepository: Repository<Contract>,
    @InjectRepository(Service)
    private readonly serviceRepository: Repository<Service>,
  ) {}

  /**
   * Create a new service scope for a specific contract
   * This establishes the link between a contract and a service with specific configuration
   * 
   * @param contractId - UUID of the parent contract
   * @param createServiceScopeDto - Service scope data
   * @param currentUser - Current authenticated user for audit
   * @returns Promise<ServiceScope> - The created service scope
   * @throws NotFoundException - If contract or service doesn't exist
   * @throws ConflictException - If service already exists in the contract
   */
  async createForContract(
    contractId: string,
    createServiceScopeDto: CreateServiceScopeDto,
    currentUser: any,
  ): Promise<ServiceScope> {
    this.logger.log(
      `Creating service scope for contract: ${contractId} with service: ${createServiceScopeDto.serviceId}`,
    );

    try {
      // Validate that the contract exists
      const contract = await this.contractRepository.findOne({
        where: { id: contractId },
      });

      if (!contract) {
        throw new NotFoundException(`Contract with ID '${contractId}' not found`);
      }

      // Validate that the service exists and is active
      const service = await this.serviceRepository.findOne({
        where: { id: createServiceScopeDto.serviceId, isActive: true },
      });

      if (!service) {
        throw new NotFoundException(
          `Active service with ID '${createServiceScopeDto.serviceId}' not found`,
        );
      }

      // Check for duplicate service in the same contract
      const existingServiceScope = await this.serviceScopeRepository.findOne({
        where: {
          contractId: contractId,
          serviceId: createServiceScopeDto.serviceId,
        },
      });

      if (existingServiceScope) {
        throw new ConflictException(
          `Service '${service.name}' is already included in this contract`,
        );
      }

      // Create the service scope
      const serviceScope = this.serviceScopeRepository.create({
        contractId: contractId,
        serviceId: createServiceScopeDto.serviceId,
        scopeDetails: createServiceScopeDto.scopeDetails,
        price: createServiceScopeDto.price,
        quantity: createServiceScopeDto.quantity,
        unit: createServiceScopeDto.unit,
        notes: createServiceScopeDto.notes,
        safServiceStartDate: createServiceScopeDto.safServiceStartDate
          ? new Date(createServiceScopeDto.safServiceStartDate)
          : null,
        safServiceEndDate: createServiceScopeDto.safServiceEndDate
          ? new Date(createServiceScopeDto.safServiceEndDate)
          : null,
        safStatus: createServiceScopeDto.safStatus || SAFStatus.NOT_INITIATED,
        isActive: true,
      });

      const savedServiceScope = await this.serviceScopeRepository.save(serviceScope);

      this.logger.log(
        `Service scope created successfully: ${savedServiceScope.id} for contract: ${contractId}`,
      );

      // Return with relationships loaded
      return this.findOne(savedServiceScope.id);
    } catch (error) {
      if (
        error instanceof NotFoundException ||
        error instanceof ConflictException
      ) {
        throw error;
      }

      this.logger.error(
        `Failed to create service scope for contract ${contractId}: ${error.message}`,
        error.stack,
      );
      throw new BadRequestException('Failed to create service scope');
    }
  }

  /**
   * Find all service scopes with filtering and pagination
   * 
   * @param queryDto - Query parameters for filtering and pagination
   * @returns Promise<PaginatedServiceScopes> - Paginated results
   */
  async findAll(queryDto: ServiceScopeQueryDto): Promise<PaginatedServiceScopes> {
    this.logger.log('Retrieving service scopes with filters', queryDto);

    try {
      const {
        contractId,
        serviceId,
        safStatus,
        isActive,
        search,
        minPrice,
        maxPrice,
        page = 1,
        limit = 50,
        sortBy = 'createdAt',
        sortOrder = 'DESC',
      } = queryDto;

      const queryBuilder = this.serviceScopeRepository.createQueryBuilder('serviceScope')
        .leftJoinAndSelect('serviceScope.contract', 'contract')
        .leftJoinAndSelect('serviceScope.service', 'service')
        .leftJoinAndSelect('contract.client', 'client');

      // Apply filters
      if (contractId) {
        queryBuilder.andWhere('serviceScope.contractId = :contractId', { contractId });
      }

      if (serviceId) {
        queryBuilder.andWhere('serviceScope.serviceId = :serviceId', { serviceId });
      }

      if (safStatus) {
        queryBuilder.andWhere('serviceScope.safStatus = :safStatus', { safStatus });
      }

      if (isActive !== undefined) {
        queryBuilder.andWhere('serviceScope.isActive = :isActive', { isActive });
      }

      if (search) {
        queryBuilder.andWhere(
          '(service.name ILIKE :search OR serviceScope.notes ILIKE :search OR CAST(serviceScope.scopeDetails AS TEXT) ILIKE :search)',
          { search: `%${search}%` },
        );
      }

      if (minPrice !== undefined) {
        queryBuilder.andWhere('serviceScope.price >= :minPrice', { minPrice });
      }

      if (maxPrice !== undefined) {
        queryBuilder.andWhere('serviceScope.price <= :maxPrice', { maxPrice });
      }

      // Apply sorting
      queryBuilder.orderBy(`serviceScope.${sortBy}`, sortOrder);

      // Apply pagination
      const skip = (page - 1) * limit;
      queryBuilder.skip(skip).take(limit);

      // Execute query
      const [serviceScopes, total] = await queryBuilder.getManyAndCount();

      const totalPages = Math.ceil(total / limit);

      this.logger.log(`Retrieved ${serviceScopes.length} service scopes (${total} total)`);

      return {
        data: serviceScopes,
        count: total,
        totalPages,
        page,
        limit,
      };
    } catch (error) {
      this.logger.error(`Failed to retrieve service scopes: ${error.message}`, error.stack);
      throw new BadRequestException('Failed to retrieve service scopes');
    }
  }

  /**
   * Find all service scopes for a specific contract
   * 
   * @param contractId - Contract UUID
   * @returns Promise<ServiceScope[]> - Service scopes for the contract
   */
  async findAllForContract(contractId: string): Promise<ServiceScope[]> {
    this.logger.log(`Retrieving service scopes for contract: ${contractId}`);

    try {
      const serviceScopes = await this.serviceScopeRepository.find({
        where: { contractId },
        relations: ['service', 'contract', 'proposals'],
        order: { createdAt: 'DESC' },
      });

      this.logger.log(`Retrieved ${serviceScopes.length} service scopes for contract: ${contractId}`);
      return serviceScopes;
    } catch (error) {
      this.logger.error(
        `Failed to retrieve service scopes for contract ${contractId}: ${error.message}`,
        error.stack,
      );
      throw new BadRequestException('Failed to retrieve service scopes for contract');
    }
  }

  /**
   * Find a single service scope by ID
   * 
   * @param id - Service scope UUID
   * @returns Promise<ServiceScope> - The service scope with relationships
   * @throws NotFoundException - If service scope doesn't exist
   */
  async findOne(id: string): Promise<ServiceScope> {
    this.logger.log(`Retrieving service scope: ${id}`);

    try {
      const serviceScope = await this.serviceScopeRepository.findOne({
        where: { id },
        relations: ['contract', 'service', 'proposals', 'contract.client'],
      });

      if (!serviceScope) {
        throw new NotFoundException(`Service scope with ID '${id}' not found`);
      }

      return serviceScope;
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }

      this.logger.error(
        `Failed to retrieve service scope ${id}: ${error.message}`,
        error.stack,
      );
      throw new BadRequestException('Failed to retrieve service scope');
    }
  }

  /**
   * Update an existing service scope
   * 
   * @param id - Service scope UUID
   * @param updateServiceScopeDto - Updated data
   * @param currentUser - Current authenticated user for audit
   * @returns Promise<ServiceScope> - The updated service scope
   * @throws NotFoundException - If service scope doesn't exist
   */
  async update(
    id: string,
    updateServiceScopeDto: UpdateServiceScopeDto,
    currentUser: any,
  ): Promise<ServiceScope> {
    this.logger.log(`Updating service scope: ${id} by user: ${currentUser?.id}`);

    try {
      const serviceScope = await this.serviceScopeRepository.findOne({
        where: { id },
        relations: ['contract', 'service'],
      });

      if (!serviceScope) {
        throw new NotFoundException(`Service scope with ID '${id}' not found`);
      }

      // If serviceId is being changed, validate the new service
      if (updateServiceScopeDto.serviceId && updateServiceScopeDto.serviceId !== serviceScope.serviceId) {
        const newService = await this.serviceRepository.findOne({
          where: { id: updateServiceScopeDto.serviceId, isActive: true },
        });

        if (!newService) {
          throw new NotFoundException(
            `Active service with ID '${updateServiceScopeDto.serviceId}' not found`,
          );
        }

        // Check for duplicate service in the contract (excluding current service scope)
        const existingServiceScope = await this.serviceScopeRepository.findOne({
          where: {
            contractId: serviceScope.contractId,
            serviceId: updateServiceScopeDto.serviceId,
            id: Not(id), // Exclude current service scope
          },
        });

        if (existingServiceScope) {
          throw new ConflictException(
            `Service '${newService.name}' is already included in this contract`,
          );
        }
      }

      // Update the service scope
      Object.assign(serviceScope, updateServiceScopeDto);

      // Handle date fields
      if (updateServiceScopeDto.safServiceStartDate) {
        serviceScope.safServiceStartDate = new Date(updateServiceScopeDto.safServiceStartDate);
      }

      if (updateServiceScopeDto.safServiceEndDate) {
        serviceScope.safServiceEndDate = new Date(updateServiceScopeDto.safServiceEndDate);
      }

      const updatedServiceScope = await this.serviceScopeRepository.save(serviceScope);

      this.logger.log(`Service scope updated successfully: ${updatedServiceScope.id}`);

      // Return with fresh relationships loaded
      return this.findOne(updatedServiceScope.id);
    } catch (error) {
      if (
        error instanceof NotFoundException ||
        error instanceof ConflictException
      ) {
        throw error;
      }

      this.logger.error(
        `Failed to update service scope ${id}: ${error.message}`,
        error.stack,
      );
      throw new BadRequestException('Failed to update service scope');
    }
  }

  /**
   * Soft delete a service scope (set isActive to false)
   * 
   * @param id - Service scope UUID
   * @param currentUser - Current authenticated user for audit
   * @returns Promise<ServiceScope> - The deactivated service scope
   * @throws NotFoundException - If service scope doesn't exist
   */
  async remove(id: string, currentUser: any): Promise<ServiceScope> {
    this.logger.log(`Soft deleting service scope: ${id} by user: ${currentUser?.id}`);

    try {
      const serviceScope = await this.serviceScopeRepository.findOne({
        where: { id },
      });

      if (!serviceScope) {
        throw new NotFoundException(`Service scope with ID '${id}' not found`);
      }

      serviceScope.isActive = false;
      const updatedServiceScope = await this.serviceScopeRepository.save(serviceScope);

      this.logger.log(`Service scope soft deleted successfully: ${updatedServiceScope.id}`);

      return this.findOne(updatedServiceScope.id);
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }

      this.logger.error(
        `Failed to soft delete service scope ${id}: ${error.message}`,
        error.stack,
      );
      throw new BadRequestException('Failed to delete service scope');
    }
  }

  /**
   * Permanently delete a service scope from the database
   * This is a hard delete and should be used with caution
   * 
   * @param id - Service scope UUID
   * @param currentUser - Current authenticated user for audit
   * @returns Promise<void>
   * @throws NotFoundException - If service scope doesn't exist
   */
  async hardDelete(id: string, currentUser: any): Promise<void> {
    this.logger.log(`Hard deleting service scope: ${id} by user: ${currentUser?.id}`);

    try {
      const result = await this.serviceScopeRepository.delete(id);

      if (result.affected === 0) {
        throw new NotFoundException(`Service scope with ID '${id}' not found`);
      }

      this.logger.log(`Service scope permanently deleted: ${id}`);
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }

      this.logger.error(
        `Failed to permanently delete service scope ${id}: ${error.message}`,
        error.stack,
      );
      throw new BadRequestException('Failed to permanently delete service scope');
    }
  }

  /**
   * Calculate total value for a contract's service scopes
   * 
   * @param contractId - Contract UUID
   * @returns Promise<number> - Total value of all active service scopes
   */
  async calculateContractTotal(contractId: string): Promise<number> {
    this.logger.log(`Calculating total value for contract: ${contractId}`);

    try {
      const result = await this.serviceScopeRepository
        .createQueryBuilder('serviceScope')
        .select('SUM(serviceScope.price * COALESCE(serviceScope.quantity, 1))', 'total')
        .where('serviceScope.contractId = :contractId', { contractId })
        .andWhere('serviceScope.isActive = true')
        .andWhere('serviceScope.price IS NOT NULL')
        .getRawOne();

      const total = parseFloat(result.total) || 0;
      this.logger.log(`Total value calculated for contract ${contractId}: ${total}`);

      return total;
    } catch (error) {
      this.logger.error(
        `Failed to calculate contract total for ${contractId}: ${error.message}`,
        error.stack,
      );
      throw new BadRequestException('Failed to calculate contract total');
    }
  }
} 