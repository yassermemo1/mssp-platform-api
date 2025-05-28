import { Injectable, NotFoundException, BadRequestException, Logger, Inject } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { HttpService } from '@nestjs/axios';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Cache } from 'cache-manager';
import { firstValueFrom } from 'rxjs';
import { AxiosRequestConfig } from 'axios';
import * as jsonpath from 'jsonpath-plus';
import { ExternalDataSource } from '../entities/external-data-source.entity';
import { DataSourceQuery } from '../entities/data-source-query.entity';
import { EncryptionService } from './encryption.service';
import { ExternalApiAuthenticationType, HttpMethod, ExpectedResponseType } from '../../../enums';

/**
 * DynamicDataFetcherService
 * Core service for executing configured queries against external data sources
 * Handles authentication, placeholder replacement, HTTP execution, and data extraction
 */
@Injectable()
export class DynamicDataFetcherService {
  private readonly logger = new Logger(DynamicDataFetcherService.name);

  constructor(
    @InjectRepository(ExternalDataSource)
    private dataSourceRepository: Repository<ExternalDataSource>,
    @InjectRepository(DataSourceQuery)
    private queryRepository: Repository<DataSourceQuery>,
    private httpService: HttpService,
    private encryptionService: EncryptionService,
    @Inject(CACHE_MANAGER) private cacheManager: Cache
  ) {}

  /**
   * Main method to fetch data from external sources
   * @param queryName The name of the configured query to execute
   * @param contextVariables Variables to replace placeholders in the query
   * @returns The extracted data from the external API response
   */
  async fetchData(queryName: string, contextVariables?: Record<string, any>): Promise<any> {
    try {
      // 1. Retrieve query configuration
      const query = await this.queryRepository.findOne({
        where: { queryName, isActive: true },
        relations: ['dataSource']
      });

      if (!query) {
        throw new NotFoundException(`Query "${queryName}" not found or inactive`);
      }

      if (!query.dataSource || !query.dataSource.isActive) {
        throw new BadRequestException(`Data source for query "${queryName}" is not available`);
      }

      // 2. Check cache first
      const cacheKey = this.generateCacheKey(queryName, contextVariables);
      if (query.cacheTTLSeconds && query.cacheTTLSeconds > 0) {
        const cachedData = await this.cacheManager.get(cacheKey);
        if (cachedData !== null && cachedData !== undefined) {
          this.logger.debug(`Cache hit for query: ${queryName}`);
          return cachedData;
        }
      }

      // 3. Build the request
      const requestConfig = await this.buildRequestConfig(query, query.dataSource, contextVariables);

      // 4. Execute the HTTP request
      const response = await firstValueFrom(this.httpService.request(requestConfig));

      // 5. Extract data from response
      const extractedData = this.extractDataFromResponse(
        response.data,
        query.responseExtractionPath,
        query.expectedResponseType
      );

      // 6. Cache the result if configured
      if (query.cacheTTLSeconds && query.cacheTTLSeconds > 0) {
        await this.cacheManager.set(cacheKey, extractedData, query.cacheTTLSeconds * 1000);
      }

      return extractedData;

    } catch (error) {
      this.logger.error(`Error fetching data for query "${queryName}": ${error.message}`, error.stack);
      
      if (error instanceof NotFoundException || error instanceof BadRequestException) {
        throw error;
      }

      throw new BadRequestException(`Failed to fetch data: ${error.message}`);
    }
  }

  /**
   * Build the HTTP request configuration
   */
  private async buildRequestConfig(
    query: DataSourceQuery,
    dataSource: ExternalDataSource,
    contextVariables?: Record<string, any>
  ): Promise<AxiosRequestConfig> {
    // Replace placeholders in endpoint path
    const url = this.buildUrl(dataSource.baseUrl, query.endpointPath, contextVariables);

    // Build base configuration
    const config: AxiosRequestConfig = {
      method: query.httpMethod.toLowerCase() as any,
      url,
      headers: {
        ...dataSource.defaultHeaders,
        'Accept': 'application/json',
        'Content-Type': 'application/json'
      },
      timeout: 30000 // 30 seconds
    };

    // Apply authentication
    await this.applyAuthentication(config, dataSource);

    // Handle query parameters or body
    if (query.httpMethod === HttpMethod.GET && query.queryTemplate) {
      const queryParams = this.replacePlaceholders(query.queryTemplate, contextVariables);
      config.params = this.parseQueryString(queryParams);
    } else if (query.httpMethod === HttpMethod.POST && query.queryTemplate) {
      const bodyTemplate = this.replacePlaceholders(query.queryTemplate, contextVariables);
      config.data = JSON.parse(bodyTemplate);
    }

    return config;
  }

  /**
   * Apply authentication to the request configuration
   */
  private async applyAuthentication(
    config: AxiosRequestConfig,
    dataSource: ExternalDataSource
  ): Promise<void> {
    if (dataSource.authenticationType === ExternalApiAuthenticationType.NONE) {
      return;
    }

    if (!dataSource.credentialsEncrypted) {
      throw new BadRequestException('Authentication required but no credentials configured');
    }

    // Decrypt credentials
    const credentials = this.encryptionService.decryptObject(dataSource.credentialsEncrypted);

    switch (dataSource.authenticationType) {
      case ExternalApiAuthenticationType.BASIC_AUTH_USERNAME_PASSWORD:
        const { username, password } = credentials;
        const authString = Buffer.from(`${username}:${password}`).toString('base64');
        config.headers['Authorization'] = `Basic ${authString}`;
        break;

      case ExternalApiAuthenticationType.BEARER_TOKEN_STATIC:
        const { token } = credentials;
        config.headers['Authorization'] = `Bearer ${token}`;
        break;

      case ExternalApiAuthenticationType.API_KEY_IN_HEADER:
        const { headerName, keyValue } = credentials;
        config.headers[headerName] = keyValue;
        break;

      case ExternalApiAuthenticationType.API_KEY_IN_QUERY_PARAM:
        const { paramName, keyValue: apiKey } = credentials;
        if (!config.params) {
          config.params = {};
        }
        config.params[paramName] = apiKey;
        break;

      default:
        throw new BadRequestException(`Unsupported authentication type: ${dataSource.authenticationType}`);
    }
  }

  /**
   * Build the full URL with placeholder replacement
   */
  private buildUrl(baseUrl: string, endpointPath: string, contextVariables?: Record<string, any>): string {
    const processedPath = this.replacePlaceholders(endpointPath, contextVariables);
    
    // Ensure proper URL concatenation
    const base = baseUrl.endsWith('/') ? baseUrl.slice(0, -1) : baseUrl;
    const path = processedPath.startsWith('/') ? processedPath : `/${processedPath}`;
    
    return `${base}${path}`;
  }

  /**
   * Replace placeholders like {variable} with actual values
   */
  private replacePlaceholders(template: string, contextVariables?: Record<string, any>): string {
    if (!contextVariables) {
      return template;
    }

    return template.replace(/{(\w+)}/g, (match, key) => {
      if (key in contextVariables) {
        return String(contextVariables[key]);
      }
      throw new BadRequestException(`Missing required context variable: ${key}`);
    });
  }

  /**
   * Parse query string into object
   */
  private parseQueryString(queryString: string): Record<string, any> {
    const params: Record<string, any> = {};
    const pairs = queryString.split('&');
    
    for (const pair of pairs) {
      const [key, value] = pair.split('=');
      if (key) {
        params[decodeURIComponent(key)] = value ? decodeURIComponent(value) : '';
      }
    }
    
    return params;
  }

  /**
   * Extract data from response using JSONPath
   */
  private extractDataFromResponse(
    responseData: any,
    extractionPath: string,
    expectedType: ExpectedResponseType
  ): any {
    try {
      // Use JSONPath to extract data
      const results = jsonpath.JSONPath({
        path: extractionPath,
        json: responseData
      });

      if (!results || results.length === 0) {
        throw new Error(`No data found at path: ${extractionPath}`);
      }

      // Get the extracted value (first result for single values)
      let extractedValue = results.length === 1 ? results[0] : results;

      // Perform type validation/coercion
      return this.coerceToExpectedType(extractedValue, expectedType);

    } catch (error) {
      throw new BadRequestException(`Failed to extract data: ${error.message}`);
    }
  }

  /**
   * Coerce extracted value to expected type
   */
  private coerceToExpectedType(value: any, expectedType: ExpectedResponseType): any {
    switch (expectedType) {
      case ExpectedResponseType.NUMBER:
        const num = Number(value);
        if (isNaN(num)) {
          throw new Error(`Cannot convert "${value}" to number`);
        }
        return num;

      case ExpectedResponseType.STRING:
        return String(value);

      case ExpectedResponseType.BOOLEAN:
        if (typeof value === 'boolean') return value;
        if (value === 'true' || value === '1') return true;
        if (value === 'false' || value === '0') return false;
        throw new Error(`Cannot convert "${value}" to boolean`);

      case ExpectedResponseType.JSON_OBJECT:
        if (typeof value !== 'object' || value === null || Array.isArray(value)) {
          throw new Error(`Expected JSON object but got ${typeof value}`);
        }
        return value;

      case ExpectedResponseType.JSON_ARRAY:
        if (!Array.isArray(value)) {
          throw new Error(`Expected JSON array but got ${typeof value}`);
        }
        return value;

      default:
        return value;
    }
  }

  /**
   * Generate cache key from query name and context variables
   */
  private generateCacheKey(queryName: string, contextVariables?: Record<string, any>): string {
    const baseKey = `external_data:${queryName}`;
    if (!contextVariables || Object.keys(contextVariables).length === 0) {
      return baseKey;
    }
    
    // Sort keys for consistent cache keys
    const sortedKeys = Object.keys(contextVariables).sort();
    const contextString = sortedKeys.map(key => `${key}:${contextVariables[key]}`).join(':');
    
    return `${baseKey}:${contextString}`;
  }
} 