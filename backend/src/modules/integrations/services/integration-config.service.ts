import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

export interface IntegrationConfig {
  baseUrl: string;
  apiKey?: string;
  username?: string;
  password?: string;
  bearerToken?: string;
  timeout?: number;
  retryAttempts?: number;
  customHeaders?: Record<string, string>;
}

/**
 * IntegrationConfigService
 * Manages configuration for various external API integrations
 * Provides secure access to API credentials and settings
 */
@Injectable()
export class IntegrationConfigService {
  constructor(private readonly configService: ConfigService) {}

  /**
   * Get configuration for a specific integration
   * @param integrationName - Name of the integration (e.g., 'jira', 'sample')
   * @returns Integration configuration object
   */
  getIntegrationConfig(integrationName: string): IntegrationConfig {
    const prefix = `${integrationName.toUpperCase()}_`;
    
    return {
      baseUrl: this.configService.get<string>(`${prefix}BASE_URL`, ''),
      apiKey: this.configService.get<string>(`${prefix}API_KEY`),
      username: this.configService.get<string>(`${prefix}USERNAME`),
      password: this.configService.get<string>(`${prefix}PASSWORD`),
      bearerToken: this.configService.get<string>(`${prefix}BEARER_TOKEN`),
      timeout: this.configService.get<number>(`${prefix}TIMEOUT`, 30000),
      retryAttempts: this.configService.get<number>(`${prefix}RETRY_ATTEMPTS`, 3),
      customHeaders: this.parseCustomHeaders(prefix),
    };
  }

  /**
   * Parse custom headers from environment variables
   * @param prefix - Environment variable prefix
   * @returns Object containing custom headers
   */
  private parseCustomHeaders(prefix: string): Record<string, string> {
    const headersJson = this.configService.get<string>(`${prefix}CUSTOM_HEADERS`);
    if (!headersJson) {
      return {};
    }

    try {
      return JSON.parse(headersJson);
    } catch (error) {
      console.error(`Failed to parse custom headers for ${prefix}:`, error);
      return {};
    }
  }

  /**
   * Check if an integration is enabled
   * @param integrationName - Name of the integration
   * @returns Boolean indicating if the integration is enabled
   */
  isIntegrationEnabled(integrationName: string): boolean {
    return this.configService.get<boolean>(
      `${integrationName.toUpperCase()}_ENABLED`,
      false,
    );
  }

  /**
   * Get global integration settings
   * @returns Global settings applicable to all integrations
   */
  getGlobalSettings() {
    return {
      defaultTimeout: this.configService.get<number>('INTEGRATION_TIMEOUT', 30000),
      maxRetries: this.configService.get<number>('INTEGRATION_MAX_RETRIES', 3),
      retryDelay: this.configService.get<number>('INTEGRATION_RETRY_DELAY', 1000),
      enableLogging: this.configService.get<boolean>('INTEGRATION_ENABLE_LOGGING', true),
    };
  }
} 