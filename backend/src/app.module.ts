import { Module } from '@nestjs/common';
import { CoreModule } from './core/core.module';
import { AuthModule } from './modules/auth/auth.module';
import { ClientsModule } from './modules/clients/clients.module';
import { AppController } from './app.controller';
import { AppService } from './app.service';

/**
 * AppModule - Root application module
 *
 * This module:
 * - Imports CoreModule for global configuration
 * - Imports AuthModule for user authentication
 * - Imports ClientsModule for client management
 * - Sets up basic application structure
 * - Can be extended with feature modules
 */
@Module({
  imports: [CoreModule, AuthModule, ClientsModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
