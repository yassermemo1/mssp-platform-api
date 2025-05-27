import { Injectable, CanActivate, ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { UserRole } from '../../../enums/user-role.enum';
import { ROLES_KEY } from '../decorators/roles.decorator';
import { AuthenticatedUser } from '../strategies/jwt.strategy';

/**
 * Roles Guard
 * Implements role-based access control (RBAC) for protected routes
 * 
 * This guard works in conjunction with JwtAuthGuard and the @Roles decorator:
 * 1. JwtAuthGuard runs first to authenticate the user and attach user info to the request
 * 2. RolesGuard then checks if the authenticated user has the required role(s)
 * 
 * Security Design Decisions:
 * - If no @Roles decorator is present on a route, access is ALLOWED by default
 *   (assuming JwtAuthGuard has already verified authentication)
 * - If @Roles decorator is present, the user must have at least ONE of the specified roles
 * - Missing or invalid user information results in a 403 Forbidden response
 */
@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  /**
   * Determines if the current user can activate/access the route
   * 
   * @param context - The execution context containing request information
   * @returns boolean indicating if access should be granted
   * @throws ForbiddenException if the user lacks required permissions
   */
  canActivate(context: ExecutionContext): boolean {
    // Get the required roles from the route handler's metadata
    // This checks both the handler method and the controller class for @Roles decorator
    const requiredRoles = this.reflector.getAllAndOverride<UserRole[]>(ROLES_KEY, [
      context.getHandler(), // Method-level @Roles decorator
      context.getClass(),   // Class-level @Roles decorator
    ]);

    // If no roles are specified, allow access (authentication was already verified by JwtAuthGuard)
    if (!requiredRoles || requiredRoles.length === 0) {
      return true;
    }

    // Get the authenticated user from the request object
    // This user object was attached by the JwtAuthGuard/JwtStrategy
    const request = context.switchToHttp().getRequest();
    const user: AuthenticatedUser = request.user;

    // Validate that we have a user object (this should always be present if JwtAuthGuard ran first)
    if (!user || !user.role) {
      throw new ForbiddenException('User information not found in request');
    }

    // Check if the user's role matches any of the required roles
    const hasRequiredRole = requiredRoles.includes(user.role);

    if (!hasRequiredRole) {
      throw new ForbiddenException(
        `Access denied. Required roles: ${requiredRoles.join(', ')}. User role: ${user.role}`
      );
    }

    return true;
  }
} 