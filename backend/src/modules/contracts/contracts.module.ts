import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Contract } from '../../entities/contract.entity';
import { ServiceScope } from '../../entities/service-scope.entity';
import { Proposal } from '../../entities/proposal.entity';
import { Client } from '../../entities/client.entity';
import { Service } from '../../entities/service.entity';
import { User } from '../../entities/user.entity';
import { ContractsService } from './contracts.service';
import { ContractsController } from './contracts.controller';
import { ServiceScopesService } from './service-scopes.service';
import { ServiceScopesController } from './service-scopes.controller';
import { ProposalsService } from './proposals.service';
import { ProposalsController } from './proposals.controller';
import { ServicesModule } from '../services/services.module';
import { FilesModule } from '../files/files.module';

/**
 * ContractsModule
 * Comprehensive contract management including service scopes and proposals
 * 
 * This module provides:
 * - Contract CRUD operations and lifecycle management
 * - Service scope management with SAF tracking
 * - Proposal management (technical/financial) with assignee tracking
 * - Contract-client relationships
 * - Contract expiration and renewal tracking
 * - Service scope configuration and pricing
 * - Proposal workflow and approval processes
 * - Enhanced proposal filtering and analytics
 */
@Module({
  imports: [
    TypeOrmModule.forFeature([Contract, ServiceScope, Proposal, Client, Service, User]),
    ServicesModule, // Import to access services for scope creation
    FilesModule, // Import for file upload functionality
  ],
  controllers: [
    ContractsController, 
    ServiceScopesController, 
    ProposalsController
  ],
  providers: [
    ContractsService, 
    ServiceScopesService, 
    ProposalsService
  ],
  exports: [
    ContractsService, 
    ServiceScopesService, 
    ProposalsService
  ], // Export for use in other modules
})
export class ContractsModule {} 