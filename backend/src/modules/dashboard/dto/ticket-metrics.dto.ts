import { ApiProperty } from '@nestjs/swagger';
import { TicketStatus, TicketPriority } from '../../../enums';

/**
 * Ticket Status Summary
 */
export class TicketStatusSummaryDto {
  @ApiProperty({ description: 'Total number of tickets' })
  total: number;

  @ApiProperty({ description: 'Number of open tickets' })
  open: number;

  @ApiProperty({ description: 'Number of critical priority tickets' })
  critical: number;

  @ApiProperty({ description: 'Number of high priority tickets' })
  high: number;

  @ApiProperty({ description: 'Number of medium priority tickets' })
  medium: number;

  @ApiProperty({ description: 'Number of low priority tickets' })
  low: number;

  @ApiProperty({ description: 'Number of closed tickets' })
  closed: number;

  @ApiProperty({ description: 'Breakdown by status' })
  statusBreakdown: Record<TicketStatus, number>;

  @ApiProperty({ description: 'Average resolution time in hours' })
  avgResolutionTime: number;

  @ApiProperty({ description: 'Number of SLA breached tickets' })
  slaBreachedCount: number;
}

/**
 * Ticket Trend Data Point
 */
export class TicketTrendDataPointDto {
  @ApiProperty({ description: 'Date for this data point' })
  date: string;

  @ApiProperty({ description: 'Number of tickets created' })
  created: number;

  @ApiProperty({ description: 'Number of tickets resolved' })
  resolved: number;

  @ApiProperty({ description: 'Number of tickets closed' })
  closed: number;
}

/**
 * Ticket Dashboard Data Response
 */
export class TicketDashboardDto {
  @ApiProperty({ description: 'Current ticket status summary' })
  summary: TicketStatusSummaryDto;

  @ApiProperty({ description: 'Ticket trend data for the last 30 days' })
  trends: TicketTrendDataPointDto[];

  @ApiProperty({ description: 'Top clients by ticket volume' })
  topClients: Array<{
    clientId: string;
    clientName: string;
    ticketCount: number;
    criticalCount: number;
  }>;

  @ApiProperty({ description: 'Tickets by service type' })
  byService: Record<string, number>;
} 