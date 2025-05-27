import {
  Injectable,
  ConflictException,
  InternalServerErrorException,
  UnauthorizedException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { JwtService } from '@nestjs/jwt';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { User } from '../../entities/user.entity';
import { UserRole } from '../../enums/user-role.enum';
import { RegisterUserDto } from './dto/register-user.dto';
import { LoginUserDto } from './dto/login-user.dto';

/**
 * JWT Payload interface
 * Defines the structure of data stored in JWT tokens
 */
export interface JwtPayload {
  sub: string; // User ID
  email: string;
  role: UserRole;
  iat?: number; // Issued at
  exp?: number; // Expiration time
}

/**
 * Login Response interface
 * Defines the structure of successful login response
 */
export interface LoginResponse {
  access_token: string;
  user: Partial<User>;
}

/**
 * Authentication Service
 * Handles user authentication operations including registration, login, and JWT management
 */
@Injectable()
export class AuthService {
  private readonly saltRounds = 12; // Strong salt rounds for bcrypt

  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    private readonly jwtService: JwtService,
  ) {}

  /**
   * Hash a plain text password using bcrypt
   * @param password - Plain text password to hash
   * @returns Promise<string> - Hashed password
   */
  async hashPassword(password: string): Promise<string> {
    try {
      return await bcrypt.hash(password, this.saltRounds);
    } catch (error) {
      throw new InternalServerErrorException('Error hashing password');
    }
  }

  /**
   * Compare a plain text password with a hashed password
   * @param password - Plain text password
   * @param hashedPassword - Hashed password from database
   * @returns Promise<boolean> - True if passwords match
   */
  async comparePasswords(
    password: string,
    hashedPassword: string,
  ): Promise<boolean> {
    try {
      return await bcrypt.compare(password, hashedPassword);
    } catch (error) {
      throw new InternalServerErrorException('Error comparing passwords');
    }
  }

  /**
   * Generate JWT token for authenticated user
   * @param user - User entity
   * @returns string - JWT access token
   */
  private generateJwtToken(user: User): string {
    const payload: JwtPayload = {
      sub: user.id,
      email: user.email,
      role: user.role,
    };

    return this.jwtService.sign(payload);
  }

  /**
   * Validate user credentials and return user if valid
   * @param email - User's email
   * @param password - User's password
   * @returns Promise<User | null> - User entity if valid, null otherwise
   */
  private async validateUser(email: string, password: string): Promise<User | null> {
    const user = await this.findUserByEmail(email);
    
    if (!user) {
      return null;
    }

    // Check if user account is active
    if (!user.isActive) {
      return null;
    }

    const isPasswordValid = await this.comparePasswords(password, user.password);
    
    if (!isPasswordValid) {
      return null;
    }

    return user;
  }

  /**
   * Authenticate user and generate JWT token
   * @param loginUserDto - Login credentials
   * @returns Promise<LoginResponse> - Access token and user data
   */
  async login(loginUserDto: LoginUserDto): Promise<LoginResponse> {
    const { email, password } = loginUserDto;

    try {
      // Validate user credentials
      const user = await this.validateUser(email, password);

      if (!user) {
        // Generic error message to avoid revealing whether email exists
        throw new UnauthorizedException('Invalid credentials');
      }

      // Generate JWT token
      const accessToken = this.generateJwtToken(user);

      // Return user data without password
      const { password: _, ...userWithoutPassword } = user;

      return {
        access_token: accessToken,
        user: userWithoutPassword,
      };
    } catch (error) {
      if (error instanceof UnauthorizedException) {
        throw error;
      }
      throw new InternalServerErrorException(
        'An error occurred during authentication',
      );
    }
  }

  /**
   * Register a new user
   * @param registerUserDto - User registration data
   * @returns Promise<Partial<User>> - Created user without password
   */
  async register(registerUserDto: RegisterUserDto): Promise<Partial<User>> {
    const { firstName, lastName, email, password, role } = registerUserDto;

    // Check if user with this email already exists
    const existingUser = await this.userRepository.findOne({
      where: { email: email.toLowerCase() },
    });

    if (existingUser) {
      throw new ConflictException(
        'A user with this email address already exists',
      );
    }

    try {
      // Hash the password
      const hashedPassword = await this.hashPassword(password);

      // Create new user entity
      const newUser = this.userRepository.create({
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        email: email.toLowerCase().trim(),
        password: hashedPassword,
        role: role || UserRole.ENGINEER, // Default to ENGINEER if no role provided
        isActive: true,
      });

      // Save user to database
      const savedUser = await this.userRepository.save(newUser);

      // Return user without password
      const { password: _, ...userWithoutPassword } = savedUser;
      return userWithoutPassword;
    } catch (error) {
      if (error instanceof ConflictException) {
        throw error;
      }
      throw new InternalServerErrorException(
        'An error occurred while creating the user account',
      );
    }
  }

  /**
   * Find user by email (for authentication purposes)
   * @param email - User's email address
   * @returns Promise<User | null> - User entity or null if not found
   */
  async findUserByEmail(email: string): Promise<User | null> {
    return await this.userRepository.findOne({
      where: { email: email.toLowerCase() },
    });
  }

  /**
   * Find user by ID (for JWT validation)
   * @param id - User's ID
   * @returns Promise<User | null> - User entity or null if not found
   */
  async findUserById(id: string): Promise<User | null> {
    return await this.userRepository.findOne({
      where: { id, isActive: true },
    });
  }
} 