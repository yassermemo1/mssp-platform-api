import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { HardwareAssetsService } from './hardware-assets.service';
import { ClientHardwareAssignmentsService } from './client-hardware-assignments.service';
import { HardwareAssetsController } from './hardware-assets.controller';
import {
  ClientHardwareAssignmentsController,
  ClientsHardwareAssignmentsController,
  HardwareAssetsAssignmentsController,
  ServiceScopesHardwareAssignmentsController,
} from './client-hardware-assignments.controller';
import { HardwareAsset } from '../../entities/hardware-asset.entity';
import { ClientHardwareAssignment } from '../../entities/client-hardware-assignment.entity';
import { Client } from '../../entities/client.entity';
import { ServiceScope } from '../../entities/service-scope.entity';

/**
 * HardwareModule
 * Configures the hardware management feature module with:
 * - TypeORM repositories for hardware-related entities
 * - Services for business logic
 * - Controllers for HTTP endpoints (including nested routes)
 * - Exports services for potential use in other modules
 */
@Module({
  imports: [
    // Register entities with TypeORM for this module
    // Include related entities needed for validation and linking
    TypeOrmModule.forFeature([
      HardwareAsset,
      ClientHardwareAssignment,
      Client, // Needed for assignment validation
      ServiceScope, // Needed for service scope linking
    ]),
  ],
  controllers: [
    // Main controllers
    HardwareAssetsController,
    ClientHardwareAssignmentsController,
    // Nested route controllers for convenient access
    ClientsHardwareAssignmentsController,
    HardwareAssetsAssignmentsController,
    ServiceScopesHardwareAssignmentsController,
  ],
  providers: [
    HardwareAssetsService,
    ClientHardwareAssignmentsService,
  ],
  exports: [
    // Export services for potential use in other modules
    HardwareAssetsService,
    ClientHardwareAssignmentsService,
  ],
})
export class HardwareModule {} 