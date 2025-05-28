import {
  IsString,
  IsEmail,
  IsOptional,
  IsEnum,
  IsNotEmpty,
  MaxLength,
  MinLength,
  IsObject,
  IsUrl,
} from 'class-validator';
import { ClientStatus } from '../../../enums/client-status.enum';

/**
 * Data Transfer Object for creating a new client
 * Validates incoming request data for client creation
 */
export class CreateClientDto {
  /**
   * Company name - required and must be unique
   */
  @IsString()
  @IsNotEmpty()
  @MinLength(2, { message: 'Company name must be at least 2 characters long' })
  @MaxLength(255, { message: 'Company name must not exceed 255 characters' })
  companyName: string;

  /**
   * Primary contact person's name - required
   */
  @IsString()
  @IsNotEmpty()
  @MinLength(2, { message: 'Contact name must be at least 2 characters long' })
  @MaxLength(100, { message: 'Contact name must not exceed 100 characters' })
  contactName: string;

  /**
   * Primary contact person's email - required and must be valid email format
   */
  @IsEmail({}, { message: 'Contact email must be a valid email address' })
  @IsNotEmpty()
  @MaxLength(255, { message: 'Contact email must not exceed 255 characters' })
  contactEmail: string;

  /**
   * Primary contact person's phone number - optional
   */
  @IsOptional()
  @IsString()
  @MaxLength(50, { message: 'Contact phone must not exceed 50 characters' })
  contactPhone?: string;

  /**
   * Company address - optional
   */
  @IsOptional()
  @IsString()
  address?: string;

  /**
   * Industry sector - optional
   */
  @IsOptional()
  @IsString()
  @MaxLength(100, { message: 'Industry must not exceed 100 characters' })
  industry?: string;

  /**
   * Company website URL - optional
   */
  @IsOptional()
  @IsUrl({}, { message: 'Website must be a valid URL' })
  @MaxLength(255, { message: 'Website URL must not exceed 255 characters' })
  website?: string;

  /**
   * Additional notes about the client - optional
   */
  @IsOptional()
  @IsString()
  notes?: string;

  /**
   * Client status - optional, defaults to PROSPECT if not provided
   */
  @IsOptional()
  @IsEnum(ClientStatus, {
    message: 'Status must be one of: prospect, active, inactive, expired, renewed',
  })
  status?: ClientStatus;

  /**
   * Custom field data - optional
   * Contains values for admin-defined custom fields
   */
  @IsOptional()
  @IsObject()
  customFieldData?: Record<string, any>;
} 