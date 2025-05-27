import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { UserRole } from '../../../enums/user-role.enum';

/**
 * JWT Payload Interface
 * Defines the structure of the JWT payload that we issue during login
 */
export interface JwtPayload {
  sub: string; // User ID
  email: string;
  role: UserRole;
  iat?: number; // Issued at
  exp?: number; // Expires at
}

/**
 * Authenticated User Interface
 * Defines the user object that will be attached to the request after authentication
 */
export interface AuthenticatedUser {
  userId: string;
  email: string;
  role: UserRole;
}

/**
 * JWT Authentication Strategy
 * Handles JWT token validation and user extraction for protected routes
 */
@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy, 'jwt') {
  constructor(private readonly configService: ConfigService) {
    super({
      // Extract JWT from Authorization header as Bearer token
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      // Don't ignore token expiration
      ignoreExpiration: false,
      // Use the same secret that was used to sign the token
      secretOrKey: configService.get<string>('JWT_SECRET'),
    });
  }

  /**
   * Validate JWT Payload
   * This method is called automatically by Passport after the JWT is verified
   * The payload contains the data we encoded during login
   * 
   * @param payload - The decoded JWT payload
   * @returns AuthenticatedUser object that will be attached to request.user
   */
  async validate(payload: JwtPayload): Promise<AuthenticatedUser> {
    // Basic payload validation
    if (!payload.sub || !payload.email || !payload.role) {
      throw new UnauthorizedException('Invalid token payload');
    }

    // Validate that the role is a valid UserRole enum value
    if (!Object.values(UserRole).includes(payload.role)) {
      throw new UnauthorizedException('Invalid user role in token');
    }

    // Return the user object that will be attached to request.user
    // We return essential information needed for authorization decisions
    return {
      userId: payload.sub,
      email: payload.email,
      role: payload.role,
    };
  }
} 