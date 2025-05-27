import axios, { AxiosInstance, AxiosRequestConfig, AxiosResponse } from 'axios';
import { LoginCredentials, LoginResponse, ApiError } from '../types/auth';

/**
 * API Service for making HTTP requests to the backend
 * Handles authentication headers and common error responses
 */
class ApiService {
  private api: AxiosInstance;
  private readonly baseURL: string;

  constructor() {
    // Configure base URL - adjust if your backend has a different URL or global prefix
    this.baseURL = process.env.REACT_APP_API_URL || 'http://localhost:3001';
    
    this.api = axios.create({
      baseURL: this.baseURL,
      headers: {
        'Content-Type': 'application/json',
      },
      timeout: 10000, // 10 second timeout
    });

    // Request interceptor to add auth token
    this.api.interceptors.request.use(
      (config) => {
        const token = this.getStoredToken();
        if (token && config.headers) {
          config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
      },
      (error) => {
        return Promise.reject(error);
      }
    );

    // Response interceptor for common error handling
    this.api.interceptors.response.use(
      (response) => response,
      (error) => {
        if (error.response?.status === 401) {
          // Token expired or invalid - clear stored token
          this.clearStoredToken();
          // Optionally redirect to login page
          window.location.href = '/login';
        }
        return Promise.reject(this.formatError(error));
      }
    );
  }

  /**
   * Get stored JWT token from localStorage
   */
  private getStoredToken(): string | null {
    return localStorage.getItem('auth_token');
  }

  /**
   * Clear stored JWT token
   */
  private clearStoredToken(): void {
    localStorage.removeItem('auth_token');
  }

  /**
   * Format error response for consistent error handling
   */
  private formatError(error: any): ApiError {
    if (error.response) {
      // Server responded with error status
      return {
        message: error.response.data?.message || 'An error occurred',
        statusCode: error.response.status,
        error: error.response.data?.error,
      };
    } else if (error.request) {
      // Network error
      return {
        message: 'Network error - please check your connection',
        statusCode: 0,
      };
    } else {
      // Other error
      return {
        message: error.message || 'An unexpected error occurred',
        statusCode: 0,
      };
    }
  }

  /**
   * Authentication endpoints
   */
  async login(credentials: LoginCredentials): Promise<LoginResponse> {
    const response: AxiosResponse<LoginResponse> = await this.api.post('/auth/login', credentials);
    return response.data;
  }

  /**
   * Generic HTTP methods for authenticated requests
   */
  async get<T>(url: string, config?: AxiosRequestConfig): Promise<T> {
    const response: AxiosResponse<T> = await this.api.get(url, config);
    return response.data;
  }

  async post<T>(url: string, data?: any, config?: AxiosRequestConfig): Promise<T> {
    const response: AxiosResponse<T> = await this.api.post(url, data, config);
    return response.data;
  }

  async patch<T>(url: string, data?: any, config?: AxiosRequestConfig): Promise<T> {
    const response: AxiosResponse<T> = await this.api.patch(url, data, config);
    return response.data;
  }

  async delete<T>(url: string, config?: AxiosRequestConfig): Promise<T> {
    const response: AxiosResponse<T> = await this.api.delete(url, config);
    return response.data;
  }

  /**
   * Check if user is authenticated by verifying token exists
   */
  isAuthenticated(): boolean {
    return !!this.getStoredToken();
  }

  /**
   * Get the current base URL
   */
  getBaseURL(): string {
    return this.baseURL;
  }
}

// Export singleton instance
export const apiService = new ApiService();
export default apiService; 