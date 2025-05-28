import {
  IsString,
  IsOptional,
  IsEnum,
  IsDateString,
  IsNumber,
  IsPositive,
  Length,
  MaxLength,
} from 'class-validator';
import { Transform } from 'class-transformer';
import { HardwareAssetType, HardwareAssetStatus } from '../../../enums';

/**
 * CreateHardwareAssetDto
 * Data Transfer Object for creating new hardware assets
 * Includes comprehensive validation for all fields
 */
export class CreateHardwareAssetDto {
  /**
   * Unique asset tag for identification
   * Required for all assets
   */
  @IsString()
  @Length(1, 100, { message: 'Asset tag must be between 1 and 100 characters' })
  @Transform(({ value }) => value?.trim())
  assetTag: string;

  /**
   * Serial number of the hardware (optional but unique if provided)
   */
  @IsOptional()
  @IsString()
  @MaxLength(255, { message: 'Serial number must not exceed 255 characters' })
  @Transform(({ value }) => value?.trim() || null)
  serialNumber?: string;

  /**
   * Device name or model name (optional)
   */
  @IsOptional()
  @IsString()
  @MaxLength(255, { message: 'Device name must not exceed 255 characters' })
  @Transform(({ value }) => value?.trim() || null)
  deviceName?: string;

  /**
   * Manufacturer of the hardware (optional)
   */
  @IsOptional()
  @IsString()
  @MaxLength(100, { message: 'Manufacturer must not exceed 100 characters' })
  @Transform(({ value }) => value?.trim() || null)
  manufacturer?: string;

  /**
   * Model number or name (optional)
   */
  @IsOptional()
  @IsString()
  @MaxLength(100, { message: 'Model must not exceed 100 characters' })
  @Transform(({ value }) => value?.trim() || null)
  model?: string;

  /**
   * Type of hardware asset
   */
  @IsEnum(HardwareAssetType, {
    message: `Asset type must be one of: ${Object.values(HardwareAssetType).join(', ')}`,
  })
  assetType: HardwareAssetType;

  /**
   * Current status of the hardware asset (optional, defaults to IN_STOCK)
   */
  @IsOptional()
  @IsEnum(HardwareAssetStatus, {
    message: `Status must be one of: ${Object.values(HardwareAssetStatus).join(', ')}`,
  })
  status?: HardwareAssetStatus;

  /**
   * Date when the hardware was purchased (optional)
   */
  @IsOptional()
  @IsDateString({}, { message: 'Purchase date must be a valid date string (YYYY-MM-DD)' })
  purchaseDate?: string;

  /**
   * Purchase cost of the hardware (optional)
   */
  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 2 }, { message: 'Purchase cost must be a valid number with up to 2 decimal places' })
  @IsPositive({ message: 'Purchase cost must be a positive number' })
  @Transform(({ value }) => value ? parseFloat(value) : null)
  purchaseCost?: number;

  /**
   * Warranty expiry date (optional)
   */
  @IsOptional()
  @IsDateString({}, { message: 'Warranty expiry date must be a valid date string (YYYY-MM-DD)' })
  warrantyExpiryDate?: string;

  /**
   * Current physical location of the hardware (optional)
   */
  @IsOptional()
  @IsString()
  @MaxLength(255, { message: 'Location must not exceed 255 characters' })
  @Transform(({ value }) => value?.trim() || null)
  location?: string;

  /**
   * Additional notes about the hardware asset (optional)
   */
  @IsOptional()
  @IsString()
  @Transform(({ value }) => value?.trim() || null)
  notes?: string;
} 