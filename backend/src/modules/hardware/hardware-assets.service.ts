import {
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, FindManyOptions, Like, In } from 'typeorm';
import { HardwareAsset } from '../../entities/hardware-asset.entity';
import { CreateHardwareAssetDto, UpdateHardwareAssetDto } from './dto';
import { User } from '../../entities/user.entity';
import { HardwareAssetType, HardwareAssetStatus } from '../../enums';

/**
 * Query options interface for filtering hardware assets
 */
interface HardwareAssetQueryOptions {
  assetTag?: string;
  serialNumber?: string;
  assetType?: HardwareAssetType;
  status?: HardwareAssetStatus;
  location?: string;
  manufacturer?: string;
  model?: string;
}

/**
 * Pagination options interface
 */
interface PaginationOptions {
  page?: number;
  limit?: number;
}

/**
 * Paginated result interface
 */
export interface PaginatedResult<T> {
  data: T[];
  count: number;
  page: number;
  limit: number;
  totalPages: number;
}

/**
 * HardwareAssetsService
 * Handles all business logic for hardware asset CRUD operations
 * Includes inventory management, status tracking, and lifecycle operations
 */
@Injectable()
export class HardwareAssetsService {
  private readonly logger = new Logger(HardwareAssetsService.name);

  constructor(
    @InjectRepository(HardwareAsset)
    private readonly hardwareAssetRepository: Repository<HardwareAsset>,
  ) {}

  /**
   * Create a new hardware asset
   * @param createDto - Data for creating the hardware asset
   * @param currentUser - The authenticated user creating the asset
   * @returns Promise<HardwareAsset> - The created hardware asset
   * @throws ConflictException if asset tag or serial number already exists
   */
  async create(
    createDto: CreateHardwareAssetDto,
    currentUser: User,
  ): Promise<HardwareAsset> {
    this.logger.log(
      `Creating new hardware asset: ${createDto.assetTag} by user: ${currentUser.email}`,
    );

    try {
      // Check if asset tag already exists
      const existingAssetByTag = await this.hardwareAssetRepository.findOne({
        where: { assetTag: createDto.assetTag },
      });

      if (existingAssetByTag) {
        throw new ConflictException(
          `Hardware asset with asset tag '${createDto.assetTag}' already exists`,
        );
      }

      // Check if serial number already exists (if provided)
      if (createDto.serialNumber) {
        const existingAssetBySerial = await this.hardwareAssetRepository.findOne({
          where: { serialNumber: createDto.serialNumber },
        });

        if (existingAssetBySerial) {
          throw new ConflictException(
            `Hardware asset with serial number '${createDto.serialNumber}' already exists`,
          );
        }
      }

      // Create new hardware asset entity
      const hardwareAsset = this.hardwareAssetRepository.create({
        ...createDto,
        purchaseDate: createDto.purchaseDate ? new Date(createDto.purchaseDate) : null,
        warrantyExpiryDate: createDto.warrantyExpiryDate ? new Date(createDto.warrantyExpiryDate) : null,
        status: createDto.status || HardwareAssetStatus.IN_STOCK,
      });

      // Save the hardware asset
      const savedAsset = await this.hardwareAssetRepository.save(hardwareAsset);

      this.logger.log(
        `Successfully created hardware asset with ID: ${savedAsset.id}`,
      );

      return savedAsset;
    } catch (error) {
      if (error instanceof ConflictException) {
        throw error;
      }

      this.logger.error(
        `Failed to create hardware asset: ${createDto.assetTag}`,
        error.stack,
      );
      throw error;
    }
  }

  /**
   * Retrieve hardware assets with filtering and pagination
   * @param queryOptions - Optional query parameters for filtering
   * @param paginationOptions - Optional pagination parameters
   * @returns Promise<PaginatedResult<HardwareAsset>> - Paginated hardware assets
   */
  async findAll(
    queryOptions?: HardwareAssetQueryOptions,
    paginationOptions?: PaginationOptions,
  ): Promise<PaginatedResult<HardwareAsset>> {
    this.logger.log('Retrieving hardware assets with filters and pagination');

    try {
      const page = paginationOptions?.page || 1;
      const limit = paginationOptions?.limit || 10;
      const skip = (page - 1) * limit;

      // Build where clause based on query options
      const where: any = {};

      if (queryOptions?.assetTag) {
        where.assetTag = Like(`%${queryOptions.assetTag}%`);
      }

      if (queryOptions?.serialNumber) {
        where.serialNumber = Like(`%${queryOptions.serialNumber}%`);
      }

      if (queryOptions?.assetType) {
        where.assetType = queryOptions.assetType;
      }

      if (queryOptions?.status) {
        where.status = queryOptions.status;
      }

      if (queryOptions?.location) {
        where.location = Like(`%${queryOptions.location}%`);
      }

      if (queryOptions?.manufacturer) {
        where.manufacturer = Like(`%${queryOptions.manufacturer}%`);
      }

      if (queryOptions?.model) {
        where.model = Like(`%${queryOptions.model}%`);
      }

      const findOptions: FindManyOptions<HardwareAsset> = {
        where,
        order: {
          createdAt: 'DESC',
        },
        skip,
        take: limit,
        relations: ['assignments'],
      };

      const [assets, count] = await this.hardwareAssetRepository.findAndCount(findOptions);

      const totalPages = Math.ceil(count / limit);

      this.logger.log(`Retrieved ${assets.length} hardware assets (page ${page}/${totalPages})`);

      return {
        data: assets,
        count,
        page,
        limit,
        totalPages,
      };
    } catch (error) {
      this.logger.error('Failed to retrieve hardware assets', error.stack);
      throw error;
    }
  }

  /**
   * Retrieve a single hardware asset by ID
   * @param id - UUID of the hardware asset
   * @returns Promise<HardwareAsset> - The found hardware asset
   * @throws NotFoundException if hardware asset doesn't exist
   */
  async findOne(id: string): Promise<HardwareAsset> {
    this.logger.log(`Retrieving hardware asset with ID: ${id}`);

    try {
      const asset = await this.hardwareAssetRepository.findOne({
        where: { id },
        relations: ['assignments', 'assignments.client', 'assignments.serviceScope'],
      });

      if (!asset) {
        throw new NotFoundException(`Hardware asset with ID '${id}' not found`);
      }

      this.logger.log(`Successfully retrieved hardware asset: ${asset.assetTag}`);
      return asset;
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }

      this.logger.error(`Failed to retrieve hardware asset with ID: ${id}`, error.stack);
      throw error;
    }
  }

  /**
   * Update an existing hardware asset
   * @param id - UUID of the hardware asset to update
   * @param updateDto - Data for updating the hardware asset
   * @param currentUser - The authenticated user updating the asset
   * @returns Promise<HardwareAsset> - The updated hardware asset
   * @throws NotFoundException if hardware asset doesn't exist
   * @throws ConflictException if asset tag or serial number conflicts
   */
  async update(
    id: string,
    updateDto: UpdateHardwareAssetDto,
    currentUser: User,
  ): Promise<HardwareAsset> {
    this.logger.log(
      `Updating hardware asset with ID: ${id} by user: ${currentUser.email}`,
    );

    try {
      // First, check if the asset exists
      const existingAsset = await this.findOne(id);

      // Check for asset tag conflicts
      if (updateDto.assetTag && updateDto.assetTag !== existingAsset.assetTag) {
        const conflictingAsset = await this.hardwareAssetRepository.findOne({
          where: { assetTag: updateDto.assetTag },
        });

        if (conflictingAsset) {
          throw new ConflictException(
            `Hardware asset with asset tag '${updateDto.assetTag}' already exists`,
          );
        }
      }

      // Check for serial number conflicts
      if (updateDto.serialNumber && updateDto.serialNumber !== existingAsset.serialNumber) {
        const conflictingAsset = await this.hardwareAssetRepository.findOne({
          where: { serialNumber: updateDto.serialNumber },
        });

        if (conflictingAsset) {
          throw new ConflictException(
            `Hardware asset with serial number '${updateDto.serialNumber}' already exists`,
          );
        }
      }

      // Prepare update data
      const updateData: any = { ...updateDto };

      if (updateDto.purchaseDate) {
        updateData.purchaseDate = new Date(updateDto.purchaseDate);
      }

      if (updateDto.warrantyExpiryDate) {
        updateData.warrantyExpiryDate = new Date(updateDto.warrantyExpiryDate);
      }

      // Update the asset
      await this.hardwareAssetRepository.update(id, updateData);

      // Retrieve and return the updated asset
      const updatedAsset = await this.findOne(id);

      this.logger.log(
        `Successfully updated hardware asset: ${updatedAsset.assetTag}`,
      );

      return updatedAsset;
    } catch (error) {
      if (error instanceof NotFoundException || error instanceof ConflictException) {
        throw error;
      }

      this.logger.error(`Failed to update hardware asset with ID: ${id}`, error.stack);
      throw error;
    }
  }

  /**
   * Soft delete a hardware asset by updating its status
   * @param id - UUID of the hardware asset to delete
   * @param currentUser - The authenticated user deleting the asset
   * @returns Promise<HardwareAsset> - The updated hardware asset
   * @throws NotFoundException if hardware asset doesn't exist
   * @throws BadRequestException if asset is currently in active assignment
   */
  async remove(id: string, currentUser: User): Promise<HardwareAsset> {
    this.logger.log(
      `Soft deleting hardware asset with ID: ${id} by user: ${currentUser.email}`,
    );

    try {
      // First, check if the asset exists
      const existingAsset = await this.findOne(id);

      // Check if asset has active assignments
      const activeAssignments = existingAsset.assignments?.filter(
        assignment => assignment.isActive
      );

      if (activeAssignments && activeAssignments.length > 0) {
        throw new BadRequestException(
          `Cannot delete hardware asset '${existingAsset.assetTag}' as it has active assignments. Please return or cancel assignments first.`,
        );
      }

      // Update status to DISPOSED (soft delete)
      await this.hardwareAssetRepository.update(id, {
        status: HardwareAssetStatus.DISPOSED,
      });

      // Retrieve and return the updated asset
      const updatedAsset = await this.findOne(id);

      this.logger.log(
        `Successfully soft deleted hardware asset: ${updatedAsset.assetTag}`,
      );

      return updatedAsset;
    } catch (error) {
      if (error instanceof NotFoundException || error instanceof BadRequestException) {
        throw error;
      }

      this.logger.error(`Failed to delete hardware asset with ID: ${id}`, error.stack);
      throw error;
    }
  }

  /**
   * Get available hardware assets for assignment
   * @returns Promise<HardwareAsset[]> - Available hardware assets
   */
  async findAvailable(): Promise<HardwareAsset[]> {
    this.logger.log('Retrieving available hardware assets');

    try {
      const availableAssets = await this.hardwareAssetRepository.find({
        where: {
          status: In([HardwareAssetStatus.IN_STOCK, HardwareAssetStatus.AWAITING_DEPLOYMENT]),
        },
        order: {
          assetTag: 'ASC',
        },
      });

      this.logger.log(`Retrieved ${availableAssets.length} available hardware assets`);
      return availableAssets;
    } catch (error) {
      this.logger.error('Failed to retrieve available hardware assets', error.stack);
      throw error;
    }
  }

  /**
   * Update hardware asset status
   * @param id - UUID of the hardware asset
   * @param status - New status
   * @param currentUser - The authenticated user updating the status
   * @returns Promise<HardwareAsset> - The updated hardware asset
   */
  async updateStatus(
    id: string,
    status: HardwareAssetStatus,
    currentUser: User,
  ): Promise<HardwareAsset> {
    this.logger.log(
      `Updating hardware asset status for ID: ${id} to ${status} by user: ${currentUser.email}`,
    );

    try {
      const existingAsset = await this.findOne(id);

      await this.hardwareAssetRepository.update(id, { status });

      const updatedAsset = await this.findOne(id);

      this.logger.log(
        `Successfully updated hardware asset status: ${updatedAsset.assetTag} to ${status}`,
      );

      return updatedAsset;
    } catch (error) {
      this.logger.error(`Failed to update hardware asset status with ID: ${id}`, error.stack);
      throw error;
    }
  }
} 