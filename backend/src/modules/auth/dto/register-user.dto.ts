import {
  IsEmail,
  IsNotEmpty,
  IsString,
  MinLength,
  MaxLength,
  IsOptional,
  IsEnum,
  IsObject,
} from 'class-validator';
import { Transform } from 'class-transformer';
import { UserRole } from '../../../enums/user-role.enum';

/**
 * Data Transfer Object for user registration
 * Defines the structure and validation rules for registration data
 */
export class RegisterUserDto {
  /**
   * User's first name
   */
  @IsNotEmpty({ message: 'First name is required' })
  @IsString({ message: 'First name must be a string' })
  @MaxLength(100, { message: 'First name cannot exceed 100 characters' })
  @Transform(({ value }) => typeof value === 'string' ? value.trim() : value)
  firstName: string;

  /**
   * User's last name
   */
  @IsNotEmpty({ message: 'Last name is required' })
  @IsString({ message: 'Last name must be a string' })
  @MaxLength(100, { message: 'Last name cannot exceed 100 characters' })
  @Transform(({ value }) => typeof value === 'string' ? value.trim() : value)
  lastName: string;

  /**
   * User's email address
   * Automatically normalized to lowercase and trimmed
   */
  @IsNotEmpty({ message: 'Email is required' })
  @IsEmail({}, { message: 'Please provide a valid email address' })
  @MaxLength(255, { message: 'Email cannot exceed 255 characters' })
  @Transform(({ value }) => typeof value === 'string' ? value.toLowerCase().trim() : value)
  email: string;

  /**
   * User's password
   * Simple but effective validation: minimum 8 characters
   */
  @IsNotEmpty({ message: 'Password is required' })
  @IsString({ message: 'Password must be a string' })
  @MinLength(8, { message: 'Password must be at least 8 characters long' })
  @MaxLength(255, { message: 'Password cannot exceed 255 characters' })
  password: string;

  /**
   * User's role - optional for self-registration
   * If not provided, defaults to ENGINEER role
   */
  @IsOptional()
  @IsEnum(UserRole, { message: 'Invalid role provided' })
  role?: UserRole;

  /**
   * Custom field data - optional
   * Contains values for admin-defined custom fields
   */
  @IsOptional()
  @IsObject()
  customFieldData?: Record<string, any>;
} 