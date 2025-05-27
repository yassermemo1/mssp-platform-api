import { Controller, Get } from '@nestjs/common';
import { AppService } from './app.service';
import { ConfigDemoService } from './core/config/config-demo.service';
import { Public } from './modules/auth/decorators/public.decorator';

/**
 * AppController - Main application controller
 *
 * Provides endpoints to demonstrate configuration management
 * All endpoints are marked as public since they're for health checks and configuration info
 */
@Controller()
export class AppController {
  constructor(
    private readonly appService: AppService,
    private readonly configDemoService: ConfigDemoService,
  ) {}

  @Public()
  @Get()
  getHello(): string {
    return this.appService.getHello();
  }

  /**
   * Endpoint to demonstrate server configuration access
   */
  @Public()
  @Get('config/server')
  getServerConfig() {
    return this.configDemoService.getServerConfiguration();
  }

  /**
   * Endpoint to demonstrate database configuration access
   */
  @Public()
  @Get('config/database')
  getDatabaseConfig() {
    return this.configDemoService.getDatabaseConfiguration();
  }

  /**
   * Endpoint to demonstrate JWT configuration access
   */
  @Public()
  @Get('config/jwt')
  getJwtConfig() {
    const jwtConfig = this.configDemoService.getJwtConfiguration();
    // Don't expose the actual secret in the response
    return {
      expiresIn: jwtConfig.expiresIn,
      secretLength: jwtConfig.secret?.length || 0,
      hasSecret: !!jwtConfig.secret,
    };
  }

  /**
   * Endpoint to demonstrate environment-based logic
   */
  @Public()
  @Get('config/environment')
  getEnvironmentInfo() {
    return {
      logLevel: this.configDemoService.getLogLevel(),
      serverConfig: this.configDemoService.getServerConfiguration(),
    };
  }
}
