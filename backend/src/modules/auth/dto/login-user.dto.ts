import {
  IsEmail,
  IsNotEmpty,
  IsString,
} from 'class-validator';
import { Transform } from 'class-transformer';

/**
 * Data Transfer Object for user login
 * Defines the structure and validation rules for login credentials
 */
export class LoginUserDto {
  /**
   * User's email address
   * Automatically normalized to lowercase and trimmed
   */
  @IsNotEmpty({ message: 'Email is required' })
  @IsEmail({}, { message: 'Please provide a valid email address' })
  @Transform(({ value }) => typeof value === 'string' ? value.toLowerCase().trim() : value)
  email: string;

  /**
   * User's password
   */
  @IsNotEmpty({ message: 'Password is required' })
  @IsString({ message: 'Password must be a string' })
  password: string;
} 