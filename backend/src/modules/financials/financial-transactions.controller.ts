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
  HttpCode,
  HttpStatus,
  ParseUUIDPipe,
  ValidationPipe,
  Logger,
  Request,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '../../enums';
import { AuthenticatedUser } from '../auth/strategies/jwt.strategy';
import { FinancialTransactionsService } from './financial-transactions.service';
import {
  CreateFinancialTransactionDto,
  UpdateFinancialTransactionDto,
  QueryFinancialTransactionsDto,
} from './dto';
import { FinancialTransaction } from './entities/financial-transaction.entity';

/**
 * FinancialTransactionsController
 * Handles HTTP requests for financial transaction management
 * Secured with JWT authentication and role-based access control
 * Financial operations require elevated permissions (ADMIN, MANAGER)
 */
@Controller('financial-transactions')
@UseGuards(JwtAuthGuard, RolesGuard)
export class FinancialTransactionsController {
  private readonly logger = new Logger(FinancialTransactionsController.name);

  constructor(
    private readonly financialTransactionsService: FinancialTransactionsService,
  ) {}

  /**
   * Create a new financial transaction
   * Requires ADMIN or MANAGER role for financial data entry
   */
  @Post()
  @Roles(UserRole.ADMIN, UserRole.MANAGER)
  @HttpCode(HttpStatus.CREATED)
  async create(
    @Body(ValidationPipe) createFinancialTransactionDto: CreateFinancialTransactionDto,
    @Request() req: { user: AuthenticatedUser },
  ): Promise<FinancialTransaction> {
    this.logger.log(`Creating financial transaction by user ${req.user.userId}`);
    return this.financialTransactionsService.create(createFinancialTransactionDto, req.user);
  }

  /**
   * Get all financial transactions with filtering and pagination
   * Requires ADMIN, MANAGER, or ACCOUNT_MANAGER role for financial data access
   */
  @Get()
  @Roles(UserRole.ADMIN, UserRole.MANAGER, UserRole.ACCOUNT_MANAGER)
  async findAll(
    @Query(new ValidationPipe({ transform: true })) queryDto: QueryFinancialTransactionsDto,
  ): Promise<{
    data: FinancialTransaction[];
    count: number;
    page: number;
    limit: number;
    totalPages: number;
  }> {
    this.logger.log('Retrieving financial transactions with filters');
    return this.financialTransactionsService.findAll(queryDto);
  }

  /**
   * Get financial summary statistics
   * Future endpoint for reporting capabilities
   * Requires ADMIN, MANAGER, or ACCOUNT_MANAGER role
   */
  @Get('reports/summary')
  @Roles(UserRole.ADMIN, UserRole.MANAGER, UserRole.ACCOUNT_MANAGER)
  async getFinancialSummary(
    @Query('clientId') clientId?: string,
    @Query('contractId') contractId?: string,
    @Query('dateFrom') dateFrom?: string,
    @Query('dateTo') dateTo?: string,
  ): Promise<{
    totalRevenue: number;
    totalCosts: number;
    netProfit: number;
    transactionCount: number;
  }> {
    this.logger.log('Retrieving financial summary statistics');
    return this.financialTransactionsService.getFinancialSummary({
      clientId,
      contractId,
      dateFrom,
      dateTo,
    });
  }

  /**
   * Get a specific financial transaction by ID
   * Requires ADMIN, MANAGER, or ACCOUNT_MANAGER role
   */
  @Get(':id')
  @Roles(UserRole.ADMIN, UserRole.MANAGER, UserRole.ACCOUNT_MANAGER)
  async findOne(
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<FinancialTransaction> {
    this.logger.log(`Retrieving financial transaction with ID: ${id}`);
    return this.financialTransactionsService.findOne(id);
  }

  /**
   * Update a financial transaction
   * Requires ADMIN or MANAGER role for financial data modification
   */
  @Patch(':id')
  @Roles(UserRole.ADMIN, UserRole.MANAGER)
  async update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body(ValidationPipe) updateFinancialTransactionDto: UpdateFinancialTransactionDto,
    @Request() req: { user: AuthenticatedUser },
  ): Promise<FinancialTransaction> {
    this.logger.log(`Updating financial transaction ${id} by user ${req.user.userId}`);
    return this.financialTransactionsService.update(id, updateFinancialTransactionDto, req.user);
  }

  /**
   * Delete a financial transaction
   * Requires ADMIN role for financial data deletion (highest security)
   */
  @Delete(':id')
  @Roles(UserRole.ADMIN)
  @HttpCode(HttpStatus.NO_CONTENT)
  async remove(
    @Param('id', ParseUUIDPipe) id: string,
    @Request() req: { user: AuthenticatedUser },
  ): Promise<void> {
    this.logger.log(`Deleting financial transaction ${id} by user ${req.user.userId}`);
    return this.financialTransactionsService.remove(id, req.user);
  }
} 