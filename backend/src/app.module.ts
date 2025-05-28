import { Module } from '@nestjs/common';
import { CoreModule } from './core/core.module';
import { AuthModule } from './modules/auth/auth.module';
import { ClientsModule } from './modules/clients/clients.module';
import { ServicesModule } from './modules/services/services.module';
import { ContractsModule } from './modules/contracts/contracts.module';
import { FilesModule } from './modules/files/files.module';
import { HardwareModule } from './modules/hardware/hardware.module';
import { FinancialsModule } from './modules/financials/financials.module';
import { TeamAssignmentsModule } from './modules/team-assignments/team-assignments.module';
import { AppController } from './app.controller';
import { AppService } from './app.service';

/**
 * AppModule - Root application module
 *
 * This module:
 * - Imports CoreModule for global configuration
 * - Imports AuthModule for user authentication
 * - Imports ClientsModule for client management
 * - Imports ServicesModule for service catalog management
 * - Imports ContractsModule for contract and service scope management
 * - Imports HardwareModule for hardware inventory and asset tracking
 * - Imports FinancialsModule for financial transaction tracking
 * - Imports TeamAssignmentsModule for client team assignment management
 * - Sets up basic application structure
 * - Can be extended with feature modules
 */
@Module({
  imports: [
    CoreModule, 
    AuthModule, 
    ClientsModule, 
    ServicesModule, 
    ContractsModule,
    FilesModule,
    HardwareModule,
    FinancialsModule,
    TeamAssignmentsModule
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
