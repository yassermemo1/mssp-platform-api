import {
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, FindOptionsWhere, FindManyOptions } from 'typeorm';
import { ClientTeamAssignment } from './entities/client-team-assignment.entity';
import { User } from '../../entities/user.entity';
import { Client } from '../../entities/client.entity';
import {
  CreateTeamAssignmentDto,
  UpdateTeamAssignmentDto,
  QueryTeamAssignmentsDto,
} from './dto';
import { UserRole, ClientAssignmentRole } from '../../enums';

export interface PaginatedResult<T> {
  data: T[];
  meta: {
    count: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

/**
 * TeamAssignmentsService
 * Handles business logic for ClientTeamAssignment CRUD operations
 * Includes validation, error handling, and security checks
 */
@Injectable()
export class TeamAssignmentsService {
  constructor(
    @InjectRepository(ClientTeamAssignment)
    private readonly teamAssignmentRepository: Repository<ClientTeamAssignment>,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    @InjectRepository(Client)
    private readonly clientRepository: Repository<Client>,
  ) {}

  /**
   * Assign a team member to a client with a specific role
   * Validates existence of user and client, handles unique constraints
   */
  async assignTeamMemberToClient(
    createDto: CreateTeamAssignmentDto,
    currentUser: User,
  ): Promise<ClientTeamAssignment> {
    // Validate that user exists and is active
    const user = await this.userRepository.findOne({
      where: { id: createDto.userId },
    });
    if (!user) {
      throw new NotFoundException(`User with ID ${createDto.userId} not found`);
    }

    // Validate that client exists
    const client = await this.clientRepository.findOne({
      where: { id: createDto.clientId },
    });
    if (!client) {
      throw new NotFoundException(`Client with ID ${createDto.clientId} not found`);
    }

    // Check for existing active assignment with same role
    const existingAssignment = await this.teamAssignmentRepository.findOne({
      where: {
        userId: createDto.userId,
        clientId: createDto.clientId,
        assignmentRole: createDto.assignmentRole,
        isActive: true,
      },
    });

    if (existingAssignment) {
      throw new ConflictException(
        `User ${user.email} already has an active ${createDto.assignmentRole} assignment for this client`,
      );
    }

    // Validate end date is after assignment date
    if (createDto.assignmentDate && createDto.endDate) {
      const assignmentDate = new Date(createDto.assignmentDate);
      const endDate = new Date(createDto.endDate);
      if (endDate <= assignmentDate) {
        throw new BadRequestException('End date must be after assignment date');
      }
    }

    // Create new assignment
    const teamAssignment = this.teamAssignmentRepository.create({
      ...createDto,
      assignmentDate: createDto.assignmentDate ? new Date(createDto.assignmentDate) : new Date(),
      endDate: createDto.endDate ? new Date(createDto.endDate) : null,
      isActive: true,
    });

    const savedAssignment = await this.teamAssignmentRepository.save(teamAssignment);

    // Return assignment with related entities
    return this.findOne(savedAssignment.id);
  }

  /**
   * Find all assignments with filtering and pagination
   */
  async findAll(queryDto: QueryTeamAssignmentsDto): Promise<PaginatedResult<ClientTeamAssignment>> {
    const { page = 1, limit = 20, includeRelations = true, ...filters } = queryDto;

    // Build where clause
    const where: FindOptionsWhere<ClientTeamAssignment> = {};
    
    if (filters.userId) where.userId = filters.userId;
    if (filters.clientId) where.clientId = filters.clientId;
    if (filters.assignmentRole) where.assignmentRole = filters.assignmentRole;
    if (filters.isActive !== undefined) where.isActive = filters.isActive;

    // Build query options
    const findOptions: FindManyOptions<ClientTeamAssignment> = {
      where,
      skip: (page - 1) * limit,
      take: limit,
      order: { createdAt: 'DESC' },
    };

    // Include relations if requested
    if (includeRelations) {
      findOptions.relations = {
        user: true,
        client: true,
      };
    }

    const [data, count] = await this.teamAssignmentRepository.findAndCount(findOptions);

    return {
      data,
      meta: {
        count,
        page,
        limit,
        totalPages: Math.ceil(count / limit),
      },
    };
  }

  /**
   * Find all assignments for a specific client
   */
  async findAllAssignmentsForClient(
    clientId: string,
    queryOptions?: { isActive?: boolean; role?: ClientAssignmentRole },
    paginationOptions?: { page?: number; limit?: number },
  ): Promise<PaginatedResult<ClientTeamAssignment>> {
    // Validate client exists
    const client = await this.clientRepository.findOne({
      where: { id: clientId },
    });
    if (!client) {
      throw new NotFoundException(`Client with ID ${clientId} not found`);
    }

    const { page = 1, limit = 20 } = paginationOptions || {};
    
    // Build where clause
    const where: FindOptionsWhere<ClientTeamAssignment> = { clientId };
    if (queryOptions?.isActive !== undefined) where.isActive = queryOptions.isActive;
    if (queryOptions?.role) where.assignmentRole = queryOptions.role;

    const [data, count] = await this.teamAssignmentRepository.findAndCount({
      where,
      relations: { user: true, client: true },
      skip: (page - 1) * limit,
      take: limit,
      order: { priority: 'ASC', createdAt: 'DESC' },
    });

    return {
      data,
      meta: {
        count,
        page,
        limit,
        totalPages: Math.ceil(count / limit),
      },
    };
  }

  /**
   * Find all assignments for a specific user
   */
  async findAllAssignmentsForUser(
    userId: string,
    queryOptions?: { isActive?: boolean; role?: ClientAssignmentRole },
    paginationOptions?: { page?: number; limit?: number },
  ): Promise<PaginatedResult<ClientTeamAssignment>> {
    // Validate user exists
    const user = await this.userRepository.findOne({
      where: { id: userId },
    });
    if (!user) {
      throw new NotFoundException(`User with ID ${userId} not found`);
    }

    const { page = 1, limit = 20 } = paginationOptions || {};
    
    // Build where clause
    const where: FindOptionsWhere<ClientTeamAssignment> = { userId };
    if (queryOptions?.isActive !== undefined) where.isActive = queryOptions.isActive;
    if (queryOptions?.role) where.assignmentRole = queryOptions.role;

    const [data, count] = await this.teamAssignmentRepository.findAndCount({
      where,
      relations: { user: true, client: true },
      skip: (page - 1) * limit,
      take: limit,
      order: { priority: 'ASC', createdAt: 'DESC' },
    });

    return {
      data,
      meta: {
        count,
        page,
        limit,
        totalPages: Math.ceil(count / limit),
      },
    };
  }

  /**
   * Find a single assignment by ID
   */
  async findOne(id: string): Promise<ClientTeamAssignment> {
    const assignment = await this.teamAssignmentRepository.findOne({
      where: { id },
      relations: { user: true, client: true },
    });

    if (!assignment) {
      throw new NotFoundException(`Team assignment with ID ${id} not found`);
    }

    return assignment;
  }

  /**
   * Update an existing team assignment
   * Handles role changes and unique constraint validation
   */
  async update(
    id: string,
    updateDto: UpdateTeamAssignmentDto,
    currentUser: User,
  ): Promise<ClientTeamAssignment> {
    const assignment = await this.findOne(id);

    // If changing assignment role, check for conflicts
    if (updateDto.assignmentRole && updateDto.assignmentRole !== assignment.assignmentRole) {
      const existingAssignment = await this.teamAssignmentRepository
        .createQueryBuilder('assignment')
        .where('assignment.userId = :userId', { userId: assignment.userId })
        .andWhere('assignment.clientId = :clientId', { clientId: assignment.clientId })
        .andWhere('assignment.assignmentRole = :assignmentRole', { assignmentRole: updateDto.assignmentRole })
        .andWhere('assignment.isActive = :isActive', { isActive: true })
        .andWhere('assignment.id != :id', { id })
        .getOne();

      if (existingAssignment) {
        throw new ConflictException(
          `User already has an active ${updateDto.assignmentRole} assignment for this client`,
        );
      }
    }

    // Validate end date is after assignment date
    if (updateDto.assignmentDate || updateDto.endDate) {
      const assignmentDate = updateDto.assignmentDate ? 
        new Date(updateDto.assignmentDate) : assignment.assignmentDate;
      const endDate = updateDto.endDate ? 
        new Date(updateDto.endDate) : assignment.endDate;
      
      if (assignmentDate && endDate && endDate <= assignmentDate) {
        throw new BadRequestException('End date must be after assignment date');
      }
    }

    // Apply updates
    Object.assign(assignment, {
      ...updateDto,
      assignmentDate: updateDto.assignmentDate ? new Date(updateDto.assignmentDate) : assignment.assignmentDate,
      endDate: updateDto.endDate ? new Date(updateDto.endDate) : assignment.endDate,
    });

    await this.teamAssignmentRepository.save(assignment);

    return this.findOne(id);
  }

  /**
   * Soft delete a team assignment by setting isActive to false
   * Recommended approach for maintaining data integrity and audit trail
   */
  async remove(id: string, currentUser: User): Promise<ClientTeamAssignment> {
    const assignment = await this.findOne(id);

    // Soft delete by setting isActive to false and endDate to current date
    assignment.isActive = false;
    if (!assignment.endDate) {
      assignment.endDate = new Date();
    }

    await this.teamAssignmentRepository.save(assignment);

    return assignment;
  }

  /**
   * Hard delete a team assignment (use with caution)
   * Should only be used for data correction scenarios
   */
  async hardDelete(id: string, currentUser: User): Promise<void> {
    const assignment = await this.findOne(id);

    // Only allow hard delete for admin users
    if (currentUser.role !== UserRole.ADMIN) {
      throw new ForbiddenException('Only administrators can permanently delete assignments');
    }

    await this.teamAssignmentRepository.remove(assignment);
  }

  /**
   * Reactivate a deactivated assignment
   */
  async reactivate(id: string, currentUser: User): Promise<ClientTeamAssignment> {
    const assignment = await this.findOne(id);

    if (assignment.isActive) {
      throw new BadRequestException('Assignment is already active');
    }

    // Check for conflicts with other active assignments
    const existingAssignment = await this.teamAssignmentRepository.findOne({
      where: {
        userId: assignment.userId,
        clientId: assignment.clientId,
        assignmentRole: assignment.assignmentRole,
        isActive: true,
      },
    });

    if (existingAssignment) {
      throw new ConflictException(
        `User already has an active ${assignment.assignmentRole} assignment for this client`,
      );
    }

    assignment.isActive = true;
    assignment.endDate = null; // Clear end date when reactivating

    await this.teamAssignmentRepository.save(assignment);

    return this.findOne(id);
  }

  /**
   * Get assignment statistics for a client
   */
  async getClientAssignmentStats(clientId: string): Promise<any> {
    const client = await this.clientRepository.findOne({
      where: { id: clientId },
    });
    if (!client) {
      throw new NotFoundException(`Client with ID ${clientId} not found`);
    }

    const assignments = await this.teamAssignmentRepository.find({
      where: { clientId },
      relations: { user: true },
    });

    const active = assignments.filter(a => a.isActive).length;
    const inactive = assignments.filter(a => !a.isActive).length;
    const byRole = assignments.reduce((acc, assignment) => {
      acc[assignment.assignmentRole] = (acc[assignment.assignmentRole] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    return {
      total: assignments.length,
      active,
      inactive,
      byRole,
      assignments: assignments.map(a => ({
        id: a.id,
        role: a.assignmentRole,
        isActive: a.isActive,
        user: {
          id: a.user.id,
          email: a.user.email,
          firstName: a.user.firstName,
          lastName: a.user.lastName,
        },
        assignmentDate: a.assignmentDate,
        endDate: a.endDate,
      })),
    };
  }

  /**
   * Get assignment statistics for a user
   */
  async getUserAssignmentStats(userId: string): Promise<any> {
    const user = await this.userRepository.findOne({
      where: { id: userId },
    });
    if (!user) {
      throw new NotFoundException(`User with ID ${userId} not found`);
    }

    const assignments = await this.teamAssignmentRepository.find({
      where: { userId },
      relations: { client: true },
    });

    const active = assignments.filter(a => a.isActive).length;
    const inactive = assignments.filter(a => !a.isActive).length;
    const byRole = assignments.reduce((acc, assignment) => {
      acc[assignment.assignmentRole] = (acc[assignment.assignmentRole] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    return {
      total: assignments.length,
      active,
      inactive,
      byRole,
      assignments: assignments.map(a => ({
        id: a.id,
        role: a.assignmentRole,
        isActive: a.isActive,
        client: {
          id: a.client.id,
          companyName: a.client.companyName,
          contactEmail: a.client.contactEmail,
        },
        assignmentDate: a.assignmentDate,
        endDate: a.endDate,
      })),
    };
  }
} 