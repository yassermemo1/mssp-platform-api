import { registerAs } from '@nestjs/config';

/**
 * JWT configuration interface for type safety
 */
export interface JwtConfig {
  secret: string;
  expiresIn: string;
}

/**
 * JWT configuration factory function
 * This provides typed access to JWT-related environment variables
 */
export const jwtConfig = registerAs(
  'jwt',
  (): JwtConfig => ({
    secret: process.env.JWT_SECRET,
    expiresIn: process.env.JWT_EXPIRES_IN || '60m',
  }),
);
