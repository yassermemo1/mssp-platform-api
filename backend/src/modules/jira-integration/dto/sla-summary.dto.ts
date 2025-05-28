/**
 * SLASummaryDto
 * Data Transfer Object for SLA summary information
 */
export class SLASummaryDto {
  totalTickets: number;
  
  timeToFirstResponse: {
    totalMeasured: number;
    currentlyBreached: number;
    atRisk: number; // Within 10% of breach time
    averageResponseTime: number; // In milliseconds
    complianceRate: number; // Percentage
  };
  
  timeToResolution: {
    totalMeasured: number;
    currentlyBreached: number;
    atRisk: number; // Within 10% of breach time
    averageResolutionTime: number; // In milliseconds
    complianceRate: number; // Percentage
  };
  
  byPriority: {
    critical: {
      total: number;
      breached: number;
      averageResponseTime: number;
      averageResolutionTime: number;
    };
    high: {
      total: number;
      breached: number;
      averageResponseTime: number;
      averageResolutionTime: number;
    };
    medium: {
      total: number;
      breached: number;
      averageResponseTime: number;
      averageResolutionTime: number;
    };
    low: {
      total: number;
      breached: number;
      averageResponseTime: number;
      averageResolutionTime: number;
    };
  };
  
  trends: {
    last7Days: {
      ticketsCreated: number;
      ticketsResolved: number;
      slaBreaches: number;
    };
    last30Days: {
      ticketsCreated: number;
      ticketsResolved: number;
      slaBreaches: number;
    };
  };
} 