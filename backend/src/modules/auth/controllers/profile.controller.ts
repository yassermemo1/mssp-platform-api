import { Controller, Get, UseGuards, Request } from '@nestjs/common';
import { JwtAuthGuard } from '../guards/jwt-auth.guard';
import { AuthenticatedUser } from '../strategies/jwt.strategy';

/**
 * Profile Controller
 * Handles user profile-related operations
 * Demonstrates the usage of JWT authentication
 */
@Controller('profile')
@UseGuards(JwtAuthGuard) // Apply JWT authentication to all routes in this controller
export class ProfileController {
  /**
   * Get current user's profile
   * GET /profile/me
   * 
   * This endpoint demonstrates:
   * - JWT authentication requirement (via JwtAuthGuard)
   * - Accessing authenticated user data from the request object
   * 
   * @param req - Express request object with attached user data
   * @returns The authenticated user's profile information
   */
  @Get('me')
  async getMyProfile(@Request() req: { user: AuthenticatedUser }) {
    // The user object is automatically attached to the request by JwtAuthGuard/JwtStrategy
    const { userId, email, role } = req.user;

    return {
      message: 'Profile retrieved successfully',
      user: {
        id: userId,
        email,
        role,
      },
    };
  }

  /**
   * Get user settings (example of another protected endpoint)
   * GET /profile/settings
   * 
   * @param req - Express request object with attached user data
   * @returns User settings (mock data for demonstration)
   */
  @Get('settings')
  async getSettings(@Request() req: { user: AuthenticatedUser }) {
    const { userId, email } = req.user;

    return {
      message: 'Settings retrieved successfully',
      settings: {
        userId,
        email,
        notifications: true,
        theme: 'light',
        language: 'en',
      },
    };
  }
} 