import {
  Controller,
  Get,
  Param,
  Query,
  UseGuards,
  HttpCode,
  HttpStatus,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { JiraService, TicketSummary, SLASummary, JiraIssue } from '../services/jira.service';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { firstValueFrom } from 'rxjs';

/**
 * JiraController
 * Exposes Jira ticket and SLA data for dashboards and client views
 * All endpoints require authentication
 */
@Controller('integrations/jira')
@UseGuards(JwtAuthGuard)
export class JiraController {
  private readonly logger = new Logger(JiraController.name);

  constructor(private readonly jiraService: JiraService) {}

  /**
   * Get ticket summary for a specific client
   * GET /integrations/jira/clients/:clientId/tickets/summary
   * Requires: Any authenticated user
   */
  @Get('clients/:clientId/tickets/summary')
  @HttpCode(HttpStatus.OK)
  async getClientTicketSummary(@Param('clientId') clientId: string) {
    this.logger.log(`Fetching ticket summary for client: ${clientId}`);
    
    try {
      const summary = await firstValueFrom(
        this.jiraService.getClientTicketSummary(clientId)
      );
      
      return {
        statusCode: HttpStatus.OK,
        message: 'Ticket summary retrieved successfully',
        data: summary,
      };
    } catch (error) {
      this.logger.error(`Error fetching ticket summary for client ${clientId}:`, error);
      throw error;
    }
  }

  /**
   * Get SLA summary for a specific client
   * GET /integrations/jira/clients/:clientId/sla/summary
   * Requires: Any authenticated user
   */
  @Get('clients/:clientId/sla/summary')
  @HttpCode(HttpStatus.OK)
  async getClientSLASummary(@Param('clientId') clientId: string) {
    this.logger.log(`Fetching SLA summary for client: ${clientId}`);
    
    try {
      const summary = await firstValueFrom(
        this.jiraService.getClientSLASummary(clientId)
      );
      
      return {
        statusCode: HttpStatus.OK,
        message: 'SLA summary retrieved successfully',
        data: summary,
      };
    } catch (error) {
      this.logger.error(`Error fetching SLA summary for client ${clientId}:`, error);
      throw error;
    }
  }

  /**
   * Get detailed tickets for a specific client
   * GET /integrations/jira/clients/:clientId/tickets
   * Requires: Any authenticated user
   */
  @Get('clients/:clientId/tickets')
  @HttpCode(HttpStatus.OK)
  async getClientTickets(@Param('clientId') clientId: string) {
    this.logger.log(`Fetching tickets for client: ${clientId}`);
    
    try {
      const tickets = await firstValueFrom(
        this.jiraService.getClientIssues(clientId)
      );
      
      return {
        statusCode: HttpStatus.OK,
        message: 'Tickets retrieved successfully',
        data: tickets,
        meta: {
          count: tickets.length,
        },
      };
    } catch (error) {
      this.logger.error(`Error fetching tickets for client ${clientId}:`, error);
      throw error;
    }
  }

  /**
   * Get ticket and SLA summaries for multiple clients (for main dashboard)
   * GET /integrations/jira/dashboard/summary
   * Requires: Any authenticated user
   * Query params: clientIds (comma-separated list)
   */
  @Get('dashboard/summary')
  @HttpCode(HttpStatus.OK)
  async getDashboardSummary(@Query('clientIds') clientIds: string) {
    this.logger.log(`Fetching dashboard summary for clients: ${clientIds}`);
    
    if (!clientIds) {
      return {
        statusCode: HttpStatus.OK,
        message: 'No client IDs provided',
        data: {
          tickets: {},
          sla: {},
        },
      };
    }

    const clientIdArray = clientIds.split(',').map(id => id.trim());
    
    try {
      // Fetch ticket summaries for all clients in parallel
      const ticketPromises = clientIdArray.map(clientId =>
        firstValueFrom(this.jiraService.getClientTicketSummary(clientId))
          .then(summary => ({ clientId, summary }))
          .catch(error => {
            this.logger.error(`Error fetching tickets for client ${clientId}:`, error);
            return { clientId, summary: null };
          })
      );

      // Fetch SLA summaries for all clients in parallel
      const slaPromises = clientIdArray.map(clientId =>
        firstValueFrom(this.jiraService.getClientSLASummary(clientId))
          .then(summary => ({ clientId, summary }))
          .catch(error => {
            this.logger.error(`Error fetching SLA for client ${clientId}:`, error);
            return { clientId, summary: null };
          })
      );

      const [ticketResults, slaResults] = await Promise.all([
        Promise.all(ticketPromises),
        Promise.all(slaPromises),
      ]);

      // Aggregate results
      const aggregatedTickets: Record<string, TicketSummary | null> = {};
      const aggregatedSLA: Record<string, SLASummary | null> = {};
      
      ticketResults.forEach(({ clientId, summary }) => {
        aggregatedTickets[clientId] = summary;
      });
      
      slaResults.forEach(({ clientId, summary }) => {
        aggregatedSLA[clientId] = summary;
      });

      // Calculate totals
      const totals = {
        tickets: {
          total: 0,
          open: 0,
          inProgress: 0,
          resolved: 0,
        },
        sla: {
          timeToFirstResponse: {
            achieved: 0,
            breached: 0,
          },
          timeToResolution: {
            achieved: 0,
            breached: 0,
          },
        },
      };

      Object.values(aggregatedTickets).forEach(summary => {
        if (summary) {
          totals.tickets.total += summary.totalTickets;
          totals.tickets.open += summary.openTickets;
          totals.tickets.inProgress += summary.inProgressTickets;
          totals.tickets.resolved += summary.resolvedTickets;
        }
      });

      Object.values(aggregatedSLA).forEach(summary => {
        if (summary) {
          totals.sla.timeToFirstResponse.achieved += summary.timeToFirstResponse.achieved;
          totals.sla.timeToFirstResponse.breached += summary.timeToFirstResponse.breached;
          totals.sla.timeToResolution.achieved += summary.timeToResolution.achieved;
          totals.sla.timeToResolution.breached += summary.timeToResolution.breached;
        }
      });

      return {
        statusCode: HttpStatus.OK,
        message: 'Dashboard summary retrieved successfully',
        data: {
          byClient: {
            tickets: aggregatedTickets,
            sla: aggregatedSLA,
          },
          totals,
        },
      };
    } catch (error) {
      this.logger.error('Error fetching dashboard summary:', error);
      throw error;
    }
  }

  /**
   * Get recent tickets across all clients
   * GET /integrations/jira/tickets/recent
   * Requires: Any authenticated user
   */
  @Get('tickets/recent')
  @HttpCode(HttpStatus.OK)
  async getRecentTickets(@Query('limit') limit?: string) {
    const ticketLimit = limit ? parseInt(limit, 10) : 20;
    this.logger.log(`Fetching ${ticketLimit} recent tickets`);
    
    try {
      const tickets = await firstValueFrom(
        this.jiraService.getRecentTickets(ticketLimit)
      );
      
      return {
        statusCode: HttpStatus.OK,
        message: 'Recent tickets retrieved successfully',
        data: tickets,
        meta: {
          count: tickets.length,
          limit: ticketLimit,
        },
      };
    } catch (error) {
      this.logger.error('Error fetching recent tickets:', error);
      throw error;
    }
  }

  /**
   * Get high priority tickets
   * GET /integrations/jira/tickets/high-priority
   * Requires: Any authenticated user
   */
  @Get('tickets/high-priority')
  @HttpCode(HttpStatus.OK)
  async getHighPriorityTickets(@Query('clientId') clientId?: string) {
    this.logger.log(`Fetching high priority tickets${clientId ? ` for client: ${clientId}` : ''}`);
    
    try {
      const tickets = await firstValueFrom(
        this.jiraService.getHighPriorityTickets(clientId)
      );
      
      return {
        statusCode: HttpStatus.OK,
        message: 'High priority tickets retrieved successfully',
        data: tickets,
        meta: {
          count: tickets.length,
          filtered: !!clientId,
        },
      };
    } catch (error) {
      this.logger.error('Error fetching high priority tickets:', error);
      throw error;
    }
  }

  /**
   * Get SLA breached tickets
   * GET /integrations/jira/tickets/sla-breached
   * Requires: Any authenticated user
   */
  @Get('tickets/sla-breached')
  @HttpCode(HttpStatus.OK)
  async getSLABreachedTickets(@Query('clientId') clientId?: string) {
    this.logger.log(`Fetching SLA breached tickets${clientId ? ` for client: ${clientId}` : ''}`);
    
    try {
      const tickets = await firstValueFrom(
        this.jiraService.getSLABreachedTickets(clientId)
      );
      
      return {
        statusCode: HttpStatus.OK,
        message: 'SLA breached tickets retrieved successfully',
        data: tickets,
        meta: {
          count: tickets.length,
          filtered: !!clientId,
        },
      };
    } catch (error) {
      this.logger.error('Error fetching SLA breached tickets:', error);
      throw error;
    }
  }

  /**
   * Get tickets by status
   * GET /integrations/jira/tickets/by-status/:status
   * Requires: Any authenticated user
   */
  @Get('tickets/by-status/:status')
  @HttpCode(HttpStatus.OK)
  async getTicketsByStatus(
    @Param('status') status: string,
    @Query('clientId') clientId?: string
  ) {
    this.logger.log(`Fetching tickets with status: ${status}${clientId ? ` for client: ${clientId}` : ''}`);
    
    try {
      const tickets = await firstValueFrom(
        this.jiraService.getTicketsByStatus(status, clientId)
      );
      
      return {
        statusCode: HttpStatus.OK,
        message: `Tickets with status '${status}' retrieved successfully`,
        data: tickets,
        meta: {
          count: tickets.length,
          status,
          filtered: !!clientId,
        },
      };
    } catch (error) {
      this.logger.error(`Error fetching tickets by status ${status}:`, error);
      throw error;
    }
  }

  /**
   * Health check for Jira integration
   * GET /integrations/jira/health
   * Requires: Any authenticated user
   */
  @Get('health')
  @HttpCode(HttpStatus.OK)
  async checkHealth() {
    this.logger.log('Checking Jira integration health');
    
    try {
      // Try to search for a minimal set of issues
      await firstValueFrom(
        this.jiraService.searchIssues('ORDER BY created DESC', ['id'], 1)
      );
      
      return {
        statusCode: HttpStatus.OK,
        message: 'Jira integration is healthy',
        data: {
          status: 'operational',
          integration: 'Jira',
          timestamp: new Date().toISOString(),
        },
      };
    } catch (error) {
      return {
        statusCode: HttpStatus.SERVICE_UNAVAILABLE,
        message: 'Jira integration is unhealthy',
        data: {
          status: 'error',
          integration: 'Jira',
          error: error.message,
          timestamp: new Date().toISOString(),
        },
      };
    }
  }
} 