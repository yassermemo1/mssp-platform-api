import { Injectable, NotFoundException, ConflictException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { DataSourceQuery } from '../entities/data-source-query.entity';
import { ExternalDataSource } from '../entities/external-data-source.entity';
import { CreateDataSourceQueryDto } from '../dto/create-data-source-query.dto';
import { UpdateDataSourceQueryDto } from '../dto/update-data-source-query.dto';

/**
 * DataSourceQueryService
 * Manages CRUD operations for data source queries
 */
@Injectable()
export class DataSourceQueryService {
  constructor(
    @InjectRepository(DataSourceQuery)
    private queryRepository: Repository<DataSourceQuery>,
    @InjectRepository(ExternalDataSource)
    private dataSourceRepository: Repository<ExternalDataSource>
  ) {}

  /**
   * Create a new data source query
   */
  async create(dto: CreateDataSourceQueryDto): Promise<DataSourceQuery> {
    // Check for duplicate query name
    const existing = await this.queryRepository.findOne({
      where: { queryName: dto.queryName }
    });

    if (existing) {
      throw new ConflictException(`Query with name "${dto.queryName}" already exists`);
    }

    // Verify data source exists
    const dataSource = await this.dataSourceRepository.findOne({
      where: { id: dto.dataSourceId }
    });

    if (!dataSource) {
      throw new BadRequestException(`Data source with ID "${dto.dataSourceId}" not found`);
    }

    // Validate JSONPath syntax
    this.validateJsonPath(dto.responseExtractionPath);

    // Create the query
    const query = this.queryRepository.create(dto);
    return await this.queryRepository.save(query);
  }

  /**
   * Get all data source queries
   */
  async findAll(dataSourceId?: string): Promise<DataSourceQuery[]> {
    const where: any = {};
    if (dataSourceId) {
      where.dataSourceId = dataSourceId;
    }

    return await this.queryRepository.find({
      where,
      relations: ['dataSource'],
      order: { queryName: 'ASC' }
    });
  }

  /**
   * Get a specific data source query by ID
   */
  async findOne(id: string): Promise<DataSourceQuery> {
    const query = await this.queryRepository.findOne({
      where: { id },
      relations: ['dataSource']
    });

    if (!query) {
      throw new NotFoundException(`Query with ID "${id}" not found`);
    }

    return query;
  }

  /**
   * Get a data source query by name
   */
  async findByName(queryName: string): Promise<DataSourceQuery> {
    const query = await this.queryRepository.findOne({
      where: { queryName },
      relations: ['dataSource']
    });

    if (!query) {
      throw new NotFoundException(`Query with name "${queryName}" not found`);
    }

    return query;
  }

  /**
   * Update a data source query
   */
  async update(id: string, dto: UpdateDataSourceQueryDto): Promise<DataSourceQuery> {
    const query = await this.queryRepository.findOne({
      where: { id }
    });

    if (!query) {
      throw new NotFoundException(`Query with ID "${id}" not found`);
    }

    // Check for duplicate name if updating
    if (dto.queryName && dto.queryName !== query.queryName) {
      const existing = await this.queryRepository.findOne({
        where: { queryName: dto.queryName }
      });

      if (existing) {
        throw new ConflictException(`Query with name "${dto.queryName}" already exists`);
      }
    }

    // Verify new data source if changing
    if (dto.dataSourceId && dto.dataSourceId !== query.dataSourceId) {
      const dataSource = await this.dataSourceRepository.findOne({
        where: { id: dto.dataSourceId }
      });

      if (!dataSource) {
        throw new BadRequestException(`Data source with ID "${dto.dataSourceId}" not found`);
      }
    }

    // Validate JSONPath if updating
    if (dto.responseExtractionPath) {
      this.validateJsonPath(dto.responseExtractionPath);
    }

    // Update fields
    Object.assign(query, dto);

    return await this.queryRepository.save(query);
  }

  /**
   * Delete a data source query
   */
  async remove(id: string): Promise<void> {
    const query = await this.queryRepository.findOne({
      where: { id }
    });

    if (!query) {
      throw new NotFoundException(`Query with ID "${id}" not found`);
    }

    await this.queryRepository.remove(query);
  }

  /**
   * Validate query template for placeholder syntax
   */
  async validateTemplate(id: string): Promise<{ valid: boolean; placeholders: string[] }> {
    const query = await this.findOne(id);
    
    const placeholders: string[] = [];
    const regex = /{(\w+)}/g;
    
    // Extract placeholders from endpoint path
    let match;
    while ((match = regex.exec(query.endpointPath)) !== null) {
      placeholders.push(match[1]);
    }
    
    // Extract placeholders from query template
    if (query.queryTemplate) {
      regex.lastIndex = 0; // Reset regex
      while ((match = regex.exec(query.queryTemplate)) !== null) {
        if (!placeholders.includes(match[1])) {
          placeholders.push(match[1]);
        }
      }
    }

    return {
      valid: true,
      placeholders: [...new Set(placeholders)] // Remove duplicates
    };
  }

  /**
   * Validate JSONPath syntax
   */
  private validateJsonPath(path: string): void {
    if (!path || typeof path !== 'string') {
      throw new BadRequestException('Response extraction path is required');
    }

    // Basic JSONPath validation
    if (!path.startsWith('$')) {
      throw new BadRequestException('JSONPath must start with $');
    }

    // Check for common invalid patterns
    const invalidPatterns = [
      /\$\$/,  // Double dollar
      /\.\./,  // Double dot (except for recursive descent)
      /\[\]/,  // Empty brackets
      /\.\[/,  // Dot before bracket
    ];

    for (const pattern of invalidPatterns) {
      if (pattern.test(path) && path !== '$..') {
        throw new BadRequestException(`Invalid JSONPath syntax: ${path}`);
      }
    }
  }
} 