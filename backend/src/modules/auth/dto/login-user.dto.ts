import {
  IsEmail,
  IsNotEmpty,
  IsString,
} from 'class-validator';

/**
 * Data Transfer Object for user login
 * Defines the structure and validation rules for login credentials
 */
export class LoginUserDto {
  /**
   * User's email address
   */
  @IsNotEmpty({ message: 'Email is required' })
  @IsEmail({}, { message: 'Please provide a valid email address' })
  email: string;

  /**
   * User's password
   */
  @IsNotEmpty({ message: 'Password is required' })
  @IsString({ message: 'Password must be a string' })
  password: string;
} 