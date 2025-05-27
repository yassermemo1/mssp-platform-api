import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { User } from '../../entities/user.entity';
import { JwtStrategy } from './strategies/jwt.strategy';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { RolesGuard } from './guards/roles.guard';
import { ProfileController } from './controllers/profile.controller';
import { UsersController } from './controllers/users.controller';

/**
 * Authentication Module
 * Handles user authentication and authorization functionality
 * 
 * This module provides:
 * - User registration and login
 * - JWT token generation and validation
 * - Authentication guards for protecting routes
 * - Role-based access control (RBAC)
 * - Example controllers demonstrating usage
 */
@Module({
  imports: [
    // Import TypeORM repository for User entity
    TypeOrmModule.forFeature([User]),
    
    // Configure Passport module
    PassportModule.register({ defaultStrategy: 'jwt' }),
    
    // Configure JWT module asynchronously to access environment variables
    JwtModule.registerAsync({
      imports: [ConfigModule],
      useFactory: async (configService: ConfigService) => ({
        secret: configService.get<string>('JWT_SECRET'),
        signOptions: {
          expiresIn: configService.get<string>('JWT_EXPIRES_IN', '60m'),
        },
      }),
      inject: [ConfigService],
    }),
  ],
  controllers: [
    AuthController,    // Authentication endpoints (login, register)
    ProfileController, // User profile endpoints (demonstrates JWT auth)
    UsersController,   // User management endpoints (demonstrates RBAC)
  ],
  providers: [
    AuthService,
    JwtStrategy,    // JWT authentication strategy
    JwtAuthGuard,   // JWT authentication guard
    RolesGuard,     // Role-based authorization guard
  ],
  exports: [
    AuthService,
    JwtModule,
    JwtAuthGuard,   // Export for use in other modules
    RolesGuard,     // Export for use in other modules
    JwtStrategy,    // Export for use in other modules
  ],
})
export class AuthModule {} 