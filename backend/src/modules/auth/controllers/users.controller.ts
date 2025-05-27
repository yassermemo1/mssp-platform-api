import { Controller, Get, UseGuards, Request } from '@nestjs/common';
import { JwtAuthGuard } from '../guards/jwt-auth.guard';
import { RolesGuard } from '../guards/roles.guard';
import { Roles } from '../decorators/roles.decorator';
import { UserRole } from '../../../enums/user-role.enum';
import { AuthenticatedUser } from '../strategies/jwt.strategy';

/**
 * Users Controller
 * Handles user management operations
 * Demonstrates the usage of role-based access control (RBAC)
 */
@Controller('users')
@UseGuards(JwtAuthGuard, RolesGuard) // Apply both authentication and authorization guards
export class UsersController {
  /**
   * Get all users (Admin and Manager only)
   * GET /users/all
   * 
   * This endpoint demonstrates:
   * - JWT authentication requirement (via JwtAuthGuard)
   * - Role-based authorization (via RolesGuard and @Roles decorator)
   * - Multiple roles allowed (ADMIN or MANAGER)
   * 
   * @param req - Express request object with authenticated user data
   * @returns List of all users (mock data for demonstration)
   */
  @Roles(UserRole.ADMIN, UserRole.MANAGER)
  @Get('all')
  async getAllUsers(@Request() req: { user: AuthenticatedUser }) {
    const { role } = req.user;

    return {
      message: 'Users retrieved successfully',
      requestedBy: {
        role,
        hasAccess: 'Admin or Manager level access confirmed',
      },
      users: [
        {
          id: '1',
          email: 'admin@mssp.com',
          role: UserRole.ADMIN,
          createdAt: '2025-01-01T00:00:00Z',
        },
        {
          id: '2',
          email: 'manager@mssp.com',
          role: UserRole.MANAGER,
          createdAt: '2025-01-02T00:00:00Z',
        },
        {
          id: '3',
          email: 'engineer@mssp.com',
          role: UserRole.ENGINEER,
          createdAt: '2025-01-03T00:00:00Z',
        },
      ],
    };
  }

  /**
   * Get user statistics (Admin only)
   * GET /users/stats
   * 
   * This endpoint demonstrates:
   * - Single role requirement (only ADMIN)
   * - Highly restricted access
   * 
   * @param req - Express request object with authenticated user data
   * @returns User statistics (mock data for demonstration)
   */
  @Roles(UserRole.ADMIN)
  @Get('stats')
  async getUserStats(@Request() req: { user: AuthenticatedUser }) {
    const { role, email } = req.user;

    return {
      message: 'User statistics retrieved successfully',
      requestedBy: {
        email,
        role,
        hasAccess: 'Admin-only access confirmed',
      },
      statistics: {
        totalUsers: 150,
        activeUsers: 142,
        newUsersThisMonth: 12,
        usersByRole: {
          [UserRole.ADMIN]: 5,
          [UserRole.MANAGER]: 15,
          [UserRole.PROJECT_MANAGER]: 25,
          [UserRole.ACCOUNT_MANAGER]: 30,
          [UserRole.ENGINEER]: 75,
        },
      },
    };
  }

  /**
   * Get team members (Manager, Project Manager, and Admin)
   * GET /users/team
   * 
   * This endpoint demonstrates:
   * - Multiple roles with management responsibilities
   * - Different access level than all users
   * 
   * @param req - Express request object with authenticated user data
   * @returns Team member information
   */
  @Roles(UserRole.ADMIN, UserRole.MANAGER, UserRole.PROJECT_MANAGER)
  @Get('team')
  async getTeamMembers(@Request() req: { user: AuthenticatedUser }) {
    const { role } = req.user;

    return {
      message: 'Team members retrieved successfully',
      requestedBy: {
        role,
        hasAccess: 'Management level access confirmed',
      },
      teamMembers: [
        {
          id: '1',
          email: 'pm1@mssp.com',
          role: UserRole.PROJECT_MANAGER,
          projects: ['Project Alpha', 'Project Beta'],
        },
        {
          id: '2',
          email: 'am1@mssp.com',
          role: UserRole.ACCOUNT_MANAGER,
          clients: ['Client A', 'Client B'],
        },
      ],
    };
  }
} 