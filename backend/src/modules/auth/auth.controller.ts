import {
  Controller,
  Post,
  Body,
  HttpCode,
  HttpStatus,
  ValidationPipe,
} from '@nestjs/common';
import { AuthService, LoginResponse } from './auth.service';
import { RegisterUserDto } from './dto/register-user.dto';
import { LoginUserDto } from './dto/login-user.dto';
import { User } from '../../entities/user.entity';
import { Public } from './decorators/public.decorator';

/**
 * Authentication Controller
 * Handles authentication-related HTTP requests
 */
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  /**
   * Register a new user
   * POST /auth/register
   * @param registerUserDto - User registration data
   * @returns Promise<{ message: string; user: Partial<User> }>
   */
  @Public()
  @Post('register')
  @HttpCode(HttpStatus.CREATED)
  async register(
    @Body(new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true }))
    registerUserDto: RegisterUserDto,
  ): Promise<{ message: string; user: Partial<User> }> {
    const user = await this.authService.register(registerUserDto);

    return {
      message: 'User registered successfully',
      user,
    };
  }

  /**
   * Authenticate user and issue JWT token
   * POST /auth/login
   * @param loginUserDto - User login credentials
   * @returns Promise<LoginResponse> - Access token and user data
   */
  @Public()
  @Post('login')
  @HttpCode(HttpStatus.OK)
  async login(
    @Body(new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true }))
    loginUserDto: LoginUserDto,
  ): Promise<LoginResponse> {
    return await this.authService.login(loginUserDto);
  }
} 