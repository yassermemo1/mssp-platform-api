import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ConflictException,
  Logger,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, FindManyOptions, Like, LessThanOrEqual, MoreThanOrEqual } from 'typeorm';
import { Contract } from '../../entities/contract.entity';
import { Client } from '../../entities/client.entity';
import { ContractStatus } from '../../enums/contract-status.enum';
import { CreateContractDto, UpdateContractDto, ContractQueryDto } from './dto';
import { FilesService } from '../files/files.service';

/**
 * ContractsService
 * Business logic for comprehensive contract management
 * 
 * This service handles:
 * - Contract CRUD operations with validation
 * - Contract expiration tracking and filtering
 * - Contract-client relationship management
 * - Contract status updates and soft deletion
 * - Contract name uniqueness validation
 * - Pagination and filtering
 */
@Injectable()
export class ContractsService {
  private readonly logger = new Logger(ContractsService.name);

  constructor(
    @InjectRepository(Contract)
    private readonly contractRepository: Repository<Contract>,
    @InjectRepository(Client)
    private readonly clientRepository: Repository<Client>,
    private readonly filesService: FilesService,
  ) {}

  /**
   * Create a new contract
   * Validates client existence, contract name uniqueness, and date logic
   */
  async create(createContractDto: CreateContractDto, currentUser: any): Promise<Contract> {
    this.logger.log(`Creating new contract: ${createContractDto.contractName}`);

    // Validate client exists
    const client = await this.clientRepository.findOne({
      where: { id: createContractDto.clientId },
    });

    if (!client) {
      throw new NotFoundException(`Client with ID ${createContractDto.clientId} not found`);
    }

    // Validate previous contract exists if provided
    if (createContractDto.previousContractId) {
      const previousContract = await this.contractRepository.findOne({
        where: { id: createContractDto.previousContractId },
      });

      if (!previousContract) {
        throw new NotFoundException(
          `Previous contract with ID ${createContractDto.previousContractId} not found`,
        );
      }
    }

    // Validate contract name uniqueness
    const existingContract = await this.contractRepository.findOne({
      where: { contractName: createContractDto.contractName },
    });

    if (existingContract) {
      throw new ConflictException(
        `Contract with name '${createContractDto.contractName}' already exists`,
      );
    }

    // Validate date logic
    const startDate = new Date(createContractDto.startDate);
    const endDate = new Date(createContractDto.endDate);

    if (endDate <= startDate) {
      throw new BadRequestException('End date must be after start date');
    }

    // Create contract entity
    const contract = this.contractRepository.create({
      ...createContractDto,
      startDate,
      endDate,
      renewalDate: createContractDto.renewalDate ? new Date(createContractDto.renewalDate) : null,
      status: createContractDto.status || ContractStatus.DRAFT,
    });

    const savedContract = await this.contractRepository.save(contract);
    
    this.logger.log(`Contract created successfully with ID: ${savedContract.id}`);
    
    // Return contract with client relationship loaded
    return this.findOne(savedContract.id);
  }

  /**
   * Find all contracts with filtering and pagination
   * Supports filtering by client, status, expiration, and search
   */
  async findAll(queryDto: ContractQueryDto): Promise<{
    data: Contract[];
    count: number;
    page: number;
    limit: number;
    totalPages: number;
  }> {
    this.logger.log('Fetching contracts with filters', queryDto);

    const { clientId, status, expiringSoonDays, search, page = 1, limit = 10 } = queryDto;

    // Build query conditions
    const where: any = {};
    
    if (clientId) {
      where.clientId = clientId;
    }

    if (status) {
      where.status = status;
    }

    if (search) {
      where.contractName = Like(`%${search}%`);
    }

    // Handle expiring soon filter
    if (expiringSoonDays) {
      const now = new Date();
      const futureDate = new Date(now.getTime() + expiringSoonDays * 24 * 60 * 60 * 1000);
      
      where.endDate = LessThanOrEqual(futureDate);
      // Also ensure the contract hasn't already expired
      where.endDate = MoreThanOrEqual(now);
    }

    // Build find options
    const findOptions: FindManyOptions<Contract> = {
      where,
      relations: ['client', 'previousContract'],
      order: {
        createdAt: 'DESC',
      },
      skip: (page - 1) * limit,
      take: limit,
    };

    // Execute query
    const [contracts, count] = await this.contractRepository.findAndCount(findOptions);

    const totalPages = Math.ceil(count / limit);

    this.logger.log(`Found ${count} contracts (page ${page}/${totalPages})`);

    return {
      data: contracts,
      count,
      page,
      limit,
      totalPages,
    };
  }

  /**
   * Find a single contract by ID
   * Includes client and previous contract relationships
   */
  async findOne(id: string): Promise<Contract> {
    this.logger.log(`Fetching contract with ID: ${id}`);

    const contract = await this.contractRepository.findOne({
      where: { id },
      relations: ['client', 'previousContract', 'renewalContracts', 'serviceScopes'],
    });

    if (!contract) {
      throw new NotFoundException(`Contract with ID ${id} not found`);
    }

    return contract;
  }

  /**
   * Update an existing contract
   * Validates uniqueness, relationships, and date logic
   */
  async update(
    id: string,
    updateContractDto: UpdateContractDto,
    currentUser: any,
  ): Promise<Contract> {
    this.logger.log(`Updating contract with ID: ${id}`);

    // Check if contract exists
    const existingContract = await this.findOne(id);

    // Validate client exists if clientId is being updated
    if (updateContractDto.clientId && updateContractDto.clientId !== existingContract.clientId) {
      const client = await this.clientRepository.findOne({
        where: { id: updateContractDto.clientId },
      });

      if (!client) {
        throw new NotFoundException(`Client with ID ${updateContractDto.clientId} not found`);
      }
    }

    // Validate previous contract exists if being updated
    if (updateContractDto.previousContractId !== undefined) {
      if (updateContractDto.previousContractId) {
        const previousContract = await this.contractRepository.findOne({
          where: { id: updateContractDto.previousContractId },
        });

        if (!previousContract) {
          throw new NotFoundException(
            `Previous contract with ID ${updateContractDto.previousContractId} not found`,
          );
        }
      }
    }

    // Validate contract name uniqueness if being updated
    if (updateContractDto.contractName && updateContractDto.contractName !== existingContract.contractName) {
      const existingContractWithName = await this.contractRepository.findOne({
        where: { contractName: updateContractDto.contractName },
      });

      if (existingContractWithName) {
        throw new ConflictException(
          `Contract with name '${updateContractDto.contractName}' already exists`,
        );
      }
    }

    // Validate date logic if dates are being updated
    const startDate = updateContractDto.startDate 
      ? new Date(updateContractDto.startDate) 
      : existingContract.startDate;
    const endDate = updateContractDto.endDate 
      ? new Date(updateContractDto.endDate) 
      : existingContract.endDate;

    if (endDate <= startDate) {
      throw new BadRequestException('End date must be after start date');
    }

    // Prepare update data with proper type conversion
    const updateData: Partial<Contract> = {};

    // Copy non-date fields
    if (updateContractDto.contractName !== undefined) {
      updateData.contractName = updateContractDto.contractName;
    }
    if (updateContractDto.clientId !== undefined) {
      updateData.clientId = updateContractDto.clientId;
    }
    if (updateContractDto.value !== undefined) {
      updateData.value = updateContractDto.value;
    }
    if (updateContractDto.status !== undefined) {
      updateData.status = updateContractDto.status;
    }
    if (updateContractDto.documentLink !== undefined) {
      updateData.documentLink = updateContractDto.documentLink;
    }
    if (updateContractDto.notes !== undefined) {
      updateData.notes = updateContractDto.notes;
    }
    if (updateContractDto.previousContractId !== undefined) {
      updateData.previousContractId = updateContractDto.previousContractId;
    }

    // Convert date strings to Date objects if provided
    if (updateContractDto.startDate) {
      updateData.startDate = new Date(updateContractDto.startDate);
    }
    if (updateContractDto.endDate) {
      updateData.endDate = new Date(updateContractDto.endDate);
    }
    if (updateContractDto.renewalDate) {
      updateData.renewalDate = new Date(updateContractDto.renewalDate);
    }

    // Update the contract
    await this.contractRepository.update(id, updateData);

    this.logger.log(`Contract updated successfully with ID: ${id}`);

    // Return updated contract with relationships
    return this.findOne(id);
  }

  /**
   * Soft delete a contract by updating its status
   * Changes status to TERMINATED for soft deletion
   */
  async remove(id: string, currentUser: any): Promise<Contract> {
    this.logger.log(`Soft deleting contract with ID: ${id}`);

    // Check if contract exists
    const existingContract = await this.findOne(id);

    // Check if contract can be terminated
    const nonTerminableStatuses = [
      ContractStatus.TERMINATED,
      ContractStatus.CANCELLED,
      ContractStatus.EXPIRED,
    ];

    if (nonTerminableStatuses.includes(existingContract.status)) {
      throw new BadRequestException(
        `Cannot terminate contract with status: ${existingContract.status}`,
      );
    }

    // Update status to TERMINATED
    await this.contractRepository.update(id, {
      status: ContractStatus.TERMINATED,
    });

    this.logger.log(`Contract terminated successfully with ID: ${id}`);

    // Return updated contract
    return this.findOne(id);
  }

  /**
   * Get contracts expiring within specified days
   * Utility method for contract expiration tracking
   */
  async getExpiringContracts(days: number = 30): Promise<Contract[]> {
    this.logger.log(`Fetching contracts expiring within ${days} days`);

    const now = new Date();
    const futureDate = new Date(now.getTime() + days * 24 * 60 * 60 * 1000);

    const contracts = await this.contractRepository.find({
      where: {
        endDate: LessThanOrEqual(futureDate),
        status: ContractStatus.ACTIVE,
      },
      relations: ['client'],
      order: {
        endDate: 'ASC',
      },
    });

    this.logger.log(`Found ${contracts.length} contracts expiring within ${days} days`);

    return contracts;
  }

  /**
   * Get contract statistics
   * Provides overview of contract distribution by status
   */
  async getContractStatistics(): Promise<{
    total: number;
    byStatus: Record<string, number>;
    activeContracts: number;
    expiringContracts: number;
  }> {
    this.logger.log('Generating contract statistics');

    const [total, byStatus, expiringContracts] = await Promise.all([
      this.contractRepository.count(),
      this.contractRepository
        .createQueryBuilder('contract')
        .select('contract.status', 'status')
        .addSelect('COUNT(*)', 'count')
        .groupBy('contract.status')
        .getRawMany(),
      this.getExpiringContracts(30),
    ]);

    const statusCounts = byStatus.reduce((acc, item) => {
      acc[item.status] = parseInt(item.count, 10);
      return acc;
    }, {});

    const activeContracts = statusCounts[ContractStatus.ACTIVE] || 0;

    return {
      total,
      byStatus: statusCounts,
      activeContracts,
      expiringContracts: expiringContracts.length,
    };
  }

  /**
   * Upload document for a contract
   * Handles file upload and updates the contract's documentLink
   */
  async uploadDocument(
    id: string,
    file: Express.Multer.File,
    currentUser: any,
  ): Promise<Contract> {
    this.logger.log(`Uploading document for contract ID: ${id}`);

    // Check if contract exists
    const existingContract = await this.findOne(id);

    // Process the uploaded file
    const fileResult = this.filesService.processUploadedFile(file, 'contracts');

    // Delete old file if it exists
    if (existingContract.documentLink) {
      const oldFileInfo = this.filesService.parseDocumentLink(existingContract.documentLink);
      if (oldFileInfo) {
        await this.filesService.deleteFile(`uploads/${oldFileInfo.entityType}/${oldFileInfo.filename}`);
      }
    }

    // Update contract with new document link
    await this.contractRepository.update(id, {
      documentLink: fileResult.url,
    });

    this.logger.log(`Document uploaded successfully for contract ID: ${id}`);

    // Return updated contract
    return this.findOne(id);
  }
} 