import {
  Injectable,
  NotFoundException,
  ConflictException,
  Logger,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Client } from '../../entities/client.entity';
import { CreateClientDto, UpdateClientDto } from './dto';
import { User } from '../../entities/user.entity';

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

      // Create new client entity
      const client = this.clientRepository.create(createClientDto);
      
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
   * Retrieve all clients
   * @param queryOptions - Optional query parameters (for future pagination/filtering)
   * @returns Promise<Client[]> - Array of all clients
   */
  async findAll(queryOptions?: any): Promise<Client[]> {
    this.logger.log('Retrieving all clients');

    try {
      const clients = await this.clientRepository.find({
        order: {
          createdAt: 'DESC', // Most recent first
        },
      });

      this.logger.log(`Retrieved ${clients.length} clients`);
      return clients;
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

      // Update the client
      await this.clientRepository.update(id, updateClientDto);

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
} 