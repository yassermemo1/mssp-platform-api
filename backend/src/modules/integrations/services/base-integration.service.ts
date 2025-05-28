import { Injectable, HttpException, HttpStatus, Logger } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { AxiosRequestConfig, AxiosResponse, AxiosError } from 'axios';
import { Observable, throwError, of } from 'rxjs';
import { catchError, map, retry, delay, tap } from 'rxjs/operators';
import { IntegrationConfig } from './integration-config.service';

export interface IntegrationError {
  message: string;
  statusCode: number;
  integration: string;
  originalError?: any;
}

/**
 * BaseIntegrationService
 * Abstract base class for all external API integrations
 * Provides common HTTP functionality, error handling, and retry logic
 */
@Injectable()
export abstract class BaseIntegrationService {
  protected readonly logger: Logger;
  protected config: IntegrationConfig;

  constructor(
    protected readonly httpService: HttpService,
    protected readonly integrationName: string,
  ) {
    this.logger = new Logger(`${integrationName}Integration`);
  }

  /**
   * Set configuration for this integration
   * @param config - Integration configuration
   */
  setConfig(config: IntegrationConfig): void {
    this.config = config;
  }

  /**
   * Build authentication headers based on configuration
   * @returns Headers object with authentication
   */
  protected buildAuthHeaders(): Record<string, string> {
    const headers: Record<string, string> = {};

    if (this.config.apiKey) {
      headers['X-API-Key'] = this.config.apiKey;
    }

    if (this.config.bearerToken) {
      headers['Authorization'] = `Bearer ${this.config.bearerToken}`;
    }

    if (this.config.username && this.config.password) {
      const auth = Buffer.from(`${this.config.username}:${this.config.password}`).toString('base64');
      headers['Authorization'] = `Basic ${auth}`;
    }

    return headers;
  }

  /**
   * Build complete request configuration
   * @param additionalConfig - Additional axios configuration
   * @returns Complete axios request configuration
   */
  protected buildRequestConfig(additionalConfig?: AxiosRequestConfig): AxiosRequestConfig {
    return {
      baseURL: this.config.baseUrl,
      timeout: this.config.timeout || 30000,
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        ...this.buildAuthHeaders(),
        ...(this.config.customHeaders || {}),
        ...(additionalConfig?.headers || {}),
      },
      ...additionalConfig,
    };
  }

  /**
   * Handle HTTP errors and transform them into integration errors
   * @param error - Axios error
   * @returns Observable that emits an integration error
   */
  protected handleError(error: AxiosError): Observable<never> {
    const integrationError: IntegrationError = {
      message: 'Integration request failed',
      statusCode: error.response?.status || 500,
      integration: this.integrationName,
      originalError: error.response?.data || error.message,
    };

    if (error.response) {
      // Server responded with error
      integrationError.message = this.extractErrorMessage(error.response);
      this.logger.error(
        `${this.integrationName} API error: ${integrationError.message}`,
        error.response.data,
      );
    } else if (error.request) {
      // No response received
      integrationError.message = `No response from ${this.integrationName} API`;
      integrationError.statusCode = 0;
      this.logger.error(`${this.integrationName} API timeout or network error`);
    } else {
      // Request setup error
      integrationError.message = error.message;
      this.logger.error(`${this.integrationName} request setup error:`, error.message);
    }

    return throwError(() => new HttpException(integrationError, integrationError.statusCode));
  }

  /**
   * Extract error message from API response
   * @param response - Axios response
   * @returns Error message string
   */
  protected extractErrorMessage(response: AxiosResponse): string {
    const data = response.data;
    
    // Common error message patterns
    if (typeof data === 'string') return data;
    if (data?.message) return data.message;
    if (data?.error) return data.error;
    if (data?.errors && Array.isArray(data.errors)) {
      return data.errors.map((e: any) => e.message || e).join(', ');
    }
    
    return `${this.integrationName} API error: ${response.status} ${response.statusText}`;
  }

  /**
   * Make a GET request
   * @param endpoint - API endpoint
   * @param config - Additional request configuration
   * @returns Observable of response data
   */
  protected get<T>(endpoint: string, config?: AxiosRequestConfig): Observable<T> {
    const url = this.buildFullUrl(endpoint);
    const requestConfig = this.buildRequestConfig(config);

    this.logger.debug(`GET ${url}`);

    return this.httpService.get<T>(url, requestConfig).pipe(
      map(response => response.data),
      retry({
        count: this.config.retryAttempts || 3,
        delay: 1000,
      }),
      catchError(error => this.handleError(error)),
    );
  }

  /**
   * Make a POST request
   * @param endpoint - API endpoint
   * @param data - Request body
   * @param config - Additional request configuration
   * @returns Observable of response data
   */
  protected post<T>(endpoint: string, data?: any, config?: AxiosRequestConfig): Observable<T> {
    const url = this.buildFullUrl(endpoint);
    const requestConfig = this.buildRequestConfig(config);

    this.logger.debug(`POST ${url}`);

    return this.httpService.post<T>(url, data, requestConfig).pipe(
      map(response => response.data),
      catchError(error => this.handleError(error)),
    );
  }

  /**
   * Make a PUT request
   * @param endpoint - API endpoint
   * @param data - Request body
   * @param config - Additional request configuration
   * @returns Observable of response data
   */
  protected put<T>(endpoint: string, data?: any, config?: AxiosRequestConfig): Observable<T> {
    const url = this.buildFullUrl(endpoint);
    const requestConfig = this.buildRequestConfig(config);

    this.logger.debug(`PUT ${url}`);

    return this.httpService.put<T>(url, data, requestConfig).pipe(
      map(response => response.data),
      catchError(error => this.handleError(error)),
    );
  }

  /**
   * Make a DELETE request
   * @param endpoint - API endpoint
   * @param config - Additional request configuration
   * @returns Observable of response data
   */
  protected delete<T>(endpoint: string, config?: AxiosRequestConfig): Observable<T> {
    const url = this.buildFullUrl(endpoint);
    const requestConfig = this.buildRequestConfig(config);

    this.logger.debug(`DELETE ${url}`);

    return this.httpService.delete<T>(url, requestConfig).pipe(
      map(response => response.data),
      catchError(error => this.handleError(error)),
    );
  }

  /**
   * Build full URL for the request
   * @param endpoint - API endpoint
   * @returns Full URL
   */
  private buildFullUrl(endpoint: string): string {
    // If endpoint starts with http, it's already a full URL
    if (endpoint.startsWith('http')) {
      return endpoint;
    }
    
    // Remove leading slash to avoid double slashes
    const cleanEndpoint = endpoint.startsWith('/') ? endpoint.slice(1) : endpoint;
    return cleanEndpoint; // baseURL is handled in axios config
  }
} 