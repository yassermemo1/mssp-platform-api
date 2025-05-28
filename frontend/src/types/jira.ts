/**
 * Jira Integration TypeScript Types
 * Based on backend DTOs for Jira ticket and SLA data
 */

export interface JiraTicket {
  key: string;
  id: string;
  summary: string;
  status: {
    name: string;
    statusCategory: {
      key: string;
      name: string;
    };
  };
  priority: {
    name: string;
    id: string;
  };
  issueType: {
    name: string;
    id: string;
  };
  assignee?: {
    displayName: string;
    emailAddress: string;
    accountId: string;
  };
  reporter: {
    displayName: string;
    emailAddress: string;
    accountId: string;
  };
  created: string;
  updated: string;
  resolutionDate?: string;
  slaFields?: {
    timeToFirstResponse?: SLAField;
    timeToResolution?: SLAField;
  };
}

export interface JiraIssue {
  key: string;
  id: string;
  fields: {
    summary: string;
    status: {
      name: string;
      statusCategory: {
        key: string;
        name: string;
      };
    };
    priority: {
      name: string;
      id: string;
    };
    issuetype: {
      name: string;
      id: string;
    };
    assignee?: {
      displayName: string;
      emailAddress: string;
      accountId: string;
    };
    reporter: {
      displayName: string;
      emailAddress: string;
      accountId: string;
    };
    created: string;
    updated: string;
    resolutiondate?: string;
  };
}

export interface SLAField {
  ongoingCycle?: {
    breachTime?: {
      epochMillis: number;
      friendly: string;
    };
    remainingTime?: {
      millis: number;
      friendly: string;
    };
    elapsedTime?: {
      millis: number;
      friendly: string;
    };
    goalDuration?: {
      millis: number;
      friendly: string;
    };
    startTime?: {
      epochMillis: number;
      friendly: string;
    };
    paused: boolean;
    withinCalendarHours: boolean;
  };
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
    remainingTime: {
      millis: number;
      friendly: string;
    };
    startTime: {
      epochMillis: number;
      friendly: string;
    };
    stopTime: {
      epochMillis: number;
      friendly: string;
    };
  }>;
}

export interface TicketCounts {
  total: number;
  byStatus: {
    open: number;
    inProgress: number;
    resolved: number;
    closed: number;
    onHold: number;
  };
  byPriority: {
    critical: number;
    high: number;
    medium: number;
    low: number;
  };
  byType: {
    bug: number;
    incident: number;
    serviceRequest: number;
    change: number;
    other: number;
  };
  breached: {
    total: number;
    responseTime: number;
    resolutionTime: number;
  };
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
  timeToFirstResponse: {
    achieved: number;
    breached: number;
    achievementRate: number;
    averageTime: number;
    // Additional properties for detailed widgets
    totalMeasured?: number;
    currentlyBreached?: number;
    atRisk?: number;
    averageResponseTime?: number;
    complianceRate?: number;
  };
  timeToResolution: {
    achieved: number;
    breached: number;
    achievementRate: number;
    averageTime: number;
    // Additional properties for detailed widgets
    totalMeasured?: number;
    currentlyBreached?: number;
    atRisk?: number;
    averageResolutionTime?: number;
    complianceRate?: number;
  };
  // Optional detailed properties
  totalTickets?: number;
  byPriority?: {
    critical?: PrioritySLA;
    high?: PrioritySLA;
    medium?: PrioritySLA;
    low?: PrioritySLA;
  };
  trends?: {
    last7Days?: {
      ticketsCreated: number;
      ticketsResolved: number;
      slaBreaches: number;
    };
    last30Days?: {
      ticketsCreated: number;
      ticketsResolved: number;
      slaBreaches: number;
    };
  };
}

export interface PrioritySLA {
  total: number;
  breached: number;
  averageResponseTime: number;
  averageResolutionTime: number;
}

export interface JiraTicketsResponse {
  tickets: JiraTicket[];
  total: number;
}

export interface JiraHealthStatus {
  status: string;
  message: string;
  isHealthy: boolean;
}

// Filter types for ticket queries
export interface TicketFilters {
  statusCategory?: string;
  priority?: string;
}

export interface PaginationParams {
  maxResults: number;
  startAt: number;
}

// UI-specific types
export interface JiraDataState {
  loading: boolean;
  error: string | null;
  lastUpdated?: Date;
}

export interface DrillDownModalState {
  isOpen: boolean;
  title: string;
  filters: TicketFilters;
  loading: boolean;
}

// API Response wrapper
export interface JiraApiResponse<T = any> {
  success: boolean;
  data: T;
  message?: string;
  error?: string;
}

// Dashboard summary type
export interface JiraDashboardSummary {
  totalTickets: number;
  openTickets: number;
  resolvedTickets: number;
  slaBreaches: number;
  clientSummaries: Array<{
    clientId: string;
    clientName: string;
    ticketCount: number;
    openTickets: number;
    slaBreaches: number;
  }>;
}

// Ticket filters for API calls
export interface JiraTicketFilters {
  status?: string;
  priority?: string;
  assignee?: string;
  clientId?: string;
  dateFrom?: string;
  dateTo?: string;
  limit?: number;
  offset?: number;
} 