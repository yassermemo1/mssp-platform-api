import { SetMetadata } from '@nestjs/common';

/**
 * Metadata key for marking public routes
 */
export const IS_PUBLIC_KEY = 'isPublic';

/**
 * Public Decorator
 * Marks a route as public, bypassing authentication requirements
 * 
 * This decorator is useful when you have global authentication guards
 * but need certain routes (like login, register, health checks) to be accessible
 * without authentication
 * 
 * Usage:
 * @Public()
 * @Post('login')
 * async login() { ... }
 * 
 * Note: This decorator should be used with a modified JwtAuthGuard that checks for this metadata
 */
export const Public = () => SetMetadata(IS_PUBLIC_KEY, true); 