import { Injectable } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { Observable, forkJoin } from 'rxjs';
import { map } from 'rxjs/operators';
import { BaseIntegrationService } from './base-integration.service';
import { IntegrationConfigService } from './integration-config.service';

// Jira API response interfaces
export interface JiraIssue {
  id: string;
  key: string;
  fields: {
    summary: string;
    status: {
      name: string;
      statusCategory: {
        key: string;
        colorName: string;
        name: string;
      };
    };
    priority: {
      name: string;
      iconUrl: string;
    };
    issuetype: {
      name: string;
      iconUrl: string;
    };
    reporter?: {
      displayName: string;
      emailAddress: string;
    };
    assignee?: {
      displayName: string;
      emailAddress: string;
    };
    created: string;
    updated: string;
    resolutiondate?: string;
    // SLA fields (if Jira Service Management is used)
    customfield_10030?: { // Time to First Response
      completedCycles?: Array<{
        breached: boolean;
        elapsedTime: {
          millis: number;
          friendly: string;
        };
        goalDuration: {
          millis: number;
          friendly: string;
        };
      }>;
      ongoingCycle?: {
        breachTime: {
          epochMillis: number;
          friendly: string;
        };
        elapsedTime: {
          millis: number;
          friendly: string;
        };
        goalDuration: {
          millis: number;
          friendly: string;
        };
      };
    };
    customfield_10031?: { // Time to Resolution
      completedCycles?: Array<{
        breached: boolean;
        elapsedTime: {
          millis: number;
          friendly: string;
        };
        goalDuration: {
          millis: number;
          friendly: string;
        };
      }>;
      ongoingCycle?: {
        breachTime: {
          epochMillis: number;
          friendly: string;
        };
        elapsedTime: {
          millis: number;
          friendly: string;
        };
        goalDuration: {
          millis: number;
          friendly: string;
        };
      };
    };
    // Custom field for client mapping
    customfield_10050?: string; // Client ID field
  };
}

export interface JiraSearchResponse {
  expand: string;
  startAt: number;
  maxResults: number;
  total: number;
  issues: JiraIssue[];
}

export interface JiraProject {
  id: string;
  key: string;
  name: string;
  projectTypeKey: string;
}

export interface TicketSummary {
  clientId?: string;
  totalTickets: number;
  openTickets: number;
  inProgressTickets: number;
  resolvedTickets: number;
  byPriority: Record<string, number>;
  byType: Record<string, number>;
}

export interface SLASummary {
  clientId?: string;
  timeToFirstResponse: {
    achieved: number;
    breached: number;
    achievementRate: number;
    averageTime: number;
  };
  timeToResolution: {
    achieved: number;
    breached: number;
    achievementRate: number;
    averageTime: number;
  };
}

/**
 * JiraService
 * Integration with Jira for fetching ticket and SLA data
 * Extends BaseIntegrationService for common HTTP functionality
 */
@Injectable()
export class JiraService extends BaseIntegrationService {
  constructor(
    httpService: HttpService,
    private readonly integrationConfigService: IntegrationConfigService,
  ) {
    super(httpService, 'Jira');
    
    // Initialize with Jira configuration
    const config = this.integrationConfigService.getIntegrationConfig('jira');
    this.setConfig(config);
  }

  /**
   * Search for Jira issues using JQL
   * @param jql - Jira Query Language string
   * @param fields - Fields to retrieve
   * @param maxResults - Maximum number of results
   * @returns Observable of search results
   */
  searchIssues(
    jql: string,
    fields: string[] = ['summary', 'status', 'priority', 'issuetype', 'reporter', 'assignee', 'created', 'updated', 'resolutiondate'],
    maxResults: number = 100,
  ): Observable<JiraSearchResponse> {
    return this.get<JiraSearchResponse>('/rest/api/3/search', {
      params: {
        jql,
        fields: fields.join(','),
        maxResults,
      },
    });
  }

  /**
   * Get issues for a specific client
   * @param clientId - Client ID (mapped to custom field)
   * @returns Observable of issues
   */
  getClientIssues(clientId: string): Observable<JiraIssue[]> {
    // Assuming customfield_10050 is used to store client ID
    const jql = `"cf[10050]" = "${clientId}" ORDER BY created DESC`;
    
    return this.searchIssues(jql, undefined, 200).pipe(
      map(response => response.issues),
    );
  }

  /**
   * Get issues for multiple clients
   * @param clientIds - Array of client IDs
   * @returns Observable of issues grouped by client
   */
  getMultipleClientsIssues(clientIds: string[]): Observable<Record<string, JiraIssue[]>> {
    const requests = clientIds.map(clientId =>
      this.getClientIssues(clientId).pipe(
        map(issues => ({ clientId, issues })),
      ),
    );

    return forkJoin(requests).pipe(
      map(results => {
        const grouped: Record<string, JiraIssue[]> = {};
        results.forEach(({ clientId, issues }) => {
          grouped[clientId] = issues;
        });
        return grouped;
      }),
    );
  }

  /**
   * Get ticket summary for a client
   * @param clientId - Client ID
   * @returns Observable of ticket summary
   */
  getClientTicketSummary(clientId: string): Observable<TicketSummary> {
    return this.getClientIssues(clientId).pipe(
      map(issues => this.calculateTicketSummary(issues, clientId)),
    );
  }

  /**
   * Get SLA summary for a client
   * @param clientId - Client ID
   * @returns Observable of SLA summary
   */
  getClientSLASummary(clientId: string): Observable<SLASummary> {
    // Include SLA custom fields
    const jql = `"cf[10050]" = "${clientId}" AND (cf[10030] is not EMPTY OR cf[10031] is not EMPTY)`;
    const fields = ['customfield_10030', 'customfield_10031'];
    
    return this.searchIssues(jql, fields, 200).pipe(
      map(response => this.calculateSLASummary(response.issues, clientId)),
    );
  }

  /**
   * Get recent tickets across all clients
   * @param limit - Number of tickets to retrieve
   * @returns Observable of recent tickets
   */
  getRecentTickets(limit: number = 50): Observable<JiraIssue[]> {
    const jql = 'ORDER BY created DESC';
    
    return this.searchIssues(jql, undefined, limit).pipe(
      map(response => response.issues),
    );
  }

  /**
   * Get tickets by status
   * @param status - Status name
   * @param clientId - Optional client ID filter
   * @returns Observable of tickets
   */
  getTicketsByStatus(status: string, clientId?: string): Observable<JiraIssue[]> {
    let jql = `status = "${status}"`;
    if (clientId) {
      jql = `"cf[10050]" = "${clientId}" AND ${jql}`;
    }
    jql += ' ORDER BY priority DESC, created DESC';
    
    return this.searchIssues(jql).pipe(
      map(response => response.issues),
    );
  }

  /**
   * Get high priority tickets
   * @param clientId - Optional client ID filter
   * @returns Observable of high priority tickets
   */
  getHighPriorityTickets(clientId?: string): Observable<JiraIssue[]> {
    let jql = 'priority in (Highest, High) AND status != Resolved';
    if (clientId) {
      jql = `"cf[10050]" = "${clientId}" AND ${jql}`;
    }
    jql += ' ORDER BY priority DESC, created DESC';
    
    return this.searchIssues(jql).pipe(
      map(response => response.issues),
    );
  }

  /**
   * Get SLA breached tickets
   * @param clientId - Optional client ID filter
   * @returns Observable of breached tickets
   */
  getSLABreachedTickets(clientId?: string): Observable<JiraIssue[]> {
    let jql = '("Time to First Response" = breached() OR "Time to Resolution" = breached())';
    if (clientId) {
      jql = `"cf[10050]" = "${clientId}" AND ${jql}`;
    }
    jql += ' ORDER BY created DESC';
    
    const fields = ['summary', 'status', 'priority', 'created', 'customfield_10030', 'customfield_10031'];
    
    return this.searchIssues(jql, fields).pipe(
      map(response => response.issues),
    );
  }

  /**
   * Calculate ticket summary from issues
   * @param issues - Array of Jira issues
   * @param clientId - Client ID
   * @returns Ticket summary
   */
  private calculateTicketSummary(issues: JiraIssue[], clientId?: string): TicketSummary {
    const summary: TicketSummary = {
      clientId,
      totalTickets: issues.length,
      openTickets: 0,
      inProgressTickets: 0,
      resolvedTickets: 0,
      byPriority: {},
      byType: {},
    };

    issues.forEach(issue => {
      // Count by status category
      const statusCategory = issue.fields.status.statusCategory.key;
      if (statusCategory === 'new') {
        summary.openTickets++;
      } else if (statusCategory === 'indeterminate') {
        summary.inProgressTickets++;
      } else if (statusCategory === 'done') {
        summary.resolvedTickets++;
      }

      // Count by priority
      const priority = issue.fields.priority.name;
      summary.byPriority[priority] = (summary.byPriority[priority] || 0) + 1;

      // Count by type
      const type = issue.fields.issuetype.name;
      summary.byType[type] = (summary.byType[type] || 0) + 1;
    });

    return summary;
  }

  /**
   * Calculate SLA summary from issues
   * @param issues - Array of Jira issues with SLA fields
   * @param clientId - Client ID
   * @returns SLA summary
   */
  private calculateSLASummary(issues: JiraIssue[], clientId?: string): SLASummary {
    const summary: SLASummary = {
      clientId,
      timeToFirstResponse: {
        achieved: 0,
        breached: 0,
        achievementRate: 0,
        averageTime: 0,
      },
      timeToResolution: {
        achieved: 0,
        breached: 0,
        achievementRate: 0,
        averageTime: 0,
      },
    };

    let ttfrTotalTime = 0;
    let ttfrCount = 0;
    let ttrTotalTime = 0;
    let ttrCount = 0;

    issues.forEach(issue => {
      // Time to First Response
      const ttfr = issue.fields.customfield_10030;
      if (ttfr?.completedCycles && ttfr.completedCycles.length > 0) {
        const cycle = ttfr.completedCycles[0];
        if (cycle.breached) {
          summary.timeToFirstResponse.breached++;
        } else {
          summary.timeToFirstResponse.achieved++;
        }
        ttfrTotalTime += cycle.elapsedTime.millis;
        ttfrCount++;
      }

      // Time to Resolution
      const ttr = issue.fields.customfield_10031;
      if (ttr?.completedCycles && ttr.completedCycles.length > 0) {
        const cycle = ttr.completedCycles[0];
        if (cycle.breached) {
          summary.timeToResolution.breached++;
        } else {
          summary.timeToResolution.achieved++;
        }
        ttrTotalTime += cycle.elapsedTime.millis;
        ttrCount++;
      }
    });

    // Calculate achievement rates and average times
    if (ttfrCount > 0) {
      summary.timeToFirstResponse.achievementRate = 
        (summary.timeToFirstResponse.achieved / ttfrCount) * 100;
      summary.timeToFirstResponse.averageTime = ttfrTotalTime / ttfrCount;
    }

    if (ttrCount > 0) {
      summary.timeToResolution.achievementRate = 
        (summary.timeToResolution.achieved / ttrCount) * 100;
      summary.timeToResolution.averageTime = ttrTotalTime / ttrCount;
    }

    return summary;
  }
} 