import {
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, FindManyOptions, Like } from 'typeorm';
import { Service } from '../../entities/service.entity';
import { CreateServiceDto, UpdateServiceDto, UpdateScopeDefinitionTemplateDto } from './dto';
import { ServiceCategory, ServiceDeliveryModel } from '../../enums';

/**
 * Query options interface for filtering services
 */
export interface ServiceQueryOptions {
  isActive?: boolean;
  category?: ServiceCategory;
  deliveryModel?: ServiceDeliveryModel;
  search?: string;
  page?: number;
  limit?: number;
}

/**
 * ServicesService
 * Business logic for service catalog management
 * 
 * This service handles:
 * - Service CRUD operations with comprehensive error handling
 * - Service catalog queries with filtering and pagination
 * - Service activation/deactivation (soft delete)
 * - Service category and delivery model filtering
 * - Uniqueness validation for service names
 * - Search functionality across service names and descriptions
 */
@Injectable()
export class ServicesService {
  private readonly logger = new Logger(ServicesService.name);

  constructor(
    @InjectRepository(Service)
    private readonly serviceRepository: Repository<Service>,
  ) {}

  /**
   * Create a new service in the catalog
   * 
   * @param createServiceDto - Service creation data
   * @param currentUser - Current authenticated user (for audit purposes)
   * @returns Promise<Service> - The created service
   * @throws ConflictException - If service name already exists
   * @throws BadRequestException - If validation fails
   */
  async create(createServiceDto: CreateServiceDto, currentUser: any): Promise<Service> {
    this.logger.log(`Creating new service: ${createServiceDto.name} by user: ${currentUser?.id}`);

    try {
      // Check if service name already exists
      const existingService = await this.serviceRepository.findOne({
        where: { name: createServiceDto.name },
      });

      if (existingService) {
        throw new ConflictException(
          `Service with name '${createServiceDto.name}' already exists`,
        );
      }

      // Create new service entity
      const service = this.serviceRepository.create({
        ...createServiceDto,
        isActive: createServiceDto.isActive ?? true,
      });

      // Save to database
      const savedService = await this.serviceRepository.save(service);

      this.logger.log(`Service created successfully: ${savedService.id}`);
      return savedService;
    } catch (error) {
      if (error instanceof ConflictException) {
        throw error;
      }

      this.logger.error(`Failed to create service: ${error.message}`, error.stack);
      throw new BadRequestException('Failed to create service');
    }
  }

  /**
   * Retrieve all services with optional filtering and pagination
   * 
   * @param queryOptions - Optional filtering and pagination parameters
   * @returns Promise<Service[]> - Array of services matching the criteria
   */
  async findAll(queryOptions: ServiceQueryOptions = {}): Promise<Service[]> {
    this.logger.log(`Retrieving services with options: ${JSON.stringify(queryOptions)}`);

    try {
      const {
        isActive,
        category,
        deliveryModel,
        search,
        page = 1,
        limit = 50,
      } = queryOptions;

      // Build query options
      const findOptions: FindManyOptions<Service> = {
        order: { name: 'ASC' },
        take: Math.min(limit, 100), // Cap at 100 for performance
        skip: (page - 1) * Math.min(limit, 100),
      };

      // Build where conditions
      const whereConditions: any = {};

      if (isActive !== undefined) {
        whereConditions.isActive = isActive;
      }

      if (category) {
        whereConditions.category = category;
      }

      if (deliveryModel) {
        whereConditions.deliveryModel = deliveryModel;
      }

      // Handle search across name and description
      if (search && search.trim()) {
        const searchTerm = `%${search.trim()}%`;
        findOptions.where = [
          { ...whereConditions, name: Like(searchTerm) },
          { ...whereConditions, description: Like(searchTerm) },
        ];
      } else {
        findOptions.where = whereConditions;
      }

      const services = await this.serviceRepository.find(findOptions);

      this.logger.log(`Retrieved ${services.length} services`);
      return services;
    } catch (error) {
      this.logger.error(`Failed to retrieve services: ${error.message}`, error.stack);
      throw new BadRequestException('Failed to retrieve services');
    }
  }

  /**
   * Retrieve a single service by ID
   * 
   * @param id - Service UUID
   * @returns Promise<Service> - The requested service
   * @throws NotFoundException - If service doesn't exist
   */
  async findOne(id: string): Promise<Service> {
    this.logger.log(`Retrieving service: ${id}`);

    try {
      const service = await this.serviceRepository.findOne({
        where: { id },
        relations: ['serviceScopes'], // Include related service scopes
      });

      if (!service) {
        throw new NotFoundException(`Service with ID '${id}' not found`);
      }

      this.logger.log(`Service retrieved successfully: ${service.id}`);
      return service;
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }

      this.logger.error(`Failed to retrieve service ${id}: ${error.message}`, error.stack);
      throw new BadRequestException('Failed to retrieve service');
    }
  }

  /**
   * Update an existing service
   * 
   * @param id - Service UUID
   * @param updateServiceDto - Service update data
   * @param currentUser - Current authenticated user (for audit purposes)
   * @returns Promise<Service> - The updated service
   * @throws NotFoundException - If service doesn't exist
   * @throws ConflictException - If updated name conflicts with existing service
   */
  async update(
    id: string,
    updateServiceDto: UpdateServiceDto,
    currentUser: any,
  ): Promise<Service> {
    this.logger.log(`Updating service: ${id} by user: ${currentUser?.id}`);

    try {
      // Check if service exists
      const existingService = await this.findOne(id);

      // If name is being updated, check for uniqueness
      if (updateServiceDto.name && updateServiceDto.name !== existingService.name) {
        const serviceWithSameName = await this.serviceRepository.findOne({
          where: { name: updateServiceDto.name },
        });

        if (serviceWithSameName && serviceWithSameName.id !== id) {
          throw new ConflictException(
            `Service with name '${updateServiceDto.name}' already exists`,
          );
        }
      }

      // Update the service
      await this.serviceRepository.update(id, updateServiceDto);

      // Retrieve and return the updated service
      const updatedService = await this.findOne(id);

      this.logger.log(`Service updated successfully: ${updatedService.id}`);
      return updatedService;
    } catch (error) {
      if (error instanceof NotFoundException || error instanceof ConflictException) {
        throw error;
      }

      this.logger.error(`Failed to update service ${id}: ${error.message}`, error.stack);
      throw new BadRequestException('Failed to update service');
    }
  }

  /**
   * Soft delete a service by setting isActive to false
   * 
   * @param id - Service UUID
   * @param currentUser - Current authenticated user (for audit purposes)
   * @returns Promise<Service> - The deactivated service
   * @throws NotFoundException - If service doesn't exist
   */
  async remove(id: string, currentUser: any): Promise<Service> {
    this.logger.log(`Soft deleting service: ${id} by user: ${currentUser?.id}`);

    try {
      // Check if service exists
      const existingService = await this.findOne(id);

      // Check if service is already inactive
      if (!existingService.isActive) {
        this.logger.warn(`Service ${id} is already inactive`);
        return existingService;
      }

      // Perform soft delete by setting isActive to false
      await this.serviceRepository.update(id, { isActive: false });

      // Retrieve and return the updated service
      const deactivatedService = await this.findOne(id);

      this.logger.log(`Service soft deleted successfully: ${deactivatedService.id}`);
      return deactivatedService;
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }

      this.logger.error(`Failed to soft delete service ${id}: ${error.message}`, error.stack);
      throw new BadRequestException('Failed to delete service');
    }
  }

  /**
   * Reactivate a previously deactivated service
   * 
   * @param id - Service UUID
   * @param currentUser - Current authenticated user (for audit purposes)
   * @returns Promise<Service> - The reactivated service
   * @throws NotFoundException - If service doesn't exist
   */
  async reactivate(id: string, currentUser: any): Promise<Service> {
    this.logger.log(`Reactivating service: ${id} by user: ${currentUser?.id}`);

    try {
      // Check if service exists
      const existingService = await this.findOne(id);

      // Check if service is already active
      if (existingService.isActive) {
        this.logger.warn(`Service ${id} is already active`);
        return existingService;
      }

      // Reactivate by setting isActive to true
      await this.serviceRepository.update(id, { isActive: true });

      // Retrieve and return the updated service
      const reactivatedService = await this.findOne(id);

      this.logger.log(`Service reactivated successfully: ${reactivatedService.id}`);
      return reactivatedService;
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }

      this.logger.error(`Failed to reactivate service ${id}: ${error.message}`, error.stack);
      throw new BadRequestException('Failed to reactivate service');
    }
  }

  /**
   * Get service statistics
   * 
   * @returns Promise<object> - Service statistics
   */
  async getStatistics(): Promise<{
    total: number;
    active: number;
    inactive: number;
    byCategory: Record<string, number>;
    byDeliveryModel: Record<string, number>;
  }> {
    this.logger.log('Retrieving service statistics');

    try {
      const [total, active, byCategory, byDeliveryModel] = await Promise.all([
        this.serviceRepository.count(),
        this.serviceRepository.count({ where: { isActive: true } }),
        this.serviceRepository
          .createQueryBuilder('service')
          .select('service.category', 'category')
          .addSelect('COUNT(*)', 'count')
          .groupBy('service.category')
          .getRawMany(),
        this.serviceRepository
          .createQueryBuilder('service')
          .select('service.deliveryModel', 'deliveryModel')
          .addSelect('COUNT(*)', 'count')
          .groupBy('service.deliveryModel')
          .getRawMany(),
      ]);

      const categoryStats = byCategory.reduce((acc, item) => {
        acc[item.category] = parseInt(item.count);
        return acc;
      }, {});

      const deliveryModelStats = byDeliveryModel.reduce((acc, item) => {
        acc[item.deliveryModel] = parseInt(item.count);
        return acc;
      }, {});

      const statistics = {
        total,
        active,
        inactive: total - active,
        byCategory: categoryStats,
        byDeliveryModel: deliveryModelStats,
      };

      this.logger.log('Service statistics retrieved successfully');
      return statistics;
    } catch (error) {
      this.logger.error(`Failed to retrieve service statistics: ${error.message}`, error.stack);
      throw new BadRequestException('Failed to retrieve service statistics');
    }
  }

  /**
   * Get scope definition template for a specific service
   * 
   * @param id - Service UUID
   * @returns Promise<object> - The scope definition template
   * @throws NotFoundException - If service doesn't exist
   */
  async getScopeDefinitionTemplate(id: string): Promise<{ scopeDefinitionTemplate: any }> {
    this.logger.log(`Retrieving scope definition template for service: ${id}`);

    try {
      const service = await this.serviceRepository.findOne({
        where: { id },
        select: ['id', 'name', 'scopeDefinitionTemplate'],
      });

      if (!service) {
        throw new NotFoundException(`Service with ID '${id}' not found`);
      }

      this.logger.log(`Scope definition template retrieved successfully for service: ${service.id}`);
      return {
        scopeDefinitionTemplate: service.scopeDefinitionTemplate,
      };
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }

      this.logger.error(`Failed to retrieve scope definition template for service ${id}: ${error.message}`, error.stack);
      throw new BadRequestException('Failed to retrieve scope definition template');
    }
  }

  /**
   * Update scope definition template for a specific service
   * 
   * @param id - Service UUID
   * @param updateScopeTemplateDto - Scope definition template update data
   * @param currentUser - Current authenticated user (for audit purposes)
   * @returns Promise<Service> - The updated service
   * @throws NotFoundException - If service doesn't exist
   */
  async updateScopeDefinitionTemplate(
    id: string,
    updateScopeTemplateDto: UpdateScopeDefinitionTemplateDto,
    currentUser: any,
  ): Promise<Service> {
    this.logger.log(`Updating scope definition template for service: ${id} by user: ${currentUser?.id}`);

    try {
      // Check if service exists
      const service = await this.serviceRepository.findOne({
        where: { id },
      });

      if (!service) {
        throw new NotFoundException(`Service with ID '${id}' not found`);
      }

      // Update the scope definition template
      service.scopeDefinitionTemplate = updateScopeTemplateDto.scopeDefinitionTemplate;

      // Save the updated service
      const updatedService = await this.serviceRepository.save(service);

      this.logger.log(`Scope definition template updated successfully for service: ${updatedService.id}`);
      return updatedService;
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }

      this.logger.error(`Failed to update scope definition template for service ${id}: ${error.message}`, error.stack);
      throw new BadRequestException('Failed to update scope definition template');
    }
  }
} 