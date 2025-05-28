import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Service } from '../../entities/service.entity';
import { ServicesService } from './services.service';
import { ServicesController } from './services.controller';

/**
 * ServicesModule
 * Handles service catalog management
 * 
 * This module provides:
 * - Service CRUD operations
 * - Service catalog management
 * - Service category filtering
 * - Active/inactive service management
 */
@Module({
  imports: [TypeOrmModule.forFeature([Service])],
  controllers: [ServicesController],
  providers: [ServicesService],
  exports: [ServicesService], // Export for use in other modules
})
export class ServicesModule {} 