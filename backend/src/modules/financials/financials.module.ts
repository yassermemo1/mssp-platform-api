import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { FinancialTransaction } from './entities/financial-transaction.entity';
import { Client } from '../../entities/client.entity';
import { Contract } from '../../entities/contract.entity';
import { ServiceScope } from '../../entities/service-scope.entity';
import { HardwareAsset } from '../../entities/hardware-asset.entity';
import { User } from '../../entities/user.entity';
import { FinancialTransactionsService } from './financial-transactions.service';
import { FinancialTransactionsController } from './financial-transactions.controller';

/**
 * Financials Module
 * Handles financial transaction management including costs and revenues
 * Provides comprehensive financial tracking and reporting capabilities
 * Includes all related entities for foreign key validation
 */
@Module({
  imports: [
    TypeOrmModule.forFeature([
      FinancialTransaction,
      Client,
      Contract,
      ServiceScope,
      HardwareAsset,
      User,
    ]),
  ],
  controllers: [
    FinancialTransactionsController,
  ],
  providers: [
    FinancialTransactionsService,
  ],
  exports: [
    TypeOrmModule,
    FinancialTransactionsService,
  ],
})
export class FinancialsModule {} 