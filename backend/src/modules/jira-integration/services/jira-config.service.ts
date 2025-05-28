import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ExternalDataSourceService } from '../../integrations/services/external-data-source.service';
import { DataSourceQueryService } from '../../integrations/services/data-source-query.service';
import { ExternalSystemType, ExternalApiAuthenticationType, HttpMethod, ExpectedResponseType } from '../../../enums';

/**
 * JiraConfigService
 * Ensures Jira DC data source and queries are properly configured
 * This is a programmatic setup until admin UI is available
 */
@Injectable()
export class JiraConfigService {
  private readonly logger = new Logger(JiraConfigService.name);
  private jiraDataSourceId: string | null = null;

  constructor(
    private configService: ConfigService,
    private dataSourceService: ExternalDataSourceService,
    private queryService: DataSourceQueryService
  ) {}

  /**
   * Initialize Jira configuration on application startup
   */
  async onModuleInit() {
    await this.ensureJiraDataSource();
    await this.ensureJiraQueries();
  }

  /**
   * Ensure Jira DC data source exists
   */
  private async ensureJiraDataSource(): Promise<void> {
    try {
      // Check if Jira data source already exists
      const dataSources = await this.dataSourceService.findAll();
      const existingJira = dataSources.find(ds => ds.systemType === ExternalSystemType.JIRA_DC);

      if (existingJira) {
        this.jiraDataSourceId = existingJira.id;
        this.logger.log('Jira data source already exists');
        return;
      }

      // Get Jira configuration from environment
      const jiraUrl = this.configService.get<string>('JIRA_BASE_URL');
      const jiraUsername = this.configService.get<string>('JIRA_USERNAME');
      const jiraApiToken = this.configService.get<string>('JIRA_API_TOKEN');

      if (!jiraUrl || !jiraUsername || !jiraApiToken) {
        this.logger.warn('Jira configuration missing in environment variables. Skipping setup.');
        return;
      }

      // Create Jira data source
      const dataSource = await this.dataSourceService.create({
        name: 'Jira DC Production Instance',
        systemType: ExternalSystemType.JIRA_DC,
        baseUrl: jiraUrl,
        authenticationType: ExternalApiAuthenticationType.BASIC_AUTH_USERNAME_PASSWORD,
        credentials: {
          username: jiraUsername,
          password: jiraApiToken // Jira uses API tokens as passwords for basic auth
        },
        defaultHeaders: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        description: 'Production Jira Data Center instance for ticket and SLA tracking',
        isActive: true
      });

      this.jiraDataSourceId = dataSource.id;
      this.logger.log('Jira data source created successfully');

    } catch (error) {
      this.logger.error('Failed to ensure Jira data source', error);
    }
  }

  /**
   * Ensure all required Jira queries exist
   */
  private async ensureJiraQueries(): Promise<void> {
    if (!this.jiraDataSourceId) {
      this.logger.warn('No Jira data source available. Skipping query setup.');
      return;
    }

    const queries = [
      // Query 1: Get ticket counts by status
      {
        queryName: 'getJiraTicketCountsByStatus',
        description: 'Get ticket counts grouped by status for a client project',
        endpointPath: '/rest/api/2/search',
        httpMethod: HttpMethod.GET,
        queryTemplate: 'jql=project = "{clientJiraProjectKey}"&fields=status&maxResults=0',
        responseExtractionPath: '$.total',
        expectedResponseType: ExpectedResponseType.NUMBER,
        cacheTTLSeconds: 300,
        notes: 'Returns total count only. Run multiple queries with status filters for breakdown.'
      },

      // Query 2: Get detailed tickets with pagination
      {
        queryName: 'getJiraTicketsDetailed',
        description: 'Get detailed ticket list with all fields for a client project',
        endpointPath: '/rest/api/2/search',
        httpMethod: HttpMethod.GET,
        queryTemplate: 'jql=project = "{clientJiraProjectKey}" AND statusCategory = "{statusCategory}" ORDER BY priority DESC, created ASC&fields=key,summary,status,priority,issuetype,assignee,reporter,created,updated,resolutiondate,customfield_10005,customfield_10006&maxResults={maxResults}&startAt={startAt}',
        responseExtractionPath: '$.issues',
        expectedResponseType: ExpectedResponseType.JSON_ARRAY,
        cacheTTLSeconds: 60,
        notes: 'customfield_10005 = Time to First Response SLA, customfield_10006 = Time to Resolution SLA'
      },

      // Query 3: Get total ticket count for pagination
      {
        queryName: 'getJiraTicketTotal',
        description: 'Get total ticket count for a client project',
        endpointPath: '/rest/api/2/search',
        httpMethod: HttpMethod.GET,
        queryTemplate: 'jql=project = "{clientJiraProjectKey}" AND statusCategory = "{statusCategory}"&maxResults=0',
        responseExtractionPath: '$.total',
        expectedResponseType: ExpectedResponseType.NUMBER,
        cacheTTLSeconds: 300
      },

      // Query 4: Get open critical tickets
      {
        queryName: 'getJiraOpenCriticalTickets',
        description: 'Get count of open critical priority tickets',
        endpointPath: '/rest/api/2/search',
        httpMethod: HttpMethod.GET,
        queryTemplate: 'jql=project = "{clientJiraProjectKey}" AND statusCategory != Done AND priority = Critical&fields=key&maxResults=0',
        responseExtractionPath: '$.total',
        expectedResponseType: ExpectedResponseType.NUMBER,
        cacheTTLSeconds: 60
      },

      // Query 5: Get tickets with SLA data
      {
        queryName: 'getJiraTicketsWithSLA',
        description: 'Get tickets with SLA information for analysis',
        endpointPath: '/rest/api/2/search',
        httpMethod: HttpMethod.GET,
        queryTemplate: 'jql=project = "{clientJiraProjectKey}" AND ("Time to First Response" is not EMPTY OR "Time to Resolution" is not EMPTY)&fields=key,priority,status,created,updated,resolutiondate,customfield_10005,customfield_10006&maxResults={maxResults}&startAt={startAt}',
        responseExtractionPath: '$.issues',
        expectedResponseType: ExpectedResponseType.JSON_ARRAY,
        cacheTTLSeconds: 300,
        notes: 'Fetches tickets that have SLA fields populated'
      },

      // Query 6: Get tickets by priority
      {
        queryName: 'getJiraTicketsByPriority',
        description: 'Get ticket count for a specific priority',
        endpointPath: '/rest/api/2/search',
        httpMethod: HttpMethod.GET,
        queryTemplate: 'jql=project = "{clientJiraProjectKey}" AND priority = "{priority}"&fields=key&maxResults=0',
        responseExtractionPath: '$.total',
        expectedResponseType: ExpectedResponseType.NUMBER,
        cacheTTLSeconds: 300
      },

      // Query 7: Get recently created tickets
      {
        queryName: 'getJiraRecentTickets',
        description: 'Get tickets created in the last N days',
        endpointPath: '/rest/api/2/search',
        httpMethod: HttpMethod.GET,
        queryTemplate: 'jql=project = "{clientJiraProjectKey}" AND created >= -{days}d&fields=key,created&maxResults=0',
        responseExtractionPath: '$.total',
        expectedResponseType: ExpectedResponseType.NUMBER,
        cacheTTLSeconds: 300
      },

      // Query 8: Get resolved tickets in date range
      {
        queryName: 'getJiraResolvedTickets',
        description: 'Get tickets resolved in the last N days',
        endpointPath: '/rest/api/2/search',
        httpMethod: HttpMethod.GET,
        queryTemplate: 'jql=project = "{clientJiraProjectKey}" AND resolved >= -{days}d&fields=key,resolutiondate&maxResults=0',
        responseExtractionPath: '$.total',
        expectedResponseType: ExpectedResponseType.NUMBER,
        cacheTTLSeconds: 300
      }
    ];

    // Create queries that don't exist
    for (const queryConfig of queries) {
      try {
        const existingQueries = await this.queryService.findAll(this.jiraDataSourceId);
        const exists = existingQueries.some(q => q.queryName === queryConfig.queryName);

        if (!exists) {
          await this.queryService.create({
            ...queryConfig,
            dataSourceId: this.jiraDataSourceId,
            isActive: true
          });
          this.logger.log(`Created Jira query: ${queryConfig.queryName}`);
        }
      } catch (error) {
        this.logger.error(`Failed to create query ${queryConfig.queryName}`, error);
      }
    }
  }

  /**
   * Get the configured Jira data source ID
   */
  getJiraDataSourceId(): string | null {
    return this.jiraDataSourceId;
  }
} 