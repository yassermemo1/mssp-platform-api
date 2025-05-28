import {
  Injectable,
  NotFoundException,
  ConflictException,
  Logger,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Like, Between, MoreThanOrEqual, LessThanOrEqual } from 'typeorm';
import { Client } from '../../entities/client.entity';
import { Contract } from '../../entities/contract.entity';
import { ServiceScope } from '../../entities/service-scope.entity';
import { CreateClientDto, UpdateClientDto, QueryClientDto } from './dto';
import { User } from '../../entities/user.entity';
import { CustomFieldDefinitionService } from '../custom-fields/services/custom-field-definition.service';
import { CustomFieldValidationService } from '../custom-fields/services/custom-field-validation.service';
import { CustomFieldEntityType } from '../../enums';
import * as Papa from 'papaparse';

/**
 * ClientsService
 * Handles all business logic for client CRUD operations
 */
@Injectable()
export class ClientsService {
  private readonly logger = new Logger(ClientsService.name);

  constructor(
    @InjectRepository(Client)
    private readonly clientRepository: Repository<Client>,
    @InjectRepository(Contract)
    private readonly contractRepository: Repository<Contract>,
    @InjectRepository(ServiceScope)
    private readonly serviceScopeRepository: Repository<ServiceScope>,
    private readonly customFieldDefinitionService: CustomFieldDefinitionService,
    private readonly customFieldValidationService: CustomFieldValidationService,
  ) {}

  /**
   * Create a new client
   * @param createClientDto - Data for creating the client
   * @param currentUser - The authenticated user creating the client
   * @returns Promise<Client> - The created client
   * @throws ConflictException if company name already exists
   */
  async create(
    createClientDto: CreateClientDto,
    currentUser: User,
  ): Promise<Client> {
    this.logger.log(
      `Creating new client: ${createClientDto.companyName} by user: ${currentUser.email}`,
    );

    try {
      // Check if company name already exists
      const existingClient = await this.clientRepository.findOne({
        where: { companyName: createClientDto.companyName },
      });

      if (existingClient) {
        throw new ConflictException(
          `Client with company name '${createClientDto.companyName}' already exists`,
        );
      }

      // Validate custom field data if provided
      let validatedCustomFieldData = null;
      if (createClientDto.customFieldData) {
        const fieldDefinitions = await this.customFieldDefinitionService.getFieldDefinitionsMap(
          CustomFieldEntityType.CLIENT
        );
        validatedCustomFieldData = await this.customFieldValidationService.validateCustomFieldData(
          createClientDto.customFieldData,
          fieldDefinitions
        );
      }

      // Create new client entity
      const clientData = { ...createClientDto };
      if (validatedCustomFieldData) {
        clientData.customFieldData = validatedCustomFieldData;
      }
      
      const client = this.clientRepository.create(clientData);
      
      // Save the client
      const savedClient = await this.clientRepository.save(client);

      this.logger.log(
        `Successfully created client with ID: ${savedClient.id}`,
      );

      return savedClient;
    } catch (error) {
      if (error instanceof ConflictException) {
        throw error;
      }
      
      this.logger.error(
        `Failed to create client: ${createClientDto.companyName}`,
        error.stack,
      );
      throw error;
    }
  }

  /**
   * Retrieve all clients with advanced filtering
   * @param queryDto - Query parameters for filtering, sorting, and pagination
   * @returns Promise<{ data: Client[], total: number, page: number, limit: number }> - Paginated result
   */
  async findAll(queryDto: QueryClientDto): Promise<{ 
    data: Client[], 
    total: number, 
    page: number, 
    limit: number 
  }> {
    this.logger.log('Retrieving clients with filters', queryDto);

    try {
      const query = this.clientRepository.createQueryBuilder('client');

      // Full-text search across multiple fields
      if (queryDto.search) {
        query.andWhere(
          '(LOWER(client.companyName) LIKE LOWER(:search) OR ' +
          'LOWER(client.contactName) LIKE LOWER(:search) OR ' +
          'LOWER(client.contactEmail) LIKE LOWER(:search) OR ' +
          'LOWER(client.contactPhone) LIKE LOWER(:search))',
          { search: `%${queryDto.search}%` }
        );
      }

      // Specific field filters
      if (queryDto.companyName) {
        query.andWhere('LOWER(client.companyName) LIKE LOWER(:companyName)', {
          companyName: `%${queryDto.companyName}%`
        });
      }

      if (queryDto.contactName) {
        query.andWhere('LOWER(client.contactName) LIKE LOWER(:contactName)', {
          contactName: `%${queryDto.contactName}%`
        });
      }

      if (queryDto.contactEmail) {
        query.andWhere('LOWER(client.contactEmail) LIKE LOWER(:contactEmail)', {
          contactEmail: `%${queryDto.contactEmail}%`
        });
      }

      if (queryDto.contactPhone) {
        query.andWhere('client.contactPhone LIKE :contactPhone', {
          contactPhone: `%${queryDto.contactPhone}%`
        });
      }

      if (queryDto.status) {
        query.andWhere('client.status = :status', { status: queryDto.status });
      }

      // Date range filters
      if (queryDto.createdDateFrom && queryDto.createdDateTo) {
        query.andWhere('client.createdAt BETWEEN :from AND :to', {
          from: queryDto.createdDateFrom,
          to: queryDto.createdDateTo,
        });
      } else if (queryDto.createdDateFrom) {
        query.andWhere('client.createdAt >= :from', {
          from: queryDto.createdDateFrom,
        });
      } else if (queryDto.createdDateTo) {
        query.andWhere('client.createdAt <= :to', {
          to: queryDto.createdDateTo,
        });
      }

      // Sorting
      const sortField = queryDto.sortBy || 'createdAt';
      const sortOrder = queryDto.sortOrder || 'DESC';
      query.orderBy(`client.${sortField}`, sortOrder as 'ASC' | 'DESC');

      // Pagination
      const page = queryDto.page || 1;
      const limit = queryDto.limit || 20;
      const skip = (page - 1) * limit;

      query.skip(skip).take(limit);

      // Execute query
      const [data, total] = await query.getManyAndCount();

      this.logger.log(`Retrieved ${data.length} clients out of ${total} total`);
      
      return {
        data,
        total,
        page,
        limit,
      };
    } catch (error) {
      this.logger.error('Failed to retrieve clients', error.stack);
      throw error;
    }
  }

  /**
   * Retrieve a single client by ID
   * @param id - UUID of the client
   * @returns Promise<Client> - The found client
   * @throws NotFoundException if client doesn't exist
   */
  async findOne(id: string): Promise<Client> {
    this.logger.log(`Retrieving client with ID: ${id}`);

    try {
      const client = await this.clientRepository.findOne({
        where: { id },
      });

      if (!client) {
        throw new NotFoundException(`Client with ID '${id}' not found`);
      }

      this.logger.log(`Successfully retrieved client: ${client.companyName}`);
      return client;
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      
      this.logger.error(`Failed to retrieve client with ID: ${id}`, error.stack);
      throw error;
    }
  }

  /**
   * Update an existing client
   * @param id - UUID of the client to update
   * @param updateClientDto - Data for updating the client
   * @param currentUser - The authenticated user updating the client
   * @returns Promise<Client> - The updated client
   * @throws NotFoundException if client doesn't exist
   * @throws ConflictException if company name conflicts with another client
   */
  async update(
    id: string,
    updateClientDto: UpdateClientDto,
    currentUser: User,
  ): Promise<Client> {
    this.logger.log(
      `Updating client with ID: ${id} by user: ${currentUser.email}`,
    );

    try {
      // First, check if the client exists
      const existingClient = await this.findOne(id);

      // If updating company name, check for conflicts
      if ('companyName' in updateClientDto && updateClientDto.companyName && 
          updateClientDto.companyName !== existingClient.companyName) {
        const conflictingClient = await this.clientRepository.findOne({
          where: { companyName: updateClientDto.companyName },
        });

        if (conflictingClient) {
          throw new ConflictException(
            `Client with company name '${updateClientDto.companyName}' already exists`,
          );
        }
      }

      // Validate custom field data if provided
      let validatedCustomFieldData = null;
      if (updateClientDto.customFieldData) {
        const fieldDefinitions = await this.customFieldDefinitionService.getFieldDefinitionsMap(
          CustomFieldEntityType.CLIENT
        );
        validatedCustomFieldData = await this.customFieldValidationService.validateCustomFieldData(
          updateClientDto.customFieldData,
          fieldDefinitions
        );
      }

      // Prepare update data
      const updateData = { ...updateClientDto };
      if (validatedCustomFieldData !== null) {
        updateData.customFieldData = validatedCustomFieldData;
      }

      // Update the client
      await this.clientRepository.update(id, updateData);

      // Retrieve and return the updated client
      const updatedClient = await this.findOne(id);

      this.logger.log(
        `Successfully updated client: ${updatedClient.companyName}`,
      );

      return updatedClient;
    } catch (error) {
      if (error instanceof NotFoundException || error instanceof ConflictException) {
        throw error;
      }
      
      this.logger.error(`Failed to update client with ID: ${id}`, error.stack);
      throw error;
    }
  }

  /**
   * Delete a client
   * @param id - UUID of the client to delete
   * @param currentUser - The authenticated user deleting the client
   * @returns Promise<void>
   * @throws NotFoundException if client doesn't exist
   * 
   * Note: This implements hard delete for simplicity.
   * For soft delete implementation, we would:
   * 1. Add a 'deletedAt' timestamp field to the Client entity
   * 2. Update this method to set deletedAt instead of removing the record
   * 3. Modify all find operations to exclude soft-deleted records
   * 4. Consider data retention policies and cleanup procedures
   */
  async remove(id: string, currentUser: User): Promise<void> {
    this.logger.log(
      `Deleting client with ID: ${id} by user: ${currentUser.email}`,
    );

    try {
      // First, check if the client exists
      const existingClient = await this.findOne(id);

      // Delete the client
      await this.clientRepository.delete(id);

      this.logger.log(
        `Successfully deleted client: ${existingClient.companyName}`,
      );
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      
      this.logger.error(`Failed to delete client with ID: ${id}`, error.stack);
      throw error;
    }
  }

  /**
   * Get all service scopes for a specific client
   * @param clientId - UUID of the client
   * @returns Promise<ServiceScope[]> - Array of service scopes for the client
   * @throws NotFoundException if client doesn't exist
   */
  async getServiceScopes(clientId: string): Promise<ServiceScope[]> {
    this.logger.log(`Retrieving service scopes for client: ${clientId}`);

    try {
      // First, verify the client exists
      await this.findOne(clientId);

      // Find all service scopes for this client through their contracts
      const serviceScopes = await this.serviceScopeRepository
        .createQueryBuilder('serviceScope')
        .leftJoinAndSelect('serviceScope.service', 'service')
        .leftJoinAndSelect('serviceScope.contract', 'contract')
        .where('contract.clientId = :clientId', { clientId })
        .andWhere('serviceScope.isActive = :isActive', { isActive: true })
        .orderBy('serviceScope.createdAt', 'DESC')
        .getMany();

      this.logger.log(`Retrieved ${serviceScopes.length} service scopes for client: ${clientId}`);
      return serviceScopes;
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      
      this.logger.error(`Failed to retrieve service scopes for client: ${clientId}`, error.stack);
      throw error;
    }
  }

  /**
   * Export clients to CSV format
   * @param queryDto - Query parameters for filtering
   * @returns Promise<string> - CSV formatted string
   */
  async exportToCsv(queryDto: QueryClientDto): Promise<string> {
    this.logger.log('Exporting clients to CSV with filters', queryDto);

    try {
      // Get all data without pagination for export
      const exportQuery = { ...queryDto, page: 1, limit: 10000 };
      const { data } = await this.findAll(exportQuery);

      // Transform data for CSV export
      const csvData = data.map(client => ({
        'Company Name': client.companyName,
        'Contact Name': client.contactName,
        'Contact Email': client.contactEmail,
        'Contact Phone': client.contactPhone,
        'Address': client.address,
        'Status': client.status,
        'Created Date': new Date(client.createdAt).toISOString().split('T')[0],
        'Last Updated': new Date(client.updatedAt).toISOString().split('T')[0],
        'Notes': client.notes || '',
      }));

      // Generate CSV
      const csv = Papa.unparse(csvData, {
        header: true,
        delimiter: ',',
      });

      this.logger.log(`Successfully exported ${data.length} clients to CSV`);
      return csv;
    } catch (error) {
      this.logger.error('Failed to export clients to CSV', error.stack);
      throw error;
    }
  }
} 