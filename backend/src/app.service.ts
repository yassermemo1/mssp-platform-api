import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

/**
 * AppService - Main application service
 *
 * Demonstrates basic service functionality with configuration access
 */
@Injectable()
export class AppService {
  constructor(private readonly configService: ConfigService) {}

  getHello(): string {
    const nodeEnv = this.configService.get<string>('NODE_ENV', 'development');
    const port = this.configService.get<number>('PORT', 3000);

    return `Hello from MSSP Platform API! Running in ${nodeEnv} mode on port ${port}`;
  }
}
