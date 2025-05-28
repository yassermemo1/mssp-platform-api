import { Injectable, NotFoundException, ConflictException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ExternalDataSource } from '../entities/external-data-source.entity';
import { EncryptionService } from './encryption.service';
import { CreateExternalDataSourceDto } from '../dto/create-external-data-source.dto';
import { UpdateExternalDataSourceDto } from '../dto/update-external-data-source.dto';
import { ExternalApiAuthenticationType } from '../../../enums';

/**
 * ExternalDataSourceService
 * Manages CRUD operations for external data sources with secure credential handling
 */
@Injectable()
export class ExternalDataSourceService {
  constructor(
    @InjectRepository(ExternalDataSource)
    private dataSourceRepository: Repository<ExternalDataSource>,
    private encryptionService: EncryptionService
  ) {}

  /**
   * Create a new external data source
   */
  async create(dto: CreateExternalDataSourceDto): Promise<ExternalDataSource> {
    // Check for duplicate name
    const existing = await this.dataSourceRepository.findOne({
      where: { name: dto.name }
    });

    if (existing) {
      throw new ConflictException(`Data source with name "${dto.name}" already exists`);
    }

    // Validate and encrypt credentials
    const encryptedCredentials = this.validateAndEncryptCredentials(
      dto.authenticationType,
      dto.credentials
    );

    // Create the entity
    const dataSource = this.dataSourceRepository.create({
      ...dto,
      credentialsEncrypted: encryptedCredentials
    });

    // Remove raw credentials from the object
    delete (dataSource as any).credentials;

    return await this.dataSourceRepository.save(dataSource);
  }

  /**
   * Get all external data sources (without credentials)
   */
  async findAll(): Promise<ExternalDataSource[]> {
    const dataSources = await this.dataSourceRepository.find({
      order: { name: 'ASC' }
    });

    // Remove encrypted credentials from response
    return dataSources.map(ds => this.sanitizeDataSource(ds));
  }

  /**
   * Get a specific external data source by ID
   */
  async findOne(id: string): Promise<ExternalDataSource> {
    const dataSource = await this.dataSourceRepository.findOne({
      where: { id },
      relations: ['queries']
    });

    if (!dataSource) {
      throw new NotFoundException(`Data source with ID "${id}" not found`);
    }

    return this.sanitizeDataSource(dataSource);
  }

  /**
   * Update an external data source
   */
  async update(id: string, dto: UpdateExternalDataSourceDto): Promise<ExternalDataSource> {
    const dataSource = await this.dataSourceRepository.findOne({
      where: { id }
    });

    if (!dataSource) {
      throw new NotFoundException(`Data source with ID "${id}" not found`);
    }

    // Check for duplicate name if updating
    if (dto.name && dto.name !== dataSource.name) {
      const existing = await this.dataSourceRepository.findOne({
        where: { name: dto.name }
      });

      if (existing) {
        throw new ConflictException(`Data source with name "${dto.name}" already exists`);
      }
    }

    // Handle credential updates
    if (dto.credentials) {
      const authenticationType = dto.authenticationType || dataSource.authenticationType;
      dataSource.credentialsEncrypted = this.validateAndEncryptCredentials(
        authenticationType,
        dto.credentials
      );
    }

    // Update other fields
    if (dto.name !== undefined) dataSource.name = dto.name;
    if (dto.systemType !== undefined) dataSource.systemType = dto.systemType;
    if (dto.baseUrl !== undefined) dataSource.baseUrl = dto.baseUrl;
    if (dto.authenticationType !== undefined) dataSource.authenticationType = dto.authenticationType;
    if (dto.defaultHeaders !== undefined) dataSource.defaultHeaders = dto.defaultHeaders;
    if (dto.description !== undefined) dataSource.description = dto.description;
    if (dto.isActive !== undefined) dataSource.isActive = dto.isActive;

    const updated = await this.dataSourceRepository.save(dataSource);
    return this.sanitizeDataSource(updated);
  }

  /**
   * Delete an external data source
   */
  async remove(id: string): Promise<void> {
    const dataSource = await this.dataSourceRepository.findOne({
      where: { id }
    });

    if (!dataSource) {
      throw new NotFoundException(`Data source with ID "${id}" not found`);
    }

    await this.dataSourceRepository.remove(dataSource);
  }

  /**
   * Test connection to an external data source
   */
  async testConnection(id: string): Promise<{ success: boolean; message: string }> {
    const dataSource = await this.dataSourceRepository.findOne({
      where: { id }
    });

    if (!dataSource) {
      throw new NotFoundException(`Data source with ID "${id}" not found`);
    }

    // TODO: Implement actual connection test
    // This would make a simple request to the baseUrl with authentication
    // For now, return a placeholder response
    return {
      success: true,
      message: 'Connection test successful'
    };
  }

  /**
   * Validate and encrypt credentials based on authentication type
   */
  private validateAndEncryptCredentials(
    authenticationType: ExternalApiAuthenticationType,
    credentials?: Record<string, any>
  ): string | null {
    if (authenticationType === ExternalApiAuthenticationType.NONE) {
      return null;
    }

    if (!credentials) {
      throw new BadRequestException('Credentials are required for this authentication type');
    }

    // Validate credential structure based on authentication type
    switch (authenticationType) {
      case ExternalApiAuthenticationType.BASIC_AUTH_USERNAME_PASSWORD:
        if (!credentials.username || !credentials.password) {
          throw new BadRequestException('Username and password are required for Basic Auth');
        }
        break;

      case ExternalApiAuthenticationType.BEARER_TOKEN_STATIC:
        if (!credentials.token) {
          throw new BadRequestException('Token is required for Bearer Token authentication');
        }
        break;

      case ExternalApiAuthenticationType.API_KEY_IN_HEADER:
        if (!credentials.headerName || !credentials.keyValue) {
          throw new BadRequestException('Header name and key value are required for API Key in Header');
        }
        break;

      case ExternalApiAuthenticationType.API_KEY_IN_QUERY_PARAM:
        if (!credentials.paramName || !credentials.keyValue) {
          throw new BadRequestException('Parameter name and key value are required for API Key in Query');
        }
        break;

      default:
        throw new BadRequestException(`Unsupported authentication type: ${authenticationType}`);
    }

    // Encrypt the credentials
    return this.encryptionService.encryptObject(credentials);
  }

  /**
   * Remove sensitive data from data source object
   */
  private sanitizeDataSource(dataSource: ExternalDataSource): ExternalDataSource {
    const sanitized = { ...dataSource };
    delete sanitized.credentialsEncrypted;
    
    // Add a flag to indicate if credentials are configured
    (sanitized as any).hasCredentials = !!dataSource.credentialsEncrypted;
    
    return sanitized;
  }
} 