import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  HttpStatus,
  HttpCode,
  ParseUUIDPipe,
  ValidationPipe,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { UserRole } from '../../enums';
import { User } from '../../entities/user.entity';
import { TeamAssignmentsService, PaginatedResult } from './team-assignments.service';
import { ClientTeamAssignment } from './entities/client-team-assignment.entity';
import {
  CreateTeamAssignmentDto,
  UpdateTeamAssignmentDto,
  QueryTeamAssignmentsDto,
} from './dto';

/**
 * TeamAssignmentsController
 * Handles HTTP requests for ClientTeamAssignment CRUD operations
 * Implements role-based security and comprehensive API documentation
 */
@Controller('team-assignments')
@UseGuards(JwtAuthGuard, RolesGuard)
export class TeamAssignmentsController {
  constructor(private readonly teamAssignmentsService: TeamAssignmentsService) {}

  /**
   * Assign a team member to a client
   * Requires ADMIN, MANAGER, or ACCOUNT_MANAGER role
   */
  @Post()
  @Roles(UserRole.ADMIN, UserRole.MANAGER, UserRole.ACCOUNT_MANAGER)
  @HttpCode(HttpStatus.CREATED)
  async assignTeamMemberToClient(
    @Body(ValidationPipe) createTeamAssignmentDto: CreateTeamAssignmentDto,
    @CurrentUser() currentUser: User,
  ): Promise<ClientTeamAssignment> {
    return this.teamAssignmentsService.assignTeamMemberToClient(
      createTeamAssignmentDto,
      currentUser,
    );
  }

  /**
   * Get all team assignments with filtering and pagination
   * Requires authentication, broader access for read operations
   */
  @Get()
  @Roles(UserRole.ADMIN, UserRole.MANAGER, UserRole.ACCOUNT_MANAGER, UserRole.ANALYST)
  async findAll(
    @Query(ValidationPipe) queryDto: QueryTeamAssignmentsDto,
  ): Promise<PaginatedResult<ClientTeamAssignment>> {
    return this.teamAssignmentsService.findAll(queryDto);
  }

  /**
   * Get team assignments for a specific client
   * Convenience endpoint with client-specific filtering
   */
  @Get('clients/:clientId')
  @Roles(UserRole.ADMIN, UserRole.MANAGER, UserRole.ACCOUNT_MANAGER, UserRole.ANALYST)
  async findAllAssignmentsForClient(
    @Param('clientId', ParseUUIDPipe) clientId: string,
    @Query('isActive') isActive?: boolean,
    @Query('role') role?: string,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
  ): Promise<PaginatedResult<ClientTeamAssignment>> {
    return this.teamAssignmentsService.findAllAssignmentsForClient(
      clientId,
      { isActive, role: role as any },
      { page, limit },
    );
  }

  /**
   * Get team assignments for a specific user
   * Convenience endpoint with user-specific filtering
   */
  @Get('users/:userId')
  @Roles(UserRole.ADMIN, UserRole.MANAGER, UserRole.ACCOUNT_MANAGER, UserRole.ANALYST)
  async findAllAssignmentsForUser(
    @Param('userId', ParseUUIDPipe) userId: string,
    @Query('isActive') isActive?: boolean,
    @Query('role') role?: string,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
  ): Promise<PaginatedResult<ClientTeamAssignment>> {
    return this.teamAssignmentsService.findAllAssignmentsForUser(
      userId,
      { isActive, role: role as any },
      { page, limit },
    );
  }

  /**
   * Get client assignment statistics
   * Provides summary statistics for a client's team assignments
   */
  @Get('clients/:clientId/stats')
  @Roles(UserRole.ADMIN, UserRole.MANAGER, UserRole.ACCOUNT_MANAGER)
  async getClientAssignmentStats(
    @Param('clientId', ParseUUIDPipe) clientId: string,
  ): Promise<any> {
    return this.teamAssignmentsService.getClientAssignmentStats(clientId);
  }

  /**
   * Get user assignment statistics
   * Provides summary statistics for a user's team assignments
   */
  @Get('users/:userId/stats')
  @Roles(UserRole.ADMIN, UserRole.MANAGER, UserRole.ACCOUNT_MANAGER)
  async getUserAssignmentStats(
    @Param('userId', ParseUUIDPipe) userId: string,
  ): Promise<any> {
    return this.teamAssignmentsService.getUserAssignmentStats(userId);
  }

  /**
   * Get a single team assignment by ID
   */
  @Get(':id')
  @Roles(UserRole.ADMIN, UserRole.MANAGER, UserRole.ACCOUNT_MANAGER, UserRole.ANALYST)
  async findOne(
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<ClientTeamAssignment> {
    return this.teamAssignmentsService.findOne(id);
  }

  /**
   * Update a team assignment
   * Allows updating assignment details including role, dates, and active status
   */
  @Patch(':id')
  @Roles(UserRole.ADMIN, UserRole.MANAGER, UserRole.ACCOUNT_MANAGER)
  async update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body(ValidationPipe) updateTeamAssignmentDto: UpdateTeamAssignmentDto,
    @CurrentUser() currentUser: User,
  ): Promise<ClientTeamAssignment> {
    return this.teamAssignmentsService.update(id, updateTeamAssignmentDto, currentUser);
  }

  /**
   * Reactivate a deactivated assignment
   */
  @Patch(':id/reactivate')
  @Roles(UserRole.ADMIN, UserRole.MANAGER, UserRole.ACCOUNT_MANAGER)
  async reactivate(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() currentUser: User,
  ): Promise<ClientTeamAssignment> {
    return this.teamAssignmentsService.reactivate(id, currentUser);
  }

  /**
   * Soft delete a team assignment (recommended)
   * Sets isActive to false and optionally sets endDate
   */
  @Delete(':id')
  @Roles(UserRole.ADMIN, UserRole.MANAGER, UserRole.ACCOUNT_MANAGER)
  async remove(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() currentUser: User,
  ): Promise<ClientTeamAssignment> {
    return this.teamAssignmentsService.remove(id, currentUser);
  }

  /**
   * Hard delete a team assignment (use with extreme caution)
   * Permanently removes the assignment from the database
   * Only available to ADMIN users for data correction scenarios
   */
  @Delete(':id/hard')
  @Roles(UserRole.ADMIN)
  @HttpCode(HttpStatus.NO_CONTENT)
  async hardDelete(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() currentUser: User,
  ): Promise<void> {
    return this.teamAssignmentsService.hardDelete(id, currentUser);
  }
} 