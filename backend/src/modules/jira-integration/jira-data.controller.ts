import {
  Controller,
  Get,
  Param,
  Query,
  UseGuards,
  ParseUUIDPipe,
  BadRequestException
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '../../enums';
import { JiraDataService } from './services/jira-data.service';
import { JiraTicketDto } from './dto/jira-ticket.dto';
import { TicketCountDto } from './dto/ticket-count.dto';
import { SLASummaryDto } from './dto/sla-summary.dto';

/**
 * JiraDataController
 * Exposes Jira-sourced data via secure API endpoints
 */
@Controller('jira')
@UseGuards(JwtAuthGuard, RolesGuard)
export class JiraDataController {
  constructor(
    private readonly jiraDataService: JiraDataService
  ) {}

  /**
   * Get ticket counts for a specific client
   * GET /jira/clients/:clientId/ticket-counts
   */
  @Get('clients/:clientId/ticket-counts')
  @Roles(UserRole.ADMIN, UserRole.MANAGER, UserRole.ACCOUNT_MANAGER)
  async getClientTicketCounts(
    @Param('clientId', ParseUUIDPipe) clientId: string
  ): Promise<TicketCountDto> {
    return await this.jiraDataService.getClientTicketCounts(clientId);
  }

  /**
   * Get detailed tickets for a specific client with filters and pagination
   * GET /jira/clients/:clientId/tickets
   */
  @Get('clients/:clientId/tickets')
  @Roles(UserRole.ADMIN, UserRole.MANAGER, UserRole.ACCOUNT_MANAGER)
  async getClientTickets(
    @Param('clientId', ParseUUIDPipe) clientId: string,
    @Query('statusCategory') statusCategory?: string,
    @Query('priority') priority?: string,
    @Query('maxResults') maxResults?: string,
    @Query('startAt') startAt?: string
  ): Promise<{ tickets: JiraTicketDto[]; total: number }> {
    // Validate and parse pagination parameters
    const parsedMaxResults = maxResults ? parseInt(maxResults, 10) : 50;
    const parsedStartAt = startAt ? parseInt(startAt, 10) : 0;

    if (isNaN(parsedMaxResults) || parsedMaxResults < 1 || parsedMaxResults > 100) {
      throw new BadRequestException('maxResults must be between 1 and 100');
    }

    if (isNaN(parsedStartAt) || parsedStartAt < 0) {
      throw new BadRequestException('startAt must be a non-negative number');
    }

    return await this.jiraDataService.getClientTicketsDetailed(
      clientId,
      {
        statusCategory,
        priority
      },
      {
        maxResults: parsedMaxResults,
        startAt: parsedStartAt
      }
    );
  }

  /**
   * Get SLA summary for a specific client
   * GET /jira/clients/:clientId/sla-summary
   */
  @Get('clients/:clientId/sla-summary')
  @Roles(UserRole.ADMIN, UserRole.MANAGER, UserRole.ACCOUNT_MANAGER)
  async getClientSLASummary(
    @Param('clientId', ParseUUIDPipe) clientId: string
  ): Promise<SLASummaryDto> {
    return await this.jiraDataService.getClientSLASummary(clientId);
  }

  /**
   * Get global ticket summary across all clients
   * GET /jira/global-ticket-summary
   */
  @Get('global-ticket-summary')
  @Roles(UserRole.ADMIN, UserRole.MANAGER)
  async getGlobalTicketSummary(): Promise<any> {
    return await this.jiraDataService.getGlobalTicketSummary();
  }

  /**
   * Health check endpoint to verify Jira integration is working
   * GET /jira/health
   */
  @Get('health')
  @Roles(UserRole.ADMIN)
  async healthCheck(): Promise<{ status: string; message: string }> {
    // This could be enhanced to actually test Jira connectivity
    return {
      status: 'ok',
      message: 'Jira integration is configured'
    };
  }
} 