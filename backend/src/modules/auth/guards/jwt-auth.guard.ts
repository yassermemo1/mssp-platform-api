import { Injectable, ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { AuthGuard } from '@nestjs/passport';
import { Observable } from 'rxjs';
import { IS_PUBLIC_KEY } from '../decorators/public.decorator';

/**
 * JWT Authentication Guard
 * Protects routes by requiring a valid JWT token in the Authorization header
 * 
 * This guard leverages the JwtStrategy we defined to:
 * 1. Extract the JWT from the Authorization header
 * 2. Validate the token signature and expiration
 * 3. Decode the payload and attach the user to the request object
 * 
 * Features:
 * - Supports @Public() decorator to bypass authentication for specific routes
 * - Provides detailed error messages for different authentication failures
 * - Can be applied globally or to specific routes/controllers
 * 
 * Usage:
 * - Apply to individual routes: @UseGuards(JwtAuthGuard)
 * - Apply to entire controllers: @UseGuards(JwtAuthGuard) on the controller class
 * - Apply globally: APP_GUARD provider in app module
 */
@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {
  constructor(private reflector: Reflector) {
    super();
  }

  /**
   * Override canActivate to support public routes and provide custom error handling
   * 
   * @param context - The execution context
   * @returns boolean or Promise<boolean> indicating if the request should proceed
   */
  canActivate(context: ExecutionContext): boolean | Promise<boolean> | Observable<boolean> {
    // Check if the route is marked as public
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    // If the route is public, skip authentication
    if (isPublic) {
      return true;
    }

    // Otherwise, proceed with JWT authentication
    return super.canActivate(context);
  }

  /**
   * Override handleRequest to customize error responses
   * This method is called after the JWT strategy validates the token
   * 
   * @param err - Any error that occurred during authentication
   * @param user - The user object returned by the JWT strategy
   * @param info - Additional information about the authentication attempt
   * @returns The authenticated user object
   * @throws UnauthorizedException for various authentication failures
   */
  handleRequest(err: any, user: any, info: any) {
    // If there's an error or no user, authentication failed
    if (err || !user) {
      // Handle specific JWT errors with descriptive messages
      if (info?.name === 'TokenExpiredError') {
        throw new UnauthorizedException('Token has expired');
      }
      
      if (info?.name === 'JsonWebTokenError') {
        throw new UnauthorizedException('Invalid token');
      }
      
      if (info?.name === 'NotBeforeError') {
        throw new UnauthorizedException('Token not active yet');
      }
      
      if (info?.message === 'No auth token') {
        throw new UnauthorizedException('Authorization token is required');
      }
      
      // Generic authentication failure
      throw new UnauthorizedException('Authentication failed');
    }
    
    // Authentication successful, return the user object
    return user;
  }
} 