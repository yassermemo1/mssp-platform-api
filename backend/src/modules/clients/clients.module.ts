import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ClientsService } from './clients.service';
import { ClientsController } from './clients.controller';
import { Client } from '../../entities/client.entity';
import { Contract } from '../../entities/contract.entity';
import { ServiceScope } from '../../entities/service-scope.entity';

/**
 * ClientsModule
 * Configures the clients feature module with:
 * - TypeORM repository for Client entity
 * - ClientsService for business logic
 * - ClientsController for HTTP endpoints
 */
@Module({
  imports: [
    // Register the Client, Contract, and ServiceScope entities with TypeORM for this module
    TypeOrmModule.forFeature([Client, Contract, ServiceScope]),
  ],
  controllers: [ClientsController],
  providers: [ClientsService],
  exports: [ClientsService], // Export service for potential use in other modules
})
export class ClientsModule {} 