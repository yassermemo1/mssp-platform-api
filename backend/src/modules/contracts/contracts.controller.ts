import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  UseGuards,
  Request,
  HttpStatus,
  HttpCode,
  ParseUUIDPipe,
  ValidationPipe,
  Logger,
  UseInterceptors,
  UploadedFile,
  HttpException,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ContractsService } from './contracts.service';
import { CreateContractDto, UpdateContractDto, ContractQueryDto } from './dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '../../enums/user-role.enum';
import { Contract } from '../../entities/contract.entity';

/**
 * ContractsController
 * RESTful API endpoints for comprehensive contract management
 * 
 * This controller provides:
 * - POST /contracts - Create new contract (Admin, Manager, Account Manager)
 * - GET /contracts - List contracts with filtering and pagination (All authenticated users)
 * - GET /contracts/:id - Get contract details (All authenticated users)
 * - PATCH /contracts/:id - Update contract (Admin, Manager, Account Manager)
 * - DELETE /contracts/:id - Soft delete contract (Admin, Manager, Account Manager)
 * - GET /contracts/statistics - Get contract statistics (Admin, Manager)
 * 
 * All endpoints are protected by JWT authentication and role-based access control
 */
@Controller('contracts')
@UseGuards(JwtAuthGuard, RolesGuard)
export class ContractsController {
  private readonly logger = new Logger(ContractsController.name);

  constructor(private readonly contractsService: ContractsService) {}

  /**
   * Create a new contract
   * POST /contracts
   * 
   * Requires: Admin, Manager, or Account Manager role
   * Body: CreateContractDto with contract details
   * Returns: Created contract with 201 status
   */
  @Post()
  @HttpCode(HttpStatus.CREATED)
  @Roles(UserRole.ADMIN, UserRole.MANAGER, UserRole.ACCOUNT_MANAGER)
  async create(
    @Body(ValidationPipe) createContractDto: CreateContractDto,
    @Request() req: any,
  ): Promise<{
    statusCode: number;
    message: string;
    data: Contract;
  }> {
    this.logger.log(`Creating contract: ${createContractDto.contractName}`);
    
    const contract = await this.contractsService.create(createContractDto, req.user);
    
    return {
      statusCode: HttpStatus.CREATED,
      message: 'Contract created successfully',
      data: contract,
    };
  }

  /**
   * Get all contracts with filtering and pagination
   * GET /contracts
   * 
   * Requires: Any authenticated user
   * Query params: clientId, status, expiringSoonDays, search, page, limit
   * Returns: Paginated list of contracts
   */
  @Get()
  @Roles(
    UserRole.ADMIN,
    UserRole.MANAGER,
    UserRole.PROJECT_MANAGER,
    UserRole.ACCOUNT_MANAGER,
    UserRole.ENGINEER,
  )
  async findAll(
    @Query(ValidationPipe) queryDto: ContractQueryDto,
  ): Promise<{
    statusCode: number;
    message: string;
    data: Contract[];
    meta: {
      count: number;
      page: number;
      limit: number;
      totalPages: number;
    };
  }> {
    this.logger.log('Fetching contracts with filters', queryDto);
    
    const result = await this.contractsService.findAll(queryDto);
    
    return {
      statusCode: HttpStatus.OK,
      message: 'Contracts retrieved successfully',
      data: result.data,
      meta: {
        count: result.count,
        page: result.page,
        limit: result.limit,
        totalPages: result.totalPages,
      },
    };
  }

  /**
   * Get contract statistics
   * GET /contracts/statistics
   * 
   * Requires: Admin or Manager role
   * Returns: Contract statistics including counts by status and expiring contracts
   */
  @Get('statistics')
  @Roles(UserRole.ADMIN, UserRole.MANAGER)
  async getStatistics(): Promise<{
    statusCode: number;
    message: string;
    data: {
      total: number;
      byStatus: Record<string, number>;
      activeContracts: number;
      expiringContracts: number;
    };
  }> {
    this.logger.log('Fetching contract statistics');
    
    const statistics = await this.contractsService.getContractStatistics();
    
    return {
      statusCode: HttpStatus.OK,
      message: 'Contract statistics retrieved successfully',
      data: statistics,
    };
  }

  /**
   * Get contracts expiring soon
   * GET /contracts/expiring
   * 
   * Requires: Admin, Manager, or Account Manager role
   * Query param: days (optional, defaults to 30)
   * Returns: List of contracts expiring within specified days
   */
  @Get('expiring')
  @Roles(UserRole.ADMIN, UserRole.MANAGER, UserRole.ACCOUNT_MANAGER)
  async getExpiringContracts(
    @Query('days') days?: string,
  ): Promise<{
    statusCode: number;
    message: string;
    data: Contract[];
  }> {
    const daysNumber = days ? parseInt(days, 10) : 30;
    this.logger.log(`Fetching contracts expiring within ${daysNumber} days`);
    
    const contracts = await this.contractsService.getExpiringContracts(daysNumber);
    
    return {
      statusCode: HttpStatus.OK,
      message: `Contracts expiring within ${daysNumber} days retrieved successfully`,
      data: contracts,
    };
  }

  /**
   * Get a single contract by ID
   * GET /contracts/:id
   * 
   * Requires: Any authenticated user
   * Param: id (UUID) - Contract ID
   * Returns: Contract details with relationships
   */
  @Get(':id')
  @Roles(
    UserRole.ADMIN,
    UserRole.MANAGER,
    UserRole.PROJECT_MANAGER,
    UserRole.ACCOUNT_MANAGER,
    UserRole.ENGINEER,
  )
  async findOne(
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<{
    statusCode: number;
    message: string;
    data: Contract;
  }> {
    this.logger.log(`Fetching contract with ID: ${id}`);
    
    const contract = await this.contractsService.findOne(id);
    
    return {
      statusCode: HttpStatus.OK,
      message: 'Contract retrieved successfully',
      data: contract,
    };
  }

  /**
   * Update an existing contract
   * PATCH /contracts/:id
   * 
   * Requires: Admin, Manager, or Account Manager role
   * Param: id (UUID) - Contract ID
   * Body: UpdateContractDto with fields to update
   * Returns: Updated contract
   */
  @Patch(':id')
  @Roles(UserRole.ADMIN, UserRole.MANAGER, UserRole.ACCOUNT_MANAGER)
  async update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body(ValidationPipe) updateContractDto: UpdateContractDto,
    @Request() req: any,
  ): Promise<{
    statusCode: number;
    message: string;
    data: Contract;
  }> {
    this.logger.log(`Updating contract with ID: ${id}`);
    
    const contract = await this.contractsService.update(id, updateContractDto, req.user);
    
    return {
      statusCode: HttpStatus.OK,
      message: 'Contract updated successfully',
      data: contract,
    };
  }

  /**
   * Soft delete a contract (terminate)
   * DELETE /contracts/:id
   * 
   * Requires: Admin, Manager, or Account Manager role
   * Param: id (UUID) - Contract ID
   * Returns: Terminated contract
   */
  @Delete(':id')
  @Roles(UserRole.ADMIN, UserRole.MANAGER, UserRole.ACCOUNT_MANAGER)
  async remove(
    @Param('id', ParseUUIDPipe) id: string,
    @Request() req: any,
  ): Promise<{
    statusCode: number;
    message: string;
    data: Contract;
  }> {
    this.logger.log(`Terminating contract with ID: ${id}`);
    
    const contract = await this.contractsService.remove(id, req.user);
    
    return {
      statusCode: HttpStatus.OK,
      message: 'Contract terminated successfully',
      data: contract,
    };
  }

  /**
   * Upload contract document
   * POST /contracts/:id/upload-document
   * 
   * Requires: Admin, Manager, or Account Manager role
   * Param: id (UUID) - Contract ID
   * Body: multipart/form-data with 'file' field
   * Returns: Updated contract with new document link
   */
  @Post(':id/upload-document')
  @Roles(UserRole.ADMIN, UserRole.MANAGER, UserRole.ACCOUNT_MANAGER)
  @UseInterceptors(FileInterceptor('file'))
  async uploadDocument(
    @Param('id', ParseUUIDPipe) id: string,
    @UploadedFile() file: Express.Multer.File,
    @Request() req: any,
  ): Promise<{
    statusCode: number;
    message: string;
    data: Contract;
  }> {
    if (!file) {
      throw new HttpException('No file uploaded', HttpStatus.BAD_REQUEST);
    }

    this.logger.log(`Uploading document for contract ID: ${id}`);
    
    const contract = await this.contractsService.uploadDocument(id, file, req.user);
    
    return {
      statusCode: HttpStatus.OK,
      message: 'Contract document uploaded successfully',
      data: contract,
    };
  }
} 