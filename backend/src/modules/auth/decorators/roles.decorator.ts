import { SetMetadata } from '@nestjs/common';
import { UserRole } from '../../../enums/user-role.enum';

/**
 * Metadata key for storing required roles
 * This key is used to store and retrieve role requirements from route handlers
 */
export const ROLES_KEY = 'roles';

/**
 * Roles Decorator
 * A custom decorator to specify which roles are required to access a route
 * 
 * This decorator uses NestJS's SetMetadata to attach role requirements
 * to route handlers, which can then be read by the RolesGuard
 * 
 * @param roles - Array of UserRole enum values that are allowed to access the route
 * @returns A decorator function that attaches the roles metadata
 * 
 * Usage Examples:
 * @Roles(UserRole.ADMIN) - Only admins can access
 * @Roles(UserRole.ADMIN, UserRole.MANAGER) - Admins or managers can access
 * @Roles(UserRole.ADMIN, UserRole.MANAGER, UserRole.PROJECT_MANAGER) - Multiple roles
 * 
 * Note: This decorator should be used in conjunction with JwtAuthGuard and RolesGuard
 */
export const Roles = (...roles: UserRole[]) => SetMetadata(ROLES_KEY, roles); 