import { Module } from '@nestjs/common';
import { CoreModule } from './core/core.module';
import { AppController } from './app.controller';
import { AppService } from './app.service';

/**
 * AppModule - Root application module
 *
 * This module:
 * - Imports CoreModule for global configuration
 * - Sets up basic application structure
 * - Can be extended with feature modules
 */
@Module({
  imports: [CoreModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
