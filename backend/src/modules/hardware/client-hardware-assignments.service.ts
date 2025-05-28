import {
  Injectable,
  NotFoundException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, FindManyOptions, DataSource } from 'typeorm';
import { ClientHardwareAssignment } from '../../entities/client-hardware-assignment.entity';
import { HardwareAsset } from '../../entities/hardware-asset.entity';
import { Client } from '../../entities/client.entity';
import { ServiceScope } from '../../entities/service-scope.entity';
import { CreateClientHardwareAssignmentDto, UpdateClientHardwareAssignmentDto } from './dto';
import { User } from '../../entities/user.entity';
import { HardwareAssetStatus, HardwareAssignmentStatus } from '../../enums';

/**
 * Query options interface for filtering assignments
 */
interface AssignmentQueryOptions {
  status?: HardwareAssignmentStatus;
  clientId?: string;
  hardwareAssetId?: string;
  serviceScopeId?: string;
}

/**
 * Pagination options interface
 */
interface PaginationOptions {
  page?: number;
  limit?: number;
}

/**
 * Paginated result interface
 */
export interface PaginatedResult<T> {
  data: T[];
  count: number;
  page: number;
  limit: number;
  totalPages: number;
}

/**
 * ClientHardwareAssignmentsService
 * Handles all business logic for hardware assignment operations
 * Includes atomic status updates and comprehensive validation
 */
@Injectable()
export class ClientHardwareAssignmentsService {
  private readonly logger = new Logger(ClientHardwareAssignmentsService.name);

  constructor(
    @InjectRepository(ClientHardwareAssignment)
    private readonly assignmentRepository: Repository<ClientHardwareAssignment>,
    @InjectRepository(HardwareAsset)
    private readonly hardwareAssetRepository: Repository<HardwareAsset>,
    @InjectRepository(Client)
    private readonly clientRepository: Repository<Client>,
    @InjectRepository(ServiceScope)
    private readonly serviceScopeRepository: Repository<ServiceScope>,
    private readonly dataSource: DataSource,
  ) {}

  /**
   * Assign hardware to a client
   * @param createDto - Data for creating the assignment
   * @param currentUser - The authenticated user creating the assignment
   * @returns Promise<ClientHardwareAssignment> - The created assignment
   * @throws NotFoundException if referenced entities don't exist
   * @throws BadRequestException if hardware is not available for assignment
   */
  async assignHardwareToClient(
    createDto: CreateClientHardwareAssignmentDto,
    currentUser: User,
  ): Promise<ClientHardwareAssignment> {
    this.logger.log(
      `Assigning hardware ${createDto.hardwareAssetId} to client ${createDto.clientId} by user: ${currentUser.email}`,
    );

    // Use transaction to ensure atomicity
    return await this.dataSource.transaction(async (manager) => {
      try {
        // Validate hardware asset exists and is available
        const hardwareAsset = await manager.findOne(HardwareAsset, {
          where: { id: createDto.hardwareAssetId },
          relations: ['assignments'],
        });

        if (!hardwareAsset) {
          throw new NotFoundException(
            `Hardware asset with ID '${createDto.hardwareAssetId}' not found`,
          );
        }

        // Check if hardware is available for assignment
        if (!hardwareAsset.isAvailable) {
          throw new BadRequestException(
            `Hardware asset '${hardwareAsset.assetTag}' is not available for assignment. Current status: ${hardwareAsset.status}`,
          );
        }

        // Check for existing active assignments
        const existingActiveAssignment = hardwareAsset.assignments?.find(
          assignment => assignment.isActive
        );

        if (existingActiveAssignment) {
          throw new BadRequestException(
            `Hardware asset '${hardwareAsset.assetTag}' is already assigned to client '${existingActiveAssignment.client?.companyName || 'Unknown'}'`,
          );
        }

        // Validate client exists
        const client = await manager.findOne(Client, {
          where: { id: createDto.clientId },
        });

        if (!client) {
          throw new NotFoundException(
            `Client with ID '${createDto.clientId}' not found`,
          );
        }

        // Validate service scope exists (if provided)
        let serviceScope = null;
        if (createDto.serviceScopeId) {
          serviceScope = await manager.findOne(ServiceScope, {
            where: { id: createDto.serviceScopeId },
            relations: ['contract', 'contract.client'],
          });

          if (!serviceScope) {
            throw new NotFoundException(
              `Service scope with ID '${createDto.serviceScopeId}' not found`,
            );
          }

          // Validate that the service scope belongs to the specified client
          if (serviceScope.contract.client.id !== createDto.clientId) {
            throw new BadRequestException(
              `Service scope '${createDto.serviceScopeId}' does not belong to client '${client.companyName}'`,
            );
          }
        }

        // Create the assignment
        const assignment = manager.create(ClientHardwareAssignment, {
          ...createDto,
          assignmentDate: new Date(createDto.assignmentDate),
          returnDate: createDto.returnDate ? new Date(createDto.returnDate) : null,
          status: createDto.status || HardwareAssignmentStatus.ACTIVE,
        });

        const savedAssignment = await manager.save(ClientHardwareAssignment, assignment);

        // Update hardware asset status to IN_USE
        await manager.update(HardwareAsset, createDto.hardwareAssetId, {
          status: HardwareAssetStatus.IN_USE,
        });

        this.logger.log(
          `Successfully assigned hardware asset '${hardwareAsset.assetTag}' to client '${client.companyName}'`,
        );

        // Return the assignment with relations
        return await manager.findOne(ClientHardwareAssignment, {
          where: { id: savedAssignment.id },
          relations: ['hardwareAsset', 'client', 'serviceScope'],
        });
      } catch (error) {
        this.logger.error(
          `Failed to assign hardware ${createDto.hardwareAssetId} to client ${createDto.clientId}`,
          error.stack,
        );
        throw error;
      }
    });
  }

  /**
   * Find all assignments for a specific client
   * @param clientId - UUID of the client
   * @param queryOptions - Optional query parameters
   * @param paginationOptions - Optional pagination parameters
   * @returns Promise<PaginatedResult<ClientHardwareAssignment>> - Paginated assignments
   */
  async findAllForClient(
    clientId: string,
    queryOptions?: AssignmentQueryOptions,
    paginationOptions?: PaginationOptions,
  ): Promise<PaginatedResult<ClientHardwareAssignment>> {
    this.logger.log(`Retrieving assignments for client: ${clientId}`);

    try {
      const page = paginationOptions?.page || 1;
      const limit = paginationOptions?.limit || 10;
      const skip = (page - 1) * limit;

      const where: any = { clientId };

      if (queryOptions?.status) {
        where.status = queryOptions.status;
      }

      const findOptions: FindManyOptions<ClientHardwareAssignment> = {
        where,
        order: {
          assignmentDate: 'DESC',
        },
        skip,
        take: limit,
        relations: ['hardwareAsset', 'client', 'serviceScope'],
      };

      const [assignments, count] = await this.assignmentRepository.findAndCount(findOptions);

      const totalPages = Math.ceil(count / limit);

      this.logger.log(`Retrieved ${assignments.length} assignments for client (page ${page}/${totalPages})`);

      return {
        data: assignments,
        count,
        page,
        limit,
        totalPages,
      };
    } catch (error) {
      this.logger.error(`Failed to retrieve assignments for client: ${clientId}`, error.stack);
      throw error;
    }
  }

  /**
   * Find all assignments for a specific hardware asset
   * @param hardwareAssetId - UUID of the hardware asset
   * @param queryOptions - Optional query parameters
   * @param paginationOptions - Optional pagination parameters
   * @returns Promise<PaginatedResult<ClientHardwareAssignment>> - Paginated assignments
   */
  async findAllForHardwareAsset(
    hardwareAssetId: string,
    queryOptions?: AssignmentQueryOptions,
    paginationOptions?: PaginationOptions,
  ): Promise<PaginatedResult<ClientHardwareAssignment>> {
    this.logger.log(`Retrieving assignments for hardware asset: ${hardwareAssetId}`);

    try {
      const page = paginationOptions?.page || 1;
      const limit = paginationOptions?.limit || 10;
      const skip = (page - 1) * limit;

      const where: any = { hardwareAssetId };

      if (queryOptions?.status) {
        where.status = queryOptions.status;
      }

      const findOptions: FindManyOptions<ClientHardwareAssignment> = {
        where,
        order: {
          assignmentDate: 'DESC',
        },
        skip,
        take: limit,
        relations: ['hardwareAsset', 'client', 'serviceScope'],
      };

      const [assignments, count] = await this.assignmentRepository.findAndCount(findOptions);

      const totalPages = Math.ceil(count / limit);

      this.logger.log(`Retrieved ${assignments.length} assignments for hardware asset (page ${page}/${totalPages})`);

      return {
        data: assignments,
        count,
        page,
        limit,
        totalPages,
      };
    } catch (error) {
      this.logger.error(`Failed to retrieve assignments for hardware asset: ${hardwareAssetId}`, error.stack);
      throw error;
    }
  }

  /**
   * Find all assignments for a specific service scope
   * @param serviceScopeId - UUID of the service scope
   * @param queryOptions - Optional query parameters
   * @param paginationOptions - Optional pagination parameters
   * @returns Promise<PaginatedResult<ClientHardwareAssignment>> - Paginated assignments
   */
  async findAllForServiceScope(
    serviceScopeId: string,
    queryOptions?: AssignmentQueryOptions,
    paginationOptions?: PaginationOptions,
  ): Promise<PaginatedResult<ClientHardwareAssignment>> {
    this.logger.log(`Retrieving assignments for service scope: ${serviceScopeId}`);

    try {
      const page = paginationOptions?.page || 1;
      const limit = paginationOptions?.limit || 10;
      const skip = (page - 1) * limit;

      const where: any = { serviceScopeId };

      if (queryOptions?.status) {
        where.status = queryOptions.status;
      }

      const findOptions: FindManyOptions<ClientHardwareAssignment> = {
        where,
        order: {
          assignmentDate: 'DESC',
        },
        skip,
        take: limit,
        relations: ['hardwareAsset', 'client', 'serviceScope'],
      };

      const [assignments, count] = await this.assignmentRepository.findAndCount(findOptions);

      const totalPages = Math.ceil(count / limit);

      this.logger.log(`Retrieved ${assignments.length} assignments for service scope (page ${page}/${totalPages})`);

      return {
        data: assignments,
        count,
        page,
        limit,
        totalPages,
      };
    } catch (error) {
      this.logger.error(`Failed to retrieve assignments for service scope: ${serviceScopeId}`, error.stack);
      throw error;
    }
  }

  /**
   * Retrieve a single assignment by ID
   * @param id - UUID of the assignment
   * @returns Promise<ClientHardwareAssignment> - The found assignment
   * @throws NotFoundException if assignment doesn't exist
   */
  async findOne(id: string): Promise<ClientHardwareAssignment> {
    this.logger.log(`Retrieving assignment with ID: ${id}`);

    try {
      const assignment = await this.assignmentRepository.findOne({
        where: { id },
        relations: ['hardwareAsset', 'client', 'serviceScope'],
      });

      if (!assignment) {
        throw new NotFoundException(`Assignment with ID '${id}' not found`);
      }

      this.logger.log(`Successfully retrieved assignment: ${assignment.displayName}`);
      return assignment;
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }

      this.logger.error(`Failed to retrieve assignment with ID: ${id}`, error.stack);
      throw error;
    }
  }

  /**
   * Update an existing assignment
   * @param id - UUID of the assignment to update
   * @param updateDto - Data for updating the assignment
   * @param currentUser - The authenticated user updating the assignment
   * @returns Promise<ClientHardwareAssignment> - The updated assignment
   * @throws NotFoundException if assignment doesn't exist
   */
  async update(
    id: string,
    updateDto: UpdateClientHardwareAssignmentDto,
    currentUser: User,
  ): Promise<ClientHardwareAssignment> {
    this.logger.log(
      `Updating assignment with ID: ${id} by user: ${currentUser.email}`,
    );

    // Use transaction to ensure atomicity when updating hardware asset status
    return await this.dataSource.transaction(async (manager) => {
      try {
        // First, check if the assignment exists
        const existingAssignment = await manager.findOne(ClientHardwareAssignment, {
          where: { id },
          relations: ['hardwareAsset'],
        });

        if (!existingAssignment) {
          throw new NotFoundException(`Assignment with ID '${id}' not found`);
        }

        // Prepare update data
        const updateData: any = { ...updateDto };

        if (updateDto.assignmentDate) {
          updateData.assignmentDate = new Date(updateDto.assignmentDate);
        }

        if (updateDto.returnDate) {
          updateData.returnDate = new Date(updateDto.returnDate);
        }

        // Check if status is being changed to a "returned" state
        const isBeingReturned = updateDto.status && 
          [HardwareAssignmentStatus.RETURNED, HardwareAssignmentStatus.REPLACED].includes(updateDto.status) &&
          existingAssignment.status === HardwareAssignmentStatus.ACTIVE;

        // Update the assignment
        await manager.update(ClientHardwareAssignment, id, updateData);

        // If assignment is being returned, update hardware asset status
        if (isBeingReturned) {
          await manager.update(HardwareAsset, existingAssignment.hardwareAssetId, {
            status: HardwareAssetStatus.IN_STOCK,
          });

          this.logger.log(
            `Updated hardware asset '${existingAssignment.hardwareAsset.assetTag}' status to IN_STOCK due to assignment return`,
          );
        }

        // Retrieve and return the updated assignment
        const updatedAssignment = await manager.findOne(ClientHardwareAssignment, {
          where: { id },
          relations: ['hardwareAsset', 'client', 'serviceScope'],
        });

        this.logger.log(
          `Successfully updated assignment: ${updatedAssignment.displayName}`,
        );

        return updatedAssignment;
      } catch (error) {
        if (error instanceof NotFoundException) {
          throw error;
        }

        this.logger.error(`Failed to update assignment with ID: ${id}`, error.stack);
        throw error;
      }
    });
  }

  /**
   * Delete an assignment (hard delete)
   * @param id - UUID of the assignment to delete
   * @param currentUser - The authenticated user deleting the assignment
   * @returns Promise<void>
   * @throws NotFoundException if assignment doesn't exist
   * 
   * Note: This implements hard delete for correcting errors.
   * For production, consider implementing soft delete by updating status instead.
   */
  async remove(id: string, currentUser: User): Promise<void> {
    this.logger.log(
      `Deleting assignment with ID: ${id} by user: ${currentUser.email}`,
    );

    // Use transaction to ensure atomicity
    return await this.dataSource.transaction(async (manager) => {
      try {
        // First, check if the assignment exists
        const existingAssignment = await manager.findOne(ClientHardwareAssignment, {
          where: { id },
          relations: ['hardwareAsset'],
        });

        if (!existingAssignment) {
          throw new NotFoundException(`Assignment with ID '${id}' not found`);
        }

        // If assignment was active, revert hardware asset status
        if (existingAssignment.isActive) {
          await manager.update(HardwareAsset, existingAssignment.hardwareAssetId, {
            status: HardwareAssetStatus.IN_STOCK,
          });

          this.logger.log(
            `Reverted hardware asset '${existingAssignment.hardwareAsset.assetTag}' status to IN_STOCK due to assignment deletion`,
          );
        }

        // Delete the assignment
        await manager.delete(ClientHardwareAssignment, id);

        this.logger.log(
          `Successfully deleted assignment: ${existingAssignment.displayName}`,
        );
      } catch (error) {
        if (error instanceof NotFoundException) {
          throw error;
        }

        this.logger.error(`Failed to delete assignment with ID: ${id}`, error.stack);
        throw error;
      }
    });
  }

  /**
   * Get all assignments with optional filtering
   * @param queryOptions - Optional query parameters
   * @param paginationOptions - Optional pagination parameters
   * @returns Promise<PaginatedResult<ClientHardwareAssignment>> - Paginated assignments
   */
  async findAll(
    queryOptions?: AssignmentQueryOptions,
    paginationOptions?: PaginationOptions,
  ): Promise<PaginatedResult<ClientHardwareAssignment>> {
    this.logger.log('Retrieving all assignments with filters and pagination');

    try {
      const page = paginationOptions?.page || 1;
      const limit = paginationOptions?.limit || 10;
      const skip = (page - 1) * limit;

      const where: any = {};

      if (queryOptions?.status) {
        where.status = queryOptions.status;
      }

      if (queryOptions?.clientId) {
        where.clientId = queryOptions.clientId;
      }

      if (queryOptions?.hardwareAssetId) {
        where.hardwareAssetId = queryOptions.hardwareAssetId;
      }

      if (queryOptions?.serviceScopeId) {
        where.serviceScopeId = queryOptions.serviceScopeId;
      }

      const findOptions: FindManyOptions<ClientHardwareAssignment> = {
        where,
        order: {
          assignmentDate: 'DESC',
        },
        skip,
        take: limit,
        relations: ['hardwareAsset', 'client', 'serviceScope'],
      };

      const [assignments, count] = await this.assignmentRepository.findAndCount(findOptions);

      const totalPages = Math.ceil(count / limit);

      this.logger.log(`Retrieved ${assignments.length} assignments (page ${page}/${totalPages})`);

      return {
        data: assignments,
        count,
        page,
        limit,
        totalPages,
      };
    } catch (error) {
      this.logger.error('Failed to retrieve assignments', error.stack);
      throw error;
    }
  }
} 