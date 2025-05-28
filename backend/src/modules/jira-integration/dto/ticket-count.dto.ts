/**
 * TicketCountDto
 * Data Transfer Object for ticket count statistics
 */
export class TicketCountDto {
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