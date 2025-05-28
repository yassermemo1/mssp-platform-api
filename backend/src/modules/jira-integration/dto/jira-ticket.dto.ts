/**
 * JiraTicketDto
 * Data Transfer Object for Jira ticket information
 */
export class JiraTicketDto {
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
  
  // SLA fields (if available)
  slaFields?: {
    timeToFirstResponse?: {
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
    };
    timeToResolution?: {
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
    };
  };
} 