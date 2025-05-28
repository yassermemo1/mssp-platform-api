import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ConflictException,
  Logger,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, FindManyOptions, Like, Between, MoreThanOrEqual, LessThanOrEqual } from 'typeorm';
import { Proposal } from '../../entities/proposal.entity';
import { ServiceScope } from '../../entities/service-scope.entity';
import { User } from '../../entities/user.entity';
import { ProposalStatus } from '../../enums/proposal-status.enum';
import { CreateProposalDto, UpdateProposalDto, ProposalQueryDto } from './dto';
import { CustomFieldDefinitionService } from '../custom-fields/services/custom-field-definition.service';
import { CustomFieldValidationService } from '../custom-fields/services/custom-field-validation.service';
import { CustomFieldEntityType } from '../../enums';

/**
 * ProposalsService
 * Business logic for comprehensive proposal management
 * 
 * This service handles:
 * - Proposal CRUD operations with validation
 * - Proposal lifecycle management and status transitions
 * - Document linking and versioning
 * - Integration with service scopes and contracts
 * - Proposal approval processes and workflow
 * - Financial details and assignee management
 * - Global proposal filtering and analytics
 */
@Injectable()
export class ProposalsService {
  private readonly logger = new Logger(ProposalsService.name);

  constructor(
    @InjectRepository(Proposal)
    private readonly proposalRepository: Repository<Proposal>,
    @InjectRepository(ServiceScope)
    private readonly serviceScopeRepository: Repository<ServiceScope>,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    private readonly customFieldDefinitionService: CustomFieldDefinitionService,
    private readonly customFieldValidationService: CustomFieldValidationService,
  ) {}

  /**
   * Create a new proposal for a specific service scope
   * Validates service scope existence, assignee user, and proposal data
   */
  async createProposalForServiceScope(
    serviceScopeId: string,
    createProposalDto: CreateProposalDto,
    currentUser: any,
  ): Promise<Proposal> {
    this.logger.log(`Creating proposal for service scope: ${serviceScopeId}`);

    // Validate service scope exists
    const serviceScope = await this.serviceScopeRepository.findOne({
      where: { id: serviceScopeId },
      relations: ['contract', 'service', 'contract.client'],
    });

    if (!serviceScope) {
      throw new NotFoundException(`Service scope with ID ${serviceScopeId} not found`);
    }

    // Ensure consistency between URL parameter and DTO
    if (createProposalDto.serviceScopeId !== serviceScopeId) {
      throw new BadRequestException(
        'Service scope ID in URL must match service scope ID in request body',
      );
    }

    // Validate assignee user if provided
    if (createProposalDto.assigneeUserId) {
      const assigneeUser = await this.userRepository.findOne({
        where: { id: createProposalDto.assigneeUserId },
      });

      if (!assigneeUser) {
        throw new NotFoundException(
          `Assignee user with ID ${createProposalDto.assigneeUserId} not found`,
        );
      }

      this.logger.log(`Assigning proposal to user: ${assigneeUser.email}`);
    }

    // Validate date logic
    this.validateProposalDates(createProposalDto);

    // Validate financial data consistency
    this.validateFinancialData(createProposalDto);

    // Validate custom field data if provided
    let validatedCustomFieldData = null;
    if (createProposalDto.customFieldData) {
      const fieldDefinitions = await this.customFieldDefinitionService.getFieldDefinitionsMap(
        CustomFieldEntityType.PROPOSAL
      );
      validatedCustomFieldData = await this.customFieldValidationService.validateCustomFieldData(
        createProposalDto.customFieldData,
        fieldDefinitions
      );
    }

    // Create proposal entity
    const proposalData: any = {
      ...createProposalDto,
      submittedAt: createProposalDto.submittedAt ? new Date(createProposalDto.submittedAt) : null,
      approvedAt: createProposalDto.approvedAt ? new Date(createProposalDto.approvedAt) : null,
      validUntilDate: createProposalDto.validUntilDate ? new Date(createProposalDto.validUntilDate) : null,
      status: createProposalDto.status || ProposalStatus.DRAFT,
      currency: createProposalDto.currency || 'SAR', // Default to SAR for Saudi Arabia
    };

    if (validatedCustomFieldData) {
      proposalData.customFieldData = validatedCustomFieldData;
    }

    const proposal = this.proposalRepository.create(proposalData);

    const savedProposal = await this.proposalRepository.save(proposal) as unknown as Proposal;
    
    this.logger.log(`Proposal created successfully with ID: ${savedProposal.id}`);
    
    // Return proposal with all relationships loaded
    return this.findOneProposal(savedProposal.id);
  }

  /**
   * Find all proposals for a specific service scope with enhanced filtering
   * Supports filtering by type, status, assignee, dates, and search
   */
  async findAllProposalsForServiceScope(
    serviceScopeId: string,
    queryDto: ProposalQueryDto,
  ): Promise<{
    data: Proposal[];
    count: number;
    page: number;
    limit: number;
    totalPages: number;
  }> {
    this.logger.log(`Fetching proposals for service scope: ${serviceScopeId}`, queryDto);

    // Validate service scope exists
    const serviceScope = await this.serviceScopeRepository.findOne({
      where: { id: serviceScopeId },
    });

    if (!serviceScope) {
      throw new NotFoundException(`Service scope with ID ${serviceScopeId} not found`);
    }

    return this.buildProposalQuery(queryDto, { serviceScopeId });
  }

  /**
   * Find all proposals across all service scopes with comprehensive filtering and pagination
   * Supports filtering by type, status, assignee, client, dates, currency, and search
   */
  async findAllProposals(
    queryDto: ProposalQueryDto,
  ): Promise<{
    data: Proposal[];
    count: number;
    page: number;
    limit: number;
    totalPages: number;
  }> {
    this.logger.log('Fetching all proposals with enhanced filters', queryDto);

    return this.buildProposalQuery(queryDto);
  }

  /**
   * Find a single proposal by ID
   * Includes service scope, contract, service, client, and assignee relationships
   */
  async findOneProposal(id: string): Promise<Proposal> {
    this.logger.log(`Fetching proposal with ID: ${id}`);

    const proposal = await this.proposalRepository.findOne({
      where: { id },
      relations: [
        'serviceScope',
        'serviceScope.contract',
        'serviceScope.service',
        'serviceScope.contract.client',
        'assigneeUser',
      ],
    });

    if (!proposal) {
      throw new NotFoundException(`Proposal with ID ${id} not found`);
    }

    return proposal;
  }

  /**
   * Update an existing proposal with enhanced validation
   * Includes status transition validation and assignee validation
   */
  async updateProposal(
    id: string,
    updateProposalDto: UpdateProposalDto,
    currentUser: any,
  ): Promise<Proposal> {
    this.logger.log(`Updating proposal with ID: ${id}`);

    const existingProposal = await this.findOneProposal(id);

    // Validate assignee user if being updated
    if (updateProposalDto.assigneeUserId) {
      const assigneeUser = await this.userRepository.findOne({
        where: { id: updateProposalDto.assigneeUserId },
      });

      if (!assigneeUser) {
        throw new NotFoundException(
          `Assignee user with ID ${updateProposalDto.assigneeUserId} not found`,
        );
      }
    }

    // Validate status transition if status is being updated
    if (updateProposalDto.status && updateProposalDto.status !== existingProposal.status) {
      this.validateStatusTransition(existingProposal.status, updateProposalDto.status);
    }

    // Validate dates with the update data
    this.validateProposalDatesForUpdate(existingProposal, updateProposalDto);

    // Validate financial data consistency
    this.validateFinancialDataForUpdate(existingProposal, updateProposalDto);

    // Validate custom field data if provided
    let validatedCustomFieldData = null;
    if (updateProposalDto.customFieldData) {
      const fieldDefinitions = await this.customFieldDefinitionService.getFieldDefinitionsMap(
        CustomFieldEntityType.PROPOSAL
      );
      validatedCustomFieldData = await this.customFieldValidationService.validateCustomFieldData(
        updateProposalDto.customFieldData,
        fieldDefinitions
      );
    }

    // Prepare update data
    const updateData: any = {
      ...updateProposalDto,
      submittedAt: updateProposalDto.submittedAt 
        ? new Date(updateProposalDto.submittedAt) 
        : existingProposal.submittedAt,
      approvedAt: updateProposalDto.approvedAt 
        ? new Date(updateProposalDto.approvedAt) 
        : existingProposal.approvedAt,
      validUntilDate: updateProposalDto.validUntilDate 
        ? new Date(updateProposalDto.validUntilDate) 
        : existingProposal.validUntilDate,
    };

    // Handle custom field data merging
    if (validatedCustomFieldData !== null) {
      // Merge with existing custom field data if it exists
      if (existingProposal.customFieldData) {
        updateData.customFieldData = {
          ...existingProposal.customFieldData,
          ...validatedCustomFieldData,
        };
      } else {
        updateData.customFieldData = validatedCustomFieldData;
      }
    }

    // Update entity
    Object.assign(existingProposal, updateData);

    const updatedProposal = await this.proposalRepository.save(existingProposal);
    
    this.logger.log(`Proposal updated successfully: ${updatedProposal.id}`);
    
    return this.findOneProposal(updatedProposal.id);
  }

  /**
   * Delete a proposal by ID
   */
  async removeProposal(id: string): Promise<void> {
    this.logger.log(`Removing proposal with ID: ${id}`);

    const proposal = await this.findOneProposal(id);
    
    // Check if proposal can be deleted (business rule: cannot delete approved/completed proposals)
    if (proposal.isApproved && !proposal.isDraft) {
      throw new BadRequestException(
        'Cannot delete approved or completed proposals. Consider archiving instead.',
      );
    }

    await this.proposalRepository.remove(proposal);
    
    this.logger.log(`Proposal removed successfully: ${id}`);
  }

  /**
   * Get proposal statistics for dashboard
   */
  async getProposalStatistics(clientId?: string): Promise<{
    total: number;
    byStatus: Record<string, number>;
    byType: Record<string, number>;
    totalValue: number;
    averageValue: number;
    expiringSoon: number; // Expiring within 30 days
  }> {
    this.logger.log('Calculating proposal statistics', { clientId });

    const queryBuilder = this.proposalRepository.createQueryBuilder('proposal')
      .leftJoinAndSelect('proposal.serviceScope', 'serviceScope')
      .leftJoinAndSelect('serviceScope.contract', 'contract');

    if (clientId) {
      queryBuilder.where('contract.clientId = :clientId', { clientId });
    }

    const proposals = await queryBuilder.getMany();

    const statistics = {
      total: proposals.length,
      byStatus: {} as Record<string, number>,
      byType: {} as Record<string, number>,
      totalValue: 0,
      averageValue: 0,
      expiringSoon: 0,
    };

    // Calculate statistics
    proposals.forEach(proposal => {
      // Status counts
      statistics.byStatus[proposal.status] = (statistics.byStatus[proposal.status] || 0) + 1;
      
      // Type counts
      statistics.byType[proposal.proposalType] = (statistics.byType[proposal.proposalType] || 0) + 1;
      
      // Financial totals
      if (proposal.proposalValue) {
        statistics.totalValue += Number(proposal.proposalValue);
      }
      
      // Expiring soon (within 30 days)
      if (proposal.validUntilDate) {
        const daysUntilExpiry = Math.ceil(
          (proposal.validUntilDate.getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)
        );
        if (daysUntilExpiry <= 30 && daysUntilExpiry > 0) {
          statistics.expiringSoon++;
        }
      }
    });

    // Calculate average value
    const proposalsWithValue = proposals.filter(p => p.proposalValue);
    statistics.averageValue = proposalsWithValue.length > 0 
      ? statistics.totalValue / proposalsWithValue.length 
      : 0;

    return statistics;
  }

  /**
   * Private method to build comprehensive proposal queries
   */
  private async buildProposalQuery(
    queryDto: ProposalQueryDto,
    additionalFilters: { serviceScopeId?: string } = {},
  ): Promise<{
    data: Proposal[];
    count: number;
    page: number;
    limit: number;
    totalPages: number;
  }> {
    const {
      proposalType,
      status,
      assigneeUserId,
      clientId,
      currency,
      dateFrom,
      dateTo,
      submittedDateFrom,
      submittedDateTo,
      search,
      page = 1,
      limit = 10,
      sortBy = 'createdAt',
      sortDirection = 'DESC',
    } = queryDto;

    const queryBuilder = this.proposalRepository.createQueryBuilder('proposal')
      .leftJoinAndSelect('proposal.serviceScope', 'serviceScope')
      .leftJoinAndSelect('serviceScope.contract', 'contract')
      .leftJoinAndSelect('serviceScope.service', 'service')
      .leftJoinAndSelect('contract.client', 'client')
      .leftJoinAndSelect('proposal.assigneeUser', 'assigneeUser');

    // Apply additional filters (like serviceScopeId)
    if (additionalFilters.serviceScopeId) {
      queryBuilder.where('proposal.serviceScopeId = :serviceScopeId', { 
        serviceScopeId: additionalFilters.serviceScopeId 
      });
    }

    // Apply filters
    if (proposalType) {
      queryBuilder.andWhere('proposal.proposalType = :proposalType', { proposalType });
    }

    if (status) {
      queryBuilder.andWhere('proposal.status = :status', { status });
    }

    if (assigneeUserId) {
      queryBuilder.andWhere('proposal.assigneeUserId = :assigneeUserId', { assigneeUserId });
    }

    if (clientId) {
      queryBuilder.andWhere('contract.clientId = :clientId', { clientId });
    }

    if (currency) {
      queryBuilder.andWhere('proposal.currency = :currency', { currency });
    }

    if (dateFrom) {
      queryBuilder.andWhere('proposal.createdAt >= :dateFrom', { dateFrom: new Date(dateFrom) });
    }

    if (dateTo) {
      queryBuilder.andWhere('proposal.createdAt <= :dateTo', { dateTo: new Date(dateTo) });
    }

    if (submittedDateFrom) {
      queryBuilder.andWhere('proposal.submittedAt >= :submittedDateFrom', { 
        submittedDateFrom: new Date(submittedDateFrom) 
      });
    }

    if (submittedDateTo) {
      queryBuilder.andWhere('proposal.submittedAt <= :submittedDateTo', { 
        submittedDateTo: new Date(submittedDateTo) 
      });
    }

    // Apply search across multiple fields
    if (search) {
      queryBuilder.andWhere(
        '(proposal.title ILIKE :search OR proposal.description ILIKE :search OR proposal.notes ILIKE :search)',
        { search: `%${search}%` }
      );
    }

    // Apply sorting
    if (sortBy === 'proposalValue') {
      queryBuilder.orderBy('proposal.proposalValue', sortDirection, 'NULLS LAST');
    } else {
      queryBuilder.orderBy(`proposal.${sortBy}`, sortDirection);
    }

    // Apply pagination
    queryBuilder.skip((page - 1) * limit).take(limit);

    // Execute query
    const [proposals, count] = await queryBuilder.getManyAndCount();

    const totalPages = Math.ceil(count / limit);

    this.logger.log(`Found ${count} proposals (page ${page}/${totalPages})`);

    return {
      data: proposals,
      count,
      page,
      limit,
      totalPages,
    };
  }

  /**
   * Validate proposal dates for logical consistency (for creation)
   */
  private validateProposalDates(data: Partial<CreateProposalDto | UpdateProposalDto>): void {
    const submittedDate = data.submittedAt ? new Date(data.submittedAt) : null;
    const approvedDate = data.approvedAt ? new Date(data.approvedAt) : null;
    const validUntilDate = data.validUntilDate ? new Date(data.validUntilDate) : null;

    // Validate submission and approval date relationship
    if (submittedDate && approvedDate && approvedDate <= submittedDate) {
      throw new BadRequestException('Approval date must be after submission date');
    }

    // Validate valid until date is in the future (for new proposals or when updating)
    if (validUntilDate && validUntilDate <= new Date()) {
      throw new BadRequestException('Valid until date must be in the future');
    }

    // Validate submission date is not in the future
    if (submittedDate && submittedDate > new Date()) {
      throw new BadRequestException('Submission date cannot be in the future');
    }
  }

  /**
   * Validate proposal dates for updates (handles mixing entity and DTO data)
   */
  private validateProposalDatesForUpdate(
    existingProposal: Proposal, 
    updateData: UpdateProposalDto
  ): void {
    const submittedDate = updateData.submittedAt 
      ? new Date(updateData.submittedAt) 
      : existingProposal.submittedAt;
    const approvedDate = updateData.approvedAt 
      ? new Date(updateData.approvedAt) 
      : existingProposal.approvedAt;
    const validUntilDate = updateData.validUntilDate 
      ? new Date(updateData.validUntilDate) 
      : existingProposal.validUntilDate;

    // Validate submission and approval date relationship
    if (submittedDate && approvedDate && approvedDate <= submittedDate) {
      throw new BadRequestException('Approval date must be after submission date');
    }

    // Validate valid until date is in the future (for new proposals or when updating)
    if (validUntilDate && validUntilDate <= new Date()) {
      throw new BadRequestException('Valid until date must be in the future');
    }

    // Validate submission date is not in the future
    if (submittedDate && submittedDate > new Date()) {
      throw new BadRequestException('Submission date cannot be in the future');
    }
  }

  /**
   * Validate financial data consistency (for creation)
   */
  private validateFinancialData(data: Partial<CreateProposalDto | UpdateProposalDto>): void {
    // If proposal value is provided, currency should also be provided (or default to SAR)
    if (data.proposalValue && data.proposalValue > 0 && !data.currency) {
      // This is handled by defaulting to SAR in the entity creation
      this.logger.log('Proposal value provided without currency, defaulting to SAR');
    }

    // Validate proposal value is reasonable
    if (data.proposalValue && data.proposalValue < 0) {
      throw new BadRequestException('Proposal value cannot be negative');
    }
  }

  /**
   * Validate financial data consistency for updates (handles mixing entity and DTO data)
   */
  private validateFinancialDataForUpdate(
    existingProposal: Proposal, 
    updateData: UpdateProposalDto
  ): void {
    const proposalValue = updateData.proposalValue !== undefined 
      ? updateData.proposalValue 
      : existingProposal.proposalValue;
    const currency = updateData.currency !== undefined 
      ? updateData.currency 
      : existingProposal.currency;

    // If proposal value is provided, currency should also be provided (or default to SAR)
    if (proposalValue && proposalValue > 0 && !currency) {
      this.logger.log('Proposal value provided without currency, defaulting to SAR');
    }

    // Validate proposal value is reasonable
    if (proposalValue && proposalValue < 0) {
      throw new BadRequestException('Proposal value cannot be negative');
    }
  }

  /**
   * Validate status transitions according to business rules
   */
  private validateStatusTransition(currentStatus: ProposalStatus, newStatus: ProposalStatus): void {
    const validTransitions: Record<ProposalStatus, ProposalStatus[]> = {
      [ProposalStatus.DRAFT]: [
        ProposalStatus.IN_PREPARATION,
        ProposalStatus.SUBMITTED,
        ProposalStatus.WITHDRAWN,
        ProposalStatus.ARCHIVED,
      ],
      [ProposalStatus.IN_PREPARATION]: [
        ProposalStatus.DRAFT,
        ProposalStatus.SUBMITTED,
        ProposalStatus.WITHDRAWN,
        ProposalStatus.ARCHIVED,
      ],
      [ProposalStatus.SUBMITTED]: [
        ProposalStatus.UNDER_REVIEW,
        ProposalStatus.REQUIRES_REVISION,
        ProposalStatus.WITHDRAWN,
        ProposalStatus.REJECTED,
      ],
      [ProposalStatus.UNDER_REVIEW]: [
        ProposalStatus.PENDING_APPROVAL,
        ProposalStatus.PENDING_CLIENT_REVIEW,
        ProposalStatus.REQUIRES_REVISION,
        ProposalStatus.REJECTED,
      ],
      [ProposalStatus.PENDING_APPROVAL]: [
        ProposalStatus.APPROVED,
        ProposalStatus.REQUIRES_REVISION,
        ProposalStatus.REJECTED,
      ],
      [ProposalStatus.PENDING_CLIENT_REVIEW]: [
        ProposalStatus.ACCEPTED_BY_CLIENT,
        ProposalStatus.REQUIRES_REVISION,
        ProposalStatus.REJECTED,
      ],
      [ProposalStatus.REQUIRES_REVISION]: [
        ProposalStatus.DRAFT,
        ProposalStatus.IN_PREPARATION,
        ProposalStatus.SUBMITTED,
        ProposalStatus.WITHDRAWN,
      ],
      [ProposalStatus.APPROVED]: [
        ProposalStatus.ACCEPTED_BY_CLIENT,
        ProposalStatus.IN_IMPLEMENTATION,
        ProposalStatus.ARCHIVED,
      ],
      [ProposalStatus.ACCEPTED_BY_CLIENT]: [
        ProposalStatus.IN_IMPLEMENTATION,
        ProposalStatus.COMPLETED,
      ],
      [ProposalStatus.IN_IMPLEMENTATION]: [
        ProposalStatus.COMPLETED,
      ],
      [ProposalStatus.REJECTED]: [
        ProposalStatus.ARCHIVED,
      ],
      [ProposalStatus.WITHDRAWN]: [
        ProposalStatus.ARCHIVED,
      ],
      [ProposalStatus.COMPLETED]: [
        ProposalStatus.ARCHIVED,
      ],
      [ProposalStatus.ARCHIVED]: [], // No transitions from archived
    };

    const allowedTransitions = validTransitions[currentStatus] || [];
    
    if (!allowedTransitions.includes(newStatus)) {
      throw new BadRequestException(
        `Invalid status transition from ${currentStatus} to ${newStatus}. ` +
        `Allowed transitions: ${allowedTransitions.join(', ')}`
      );
    }
  }
} 