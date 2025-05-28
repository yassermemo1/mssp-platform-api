import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { User } from '../../../entities/user.entity';

/**
 * CurrentUser Decorator
 * A custom parameter decorator to extract the current authenticated user from the request
 * 
 * This decorator retrieves the user object that was attached to the request
 * by the JWT authentication strategy during the authentication process
 * 
 * @returns The authenticated User object from the request
 * 
 * Usage Example:
 * async someMethod(@CurrentUser() user: User) {
 *   // user contains the authenticated user data
 * }
 * 
 * Note: This decorator should only be used on routes protected by JwtAuthGuard
 */
export const CurrentUser = createParamDecorator(
  (data: unknown, ctx: ExecutionContext): User => {
    const request = ctx.switchToHttp().getRequest();
    return request.user;
  },
); 