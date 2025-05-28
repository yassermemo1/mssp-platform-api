import { PartialType } from '@nestjs/mapped-types';
import { CreateHardwareAssetDto } from './create-hardware-asset.dto';

/**
 * UpdateHardwareAssetDto
 * Data Transfer Object for updating hardware assets
 * Makes all fields from CreateHardwareAssetDto optional
 */
export class UpdateHardwareAssetDto extends PartialType(CreateHardwareAssetDto) {} 