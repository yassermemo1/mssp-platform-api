import { Injectable, NotFoundException, BadRequestException, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Client } from '../../../entities';
import { DynamicDataFetcherService } from '../../integrations/services/dynamic-data-fetcher.service';
import { JiraTicketDto } from '../dto/jira-ticket.dto';
import { TicketCountDto } from '../dto/ticket-count.dto';
import { SLASummaryDto } from '../dto/sla-summary.dto';

/**
 * JiraDataService
 * Service layer for fetching and processing Jira data using the Dynamic Data Framework
 */
@Injectable()
export class JiraDataService {
  private readonly logger = new Logger(JiraDataService.name);

  constructor(
    @InjectRepository(Client)
    private clientRepository: Repository<Client>,
    private dynamicDataFetcher: DynamicDataFetcherService
  ) {}

  /**
   * Get ticket counts for a client
   */
  async getClientTicketCounts(clientId: string): Promise<TicketCountDto> {
    const client = await this.getClientWithJiraKey(clientId);
    
    try {
      // Fetch counts for different statuses
      const [totalCount, openCount, inProgressCount, resolvedCount, closedCount] = await Promise.all([
        this.fetchTicketCount(client.jiraProjectKey, {}),
        this.fetchTicketCount(client.jiraProjectKey, { statusCategory: 'To Do' }),
        this.fetchTicketCount(client.jiraProjectKey, { statusCategory: 'In Progress' }),
        this.fetchTicketCount(client.jiraProjectKey, { status: 'Resolved' }),
        this.fetchTicketCount(client.jiraProjectKey, { status: 'Closed' })
      ]);

      // Fetch counts by priority
      const [criticalCount, highCount, mediumCount, lowCount] = await Promise.all([
        this.fetchTicketCountByPriority(client.jiraProjectKey, 'Critical'),
        this.fetchTicketCountByPriority(client.jiraProjectKey, 'High'),
        this.fetchTicketCountByPriority(client.jiraProjectKey, 'Medium'),
        this.fetchTicketCountByPriority(client.jiraProjectKey, 'Low')
      ]);

      // Fetch open critical tickets (as proxy for breached)
      const openCriticalCount = await this.dynamicDataFetcher.fetchData('getJiraOpenCriticalTickets', {
        clientJiraProjectKey: client.jiraProjectKey
      });

      return {
        total: totalCount,
        byStatus: {
          open: openCount,
          inProgress: inProgressCount,
          resolved: resolvedCount,
          closed: closedCount,
          onHold: 0 // Calculate if you have a specific status for this
        },
        byPriority: {
          critical: criticalCount,
          high: highCount,
          medium: mediumCount,
          low: lowCount
        },
        byType: {
          bug: 0, // Would need separate queries by issue type
          incident: 0,
          serviceRequest: 0,
          change: 0,
          other: 0
        },
        breached: {
          total: openCriticalCount, // Simplified - actual SLA breach calculation would be more complex
          responseTime: 0,
          resolutionTime: 0
        }
      };
    } catch (error) {
      this.logger.error(`Failed to fetch ticket counts for client ${clientId}`, error);
      throw new BadRequestException('Failed to fetch Jira ticket counts');
    }
  }

  /**
   * Get detailed tickets for a client with filters and pagination
   */
  async getClientTicketsDetailed(
    clientId: string,
    filters: {
      statusCategory?: string;
      priority?: string;
    },
    pagination: {
      maxResults: number;
      startAt: number;
    }
  ): Promise<{ tickets: JiraTicketDto[]; total: number }> {
    const client = await this.getClientWithJiraKey(clientId);

    try {
      // Fetch total count for pagination
      const totalCount = await this.dynamicDataFetcher.fetchData('getJiraTicketTotal', {
        clientJiraProjectKey: client.jiraProjectKey,
        statusCategory: filters.statusCategory || 'any'
      });

      // Fetch detailed tickets
      const issues = await this.dynamicDataFetcher.fetchData('getJiraTicketsDetailed', {
        clientJiraProjectKey: client.jiraProjectKey,
        statusCategory: filters.statusCategory || 'any',
        maxResults: pagination.maxResults,
        startAt: pagination.startAt
      });

      // Map Jira issues to our DTO
      const tickets = this.mapJiraIssuesToTickets(issues);

      return {
        tickets,
        total: totalCount
      };
    } catch (error) {
      this.logger.error(`Failed to fetch detailed tickets for client ${clientId}`, error);
      throw new BadRequestException('Failed to fetch Jira tickets');
    }
  }

  /**
   * Get SLA summary for a client
   */
  async getClientSLASummary(clientId: string): Promise<SLASummaryDto> {
    const client = await this.getClientWithJiraKey(clientId);

    try {
      // Fetch tickets with SLA data
      const slaTickets = await this.dynamicDataFetcher.fetchData('getJiraTicketsWithSLA', {
        clientJiraProjectKey: client.jiraProjectKey,
        maxResults: 1000, // Get a reasonable sample
        startAt: 0
      });

      // Process SLA data
      const slaSummary = this.calculateSLASummary(slaTickets);

      // Fetch trend data
      const [recentCreated7, recentResolved7, recentCreated30, recentResolved30] = await Promise.all([
        this.fetchRecentTickets(client.jiraProjectKey, 7),
        this.fetchResolvedTickets(client.jiraProjectKey, 7),
        this.fetchRecentTickets(client.jiraProjectKey, 30),
        this.fetchResolvedTickets(client.jiraProjectKey, 30)
      ]);

      return {
        ...slaSummary,
        trends: {
          last7Days: {
            ticketsCreated: recentCreated7,
            ticketsResolved: recentResolved7,
            slaBreaches: slaSummary.timeToFirstResponse.currentlyBreached // Simplified
          },
          last30Days: {
            ticketsCreated: recentCreated30,
            ticketsResolved: recentResolved30,
            slaBreaches: slaSummary.timeToFirstResponse.currentlyBreached * 4 // Simplified estimate
          }
        }
      };
    } catch (error) {
      this.logger.error(`Failed to fetch SLA summary for client ${clientId}`, error);
      throw new BadRequestException('Failed to fetch Jira SLA summary');
    }
  }

  /**
   * Get global ticket summary across all clients
   */
  async getGlobalTicketSummary(): Promise<any> {
    // This would aggregate data across all clients with Jira integration
    // For now, return a placeholder
    return {
      totalTickets: 0,
      openTickets: 0,
      criticalTickets: 0,
      slaBreaches: 0,
      message: 'Global summary requires implementation of cross-client aggregation'
    };
  }

  // Helper methods

  private async getClientWithJiraKey(clientId: string): Promise<Client> {
    const client = await this.clientRepository.findOne({ where: { id: clientId } });
    
    if (!client) {
      throw new NotFoundException('Client not found');
    }

    if (!client.jiraProjectKey) {
      throw new BadRequestException('Client does not have Jira integration configured');
    }

    return client;
  }

  private async fetchTicketCount(
    jiraProjectKey: string,
    additionalFilters: Record<string, string> = {}
  ): Promise<number> {
    return await this.dynamicDataFetcher.fetchData('getJiraTicketCountsByStatus', {
      clientJiraProjectKey: jiraProjectKey,
      ...additionalFilters
    });
  }

  private async fetchTicketCountByPriority(
    jiraProjectKey: string,
    priority: string
  ): Promise<number> {
    return await this.dynamicDataFetcher.fetchData('getJiraTicketsByPriority', {
      clientJiraProjectKey: jiraProjectKey,
      priority
    });
  }

  private async fetchRecentTickets(jiraProjectKey: string, days: number): Promise<number> {
    return await this.dynamicDataFetcher.fetchData('getJiraRecentTickets', {
      clientJiraProjectKey: jiraProjectKey,
      days
    });
  }

  private async fetchResolvedTickets(jiraProjectKey: string, days: number): Promise<number> {
    return await this.dynamicDataFetcher.fetchData('getJiraResolvedTickets', {
      clientJiraProjectKey: jiraProjectKey,
      days
    });
  }

  private mapJiraIssuesToTickets(issues: any[]): JiraTicketDto[] {
    return issues.map(issue => {
      const fields = issue.fields || {};
      
      return {
        key: issue.key,
        id: issue.id,
        summary: fields.summary,
        status: fields.status,
        priority: fields.priority,
        issueType: fields.issuetype,
        assignee: fields.assignee,
        reporter: fields.reporter,
        created: fields.created,
        updated: fields.updated,
        resolutionDate: fields.resolutiondate,
        slaFields: {
          timeToFirstResponse: this.extractSLAField(fields.customfield_10005),
          timeToResolution: this.extractSLAField(fields.customfield_10006)
        }
      };
    });
  }

  private extractSLAField(slaFieldData: any): any {
    if (!slaFieldData) return undefined;

    // Jira Service Management SLA fields have a complex structure
    // This is a simplified extraction - adjust based on your actual field structure
    return {
      ongoingCycle: slaFieldData.ongoingCycle,
      completedCycles: slaFieldData.completedCycles
    };
  }

  private calculateSLASummary(tickets: any[]): Omit<SLASummaryDto, 'trends'> {
    let responseBreached = 0;
    let responseAtRisk = 0;
    let resolutionBreached = 0;
    let resolutionAtRisk = 0;
    let totalResponseTime = 0;
    let totalResolutionTime = 0;
    let responseCount = 0;
    let resolutionCount = 0;

    const priorityCounts = {
      critical: { total: 0, breached: 0, averageResponseTime: 0, averageResolutionTime: 0 },
      high: { total: 0, breached: 0, averageResponseTime: 0, averageResolutionTime: 0 },
      medium: { total: 0, breached: 0, averageResponseTime: 0, averageResolutionTime: 0 },
      low: { total: 0, breached: 0, averageResponseTime: 0, averageResolutionTime: 0 }
    };

    tickets.forEach(issue => {
      const fields = issue.fields || {};
      const priority = (fields.priority?.name || 'Medium').toLowerCase();
      const priorityKey = priority in priorityCounts ? priority : 'medium';

      priorityCounts[priorityKey].total++;

      // Process Time to First Response SLA
      if (fields.customfield_10005?.ongoingCycle) {
        const cycle = fields.customfield_10005.ongoingCycle;
        responseCount++;

        if (cycle.breachTime && new Date(cycle.breachTime.epochMillis) < new Date()) {
          responseBreached++;
          priorityCounts[priorityKey].breached++;
        } else if (cycle.remainingTime?.millis < cycle.goalDuration?.millis * 0.1) {
          responseAtRisk++;
        }

        if (cycle.elapsedTime?.millis) {
          totalResponseTime += cycle.elapsedTime.millis;
          priorityCounts[priorityKey].averageResponseTime += cycle.elapsedTime.millis;
        }
      }

      // Process Time to Resolution SLA
      if (fields.customfield_10006?.ongoingCycle) {
        const cycle = fields.customfield_10006.ongoingCycle;
        resolutionCount++;

        if (cycle.breachTime && new Date(cycle.breachTime.epochMillis) < new Date()) {
          resolutionBreached++;
        } else if (cycle.remainingTime?.millis < cycle.goalDuration?.millis * 0.1) {
          resolutionAtRisk++;
        }

        if (cycle.elapsedTime?.millis) {
          totalResolutionTime += cycle.elapsedTime.millis;
          priorityCounts[priorityKey].averageResolutionTime += cycle.elapsedTime.millis;
        }
      }
    });

    // Calculate averages and compliance rates
    const avgResponseTime = responseCount > 0 ? totalResponseTime / responseCount : 0;
    const avgResolutionTime = resolutionCount > 0 ? totalResolutionTime / resolutionCount : 0;
    const responseComplianceRate = responseCount > 0 ? ((responseCount - responseBreached) / responseCount) * 100 : 100;
    const resolutionComplianceRate = resolutionCount > 0 ? ((resolutionCount - resolutionBreached) / resolutionCount) * 100 : 100;

    // Calculate priority averages
    Object.keys(priorityCounts).forEach(key => {
      const counts = priorityCounts[key];
      if (counts.total > 0) {
        counts.averageResponseTime = counts.averageResponseTime / counts.total;
        counts.averageResolutionTime = counts.averageResolutionTime / counts.total;
      }
    });

    return {
      totalTickets: tickets.length,
      timeToFirstResponse: {
        totalMeasured: responseCount,
        currentlyBreached: responseBreached,
        atRisk: responseAtRisk,
        averageResponseTime: avgResponseTime,
        complianceRate: responseComplianceRate
      },
      timeToResolution: {
        totalMeasured: resolutionCount,
        currentlyBreached: resolutionBreached,
        atRisk: resolutionAtRisk,
        averageResolutionTime: avgResolutionTime,
        complianceRate: resolutionComplianceRate
      },
      byPriority: priorityCounts
    };
  }
} 