import { Controller, Get } from '@nestjs/common';
import { AppService } from './app.service';
import { ConfigDemoService } from './core/config/config-demo.service';

/**
 * AppController - Main application controller
 *
 * Provides endpoints to demonstrate configuration management
 */
@Controller()
export class AppController {
  constructor(
    private readonly appService: AppService,
    private readonly configDemoService: ConfigDemoService,
  ) {}

  @Get()
  getHello(): string {
    return this.appService.getHello();
  }

  /**
   * Endpoint to demonstrate server configuration access
   */
  @Get('config/server')
  getServerConfig() {
    return this.configDemoService.getServerConfiguration();
  }

  /**
   * Endpoint to demonstrate database configuration access
   */
  @Get('config/database')
  getDatabaseConfig() {
    return this.configDemoService.getDatabaseConfiguration();
  }

  /**
   * Endpoint to demonstrate JWT configuration access
   */
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
  @Get('config/environment')
  getEnvironmentInfo() {
    return {
      logLevel: this.configDemoService.getLogLevel(),
      serverConfig: this.configDemoService.getServerConfiguration(),
    };
  }
}
