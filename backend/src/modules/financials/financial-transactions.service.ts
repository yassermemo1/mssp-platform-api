import {
  Injectable,
  NotFoundException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, FindManyOptions, Between, In } from 'typeorm';
import { FinancialTransaction } from './entities/financial-transaction.entity';
import { Client } from '../../entities/client.entity';
import { Contract } from '../../entities/contract.entity';
import { ServiceScope } from '../../entities/service-scope.entity';
import { HardwareAsset } from '../../entities/hardware-asset.entity';
import { User } from '../../entities/user.entity';
import {
  CreateFinancialTransactionDto,
  UpdateFinancialTransactionDto,
  QueryFinancialTransactionsDto,
} from './dto';

/**
 * FinancialTransactionsService
 * Handles all business logic for financial transaction management
 * Provides CRUD operations with comprehensive validation and filtering
 */
@Injectable()
export class FinancialTransactionsService {
  private readonly logger = new Logger(FinancialTransactionsService.name);

  constructor(
    @InjectRepository(FinancialTransaction)
    private readonly financialTransactionRepository: Repository<FinancialTransaction>,
    @InjectRepository(Client)
    private readonly clientRepository: Repository<Client>,
    @InjectRepository(Contract)
    private readonly contractRepository: Repository<Contract>,
    @InjectRepository(ServiceScope)
    private readonly serviceScopeRepository: Repository<ServiceScope>,
    @InjectRepository(HardwareAsset)
    private readonly hardwareAssetRepository: Repository<HardwareAsset>,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
  ) {}

  /**
   * Create a new financial transaction
   * Validates all foreign key references before creation
   */
  async create(
    createDto: CreateFinancialTransactionDto,
    currentUser: any,
  ): Promise<FinancialTransaction> {
    this.logger.log(`Creating financial transaction for user ${currentUser.userId}`);

    // Validate foreign key references
    await this.validateForeignKeys(createDto);

    // Create the transaction entity
    const transaction = this.financialTransactionRepository.create({
      ...createDto,
      transactionDate: new Date(createDto.transactionDate),
      dueDate: createDto.dueDate ? new Date(createDto.dueDate) : null,
      recordedByUserId: currentUser.userId,
    });

    try {
      const savedTransaction = await this.financialTransactionRepository.save(transaction);
      this.logger.log(`Financial transaction created with ID: ${savedTransaction.id}`);
      
      // Return with relations if needed
      return this.findOne(savedTransaction.id);
    } catch (error) {
      this.logger.error(`Failed to create financial transaction: ${error.message}`);
      throw new BadRequestException('Failed to create financial transaction');
    }
  }

  /**
   * Find all financial transactions with filtering and pagination
   * Supports comprehensive filtering for financial reporting
   */
  async findAll(
    queryDto: QueryFinancialTransactionsDto,
  ): Promise<{ data: FinancialTransaction[]; count: number; page: number; limit: number; totalPages: number }> {
    this.logger.log('Retrieving financial transactions with filters');

    const {
      type,
      status,
      clientId,
      contractId,
      serviceScopeId,
      hardwareAssetId,
      recordedByUserId,
      transactionDateFrom,
      transactionDateTo,
      page = 1,
      limit = 20,
      includeRelations = false,
    } = queryDto;

    // Build query options
    const queryOptions: FindManyOptions<FinancialTransaction> = {
      where: {},
      order: { transactionDate: 'DESC', createdAt: 'DESC' },
      skip: (page - 1) * limit,
      take: limit,
    };

    // Add relations if requested
    if (includeRelations) {
      queryOptions.relations = [
        'client',
        'contract',
        'serviceScope',
        'hardwareAsset',
        'recordedByUser',
      ];
    }

    // Build where conditions
    const whereConditions: any = {};

    if (type) {
      whereConditions.type = type;
    }

    if (status) {
      whereConditions.status = status;
    }

    if (clientId) {
      whereConditions.clientId = clientId;
    }

    if (contractId) {
      whereConditions.contractId = contractId;
    }

    if (serviceScopeId) {
      whereConditions.serviceScopeId = serviceScopeId;
    }

    if (hardwareAssetId) {
      whereConditions.hardwareAssetId = hardwareAssetId;
    }

    if (recordedByUserId) {
      whereConditions.recordedByUserId = recordedByUserId;
    }

    // Handle date range filtering
    if (transactionDateFrom || transactionDateTo) {
      const fromDate = transactionDateFrom ? new Date(transactionDateFrom) : new Date('1900-01-01');
      const toDate = transactionDateTo ? new Date(transactionDateTo) : new Date('2100-12-31');
      whereConditions.transactionDate = Between(fromDate, toDate);
    }

    queryOptions.where = whereConditions;

    try {
      const [data, count] = await this.financialTransactionRepository.findAndCount(queryOptions);
      const totalPages = Math.ceil(count / limit);

      this.logger.log(`Retrieved ${data.length} financial transactions (page ${page}/${totalPages})`);

      return {
        data,
        count,
        page,
        limit,
        totalPages,
      };
    } catch (error) {
      this.logger.error(`Failed to retrieve financial transactions: ${error.message}`);
      throw new BadRequestException('Failed to retrieve financial transactions');
    }
  }

  /**
   * Find a single financial transaction by ID
   * Includes all related entities for comprehensive view
   */
  async findOne(id: string): Promise<FinancialTransaction> {
    this.logger.log(`Retrieving financial transaction with ID: ${id}`);

    try {
      const transaction = await this.financialTransactionRepository.findOne({
        where: { id },
        relations: [
          'client',
          'contract',
          'serviceScope',
          'hardwareAsset',
          'recordedByUser',
        ],
      });

      if (!transaction) {
        throw new NotFoundException(`Financial transaction with ID ${id} not found`);
      }

      return transaction;
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      this.logger.error(`Failed to retrieve financial transaction: ${error.message}`);
      throw new BadRequestException('Failed to retrieve financial transaction');
    }
  }

  /**
   * Update an existing financial transaction
   * Validates foreign key references if they are being updated
   */
  async update(
    id: string,
    updateDto: UpdateFinancialTransactionDto,
    currentUser: any,
  ): Promise<FinancialTransaction> {
    this.logger.log(`Updating financial transaction ${id} by user ${currentUser.userId}`);

    // Check if transaction exists
    const existingTransaction = await this.financialTransactionRepository.findOne({
      where: { id },
    });

    if (!existingTransaction) {
      throw new NotFoundException(`Financial transaction with ID ${id} not found`);
    }

    // Validate foreign key references if they are being updated
    await this.validateForeignKeys(updateDto);

    // Prepare update data
    const updateData: any = { ...updateDto };
    
    if (updateDto.transactionDate) {
      updateData.transactionDate = new Date(updateDto.transactionDate);
    }
    
    if (updateDto.dueDate) {
      updateData.dueDate = new Date(updateDto.dueDate);
    }

    try {
      await this.financialTransactionRepository.update(id, updateData);
      this.logger.log(`Financial transaction ${id} updated successfully`);
      
      // Return updated transaction with relations
      return this.findOne(id);
    } catch (error) {
      this.logger.error(`Failed to update financial transaction: ${error.message}`);
      throw new BadRequestException('Failed to update financial transaction');
    }
  }

  /**
   * Delete a financial transaction
   * Uses hard delete for simplicity but logs for audit purposes
   */
  async remove(id: string, currentUser: any): Promise<void> {
    this.logger.log(`Deleting financial transaction ${id} by user ${currentUser.userId}`);

    // Check if transaction exists
    const existingTransaction = await this.financialTransactionRepository.findOne({
      where: { id },
    });

    if (!existingTransaction) {
      throw new NotFoundException(`Financial transaction with ID ${id} not found`);
    }

    try {
      await this.financialTransactionRepository.delete(id);
      this.logger.log(`Financial transaction ${id} deleted successfully by user ${currentUser.userId}`);
    } catch (error) {
      this.logger.error(`Failed to delete financial transaction: ${error.message}`);
      throw new BadRequestException('Failed to delete financial transaction');
    }
  }

  /**
   * Validate foreign key references
   * Ensures all provided entity IDs exist in their respective tables
   */
  private async validateForeignKeys(
    dto: CreateFinancialTransactionDto | UpdateFinancialTransactionDto,
  ): Promise<void> {
    const validationPromises: Promise<void>[] = [];

    if (dto.clientId) {
      validationPromises.push(this.validateEntityExists(
        this.clientRepository,
        dto.clientId,
        'Client'
      ));
    }

    if (dto.contractId) {
      validationPromises.push(this.validateEntityExists(
        this.contractRepository,
        dto.contractId,
        'Contract'
      ));
    }

    if (dto.serviceScopeId) {
      validationPromises.push(this.validateEntityExists(
        this.serviceScopeRepository,
        dto.serviceScopeId,
        'ServiceScope'
      ));
    }

    if (dto.hardwareAssetId) {
      validationPromises.push(this.validateEntityExists(
        this.hardwareAssetRepository,
        dto.hardwareAssetId,
        'HardwareAsset'
      ));
    }

    await Promise.all(validationPromises);
  }

  /**
   * Helper method to validate entity existence
   */
  private async validateEntityExists(
    repository: Repository<any>,
    id: string,
    entityName: string,
  ): Promise<void> {
    const exists = await repository.findOne({ where: { id } });
    if (!exists) {
      throw new BadRequestException(`${entityName} with ID ${id} not found`);
    }
  }

  /**
   * Get financial summary statistics
   * Future enhancement for reporting capabilities
   */
  async getFinancialSummary(filters?: {
    clientId?: string;
    contractId?: string;
    dateFrom?: string;
    dateTo?: string;
  }): Promise<{
    totalRevenue: number;
    totalCosts: number;
    netProfit: number;
    transactionCount: number;
  }> {
    // This method can be implemented in future iterations for reporting
    // For now, return basic structure
    return {
      totalRevenue: 0,
      totalCosts: 0,
      netProfit: 0,
      transactionCount: 0,
    };
  }
} 