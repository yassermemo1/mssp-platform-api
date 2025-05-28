import { ApiProperty } from '@nestjs/swagger';
import { SLAMetricType } from '../../../enums/sla-metric-type.enum';

/**
 * SLA Historical Data Point
 */
export class SLAHistoricalDataPointDto {
  @ApiProperty({ description: 'Date/period for this data point' })
  date: string;

  @ApiProperty({ description: 'SLA achievement percentage' })
  achievementPercentage: number;

  @ApiProperty({ description: 'Number of breaches in this period' })
  breachCount: number;

  @ApiProperty({ description: 'Total metrics measured in this period' })
  totalMetrics: number;
}

/**
 * Current Month SLA Summary
 */
export class CurrentMonthSLADto {
  @ApiProperty({ description: 'Overall SLA achievement percentage' })
  overallAchievement: number;

  @ApiProperty({ description: 'Target SLA percentage' })
  targetPercentage: number;

  @ApiProperty({ description: 'Change from previous month' })
  changeFromLastMonth: number;

  @ApiProperty({ description: 'Number of active SLAs' })
  activeSLAs: number;

  @ApiProperty({ description: 'Number of breached SLAs' })
  breachedSLAs: number;

  @ApiProperty({ description: 'Breakdown by metric type' })
  metricBreakdown: Array<{
    metricType: SLAMetricType;
    displayName: string;
    achievementPercentage: number;
    breachCount: number;
  }>;
}

/**
 * SLA Dashboard Data Response
 */
export class SLADashboardDto {
  @ApiProperty({ description: 'Historical SLA performance data' })
  historical: SLAHistoricalDataPointDto[];

  @ApiProperty({ description: 'Current month SLA summary' })
  currentMonth: CurrentMonthSLADto;

  @ApiProperty({ description: 'List of recent breaches for drill-down' })
  recentBreaches: Array<{
    id: string;
    clientName: string;
    metricType: string;
    breachDate: Date;
    severity: number;
  }>;
} 