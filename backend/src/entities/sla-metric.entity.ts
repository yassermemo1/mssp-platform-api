import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
  Index,
} from 'typeorm';
import { SLAMetricType } from '../enums/sla-metric-type.enum';
import { Client } from './client.entity';
import { Contract } from './contract.entity';
import { ServiceScope } from './service-scope.entity';

/**
 * SLA Metric Entity
 * Tracks SLA performance metrics for clients, contracts, and services
 * Supports historical data tracking and dashboard reporting
 * Stores both target and actual values for SLA compliance calculation
 */
@Entity('sla_metrics')
@Index(['clientId', 'metricDate'])
@Index(['contractId', 'metricDate'])
@Index(['serviceScopeId', 'metricDate'])
@Index(['metricType', 'metricDate'])
@Index(['metricDate'])
@Index(['isBreach'])
export class SLAMetric {
  /**
   * Primary key using UUID
   */
  @PrimaryGeneratedColumn('uuid')
  id: string;

  /**
   * Type of SLA metric being tracked
   */
  @Column({
    type: 'enum',
    enum: SLAMetricType,
    nullable: false,
  })
  metricType: SLAMetricType;

  /**
   * Custom metric name (used when metricType is CUSTOM)
   */
  @Column({ type: 'varchar', length: 255, nullable: true })
  customMetricName: string | null;

  /**
   * Date/time when this metric was measured
   * Using timestamp for granular tracking
   */
  @Column({ type: 'timestamp', nullable: false })
  metricDate: Date;

  /**
   * Period start date for this metric (for period-based metrics)
   */
  @Column({ type: 'timestamp', nullable: true })
  periodStartDate: Date | null;

  /**
   * Period end date for this metric (for period-based metrics)
   */
  @Column({ type: 'timestamp', nullable: true })
  periodEndDate: Date | null;

  /**
   * Target value for this SLA metric
   * Examples: 99.9 (for uptime %), 4 (for hours), 15 (for minutes)
   */
  @Column({ type: 'decimal', precision: 10, scale: 4, nullable: false })
  targetValue: number;

  /**
   * Actual measured value for this SLA metric
   */
  @Column({ type: 'decimal', precision: 10, scale: 4, nullable: false })
  actualValue: number;

  /**
   * Unit of measurement for the metric
   * Examples: "percent", "hours", "minutes", "count", "tickets"
   */
  @Column({ type: 'varchar', length: 50, nullable: false })
  unit: string;

  /**
   * Whether this metric represents an SLA breach
   * Calculated based on target vs actual values
   */
  @Column({ type: 'boolean', nullable: false, default: false })
  isBreach: boolean;

  /**
   * Severity of the breach (if applicable)
   * 1 = Minor, 2 = Major, 3 = Critical
   */
  @Column({ type: 'integer', nullable: true })
  breachSeverity: number | null;

  /**
   * Additional context or details about this metric
   * Can include calculation details, exceptions, etc.
   */
  @Column({ type: 'jsonb', nullable: true })
  metricDetails: Record<string, any> | null;

  /**
   * Notes or comments about this metric measurement
   */
  @Column({ type: 'text', nullable: true })
  notes: string | null;

  /**
   * Foreign key to Client
   */
  @Column({ type: 'uuid', nullable: false })
  clientId: string;

  /**
   * Foreign key to Contract (optional - some metrics may be client-level)
   */
  @Column({ type: 'uuid', nullable: true })
  contractId: string | null;

  /**
   * Foreign key to ServiceScope (optional - for service-specific metrics)
   */
  @Column({ type: 'uuid', nullable: true })
  serviceScopeId: string | null;

  /**
   * Foreign key to User who recorded/calculated this metric
   */
  @Column({ type: 'uuid', nullable: true })
  recordedByUserId: string | null;

  /**
   * Timestamp when the metric was created
   */
  @CreateDateColumn({
    type: 'timestamp',
    default: () => 'CURRENT_TIMESTAMP(6)',
  })
  createdAt: Date;

  /**
   * Timestamp when the metric was last updated
   */
  @UpdateDateColumn({
    type: 'timestamp',
    default: () => 'CURRENT_TIMESTAMP(6)',
    onUpdate: 'CURRENT_TIMESTAMP(6)',
  })
  updatedAt: Date;

  /**
   * Many-to-one relationship with Client
   */
  @ManyToOne(() => Client, { nullable: false, onDelete: 'CASCADE' })
  @JoinColumn({ name: 'clientId' })
  client: Client;

  /**
   * Many-to-one relationship with Contract
   */
  @ManyToOne(() => Contract, { nullable: true, onDelete: 'CASCADE' })
  @JoinColumn({ name: 'contractId' })
  contract: Contract | null;

  /**
   * Many-to-one relationship with ServiceScope
   */
  @ManyToOne(() => ServiceScope, { nullable: true, onDelete: 'CASCADE' })
  @JoinColumn({ name: 'serviceScopeId' })
  serviceScope: ServiceScope | null;

  /**
   * Virtual property to calculate SLA achievement percentage
   */
  get achievementPercentage(): number {
    if (this.targetValue === 0) return 0;
    
    // For metrics where higher is better (e.g., uptime)
    if (this.metricType === SLAMetricType.SYSTEM_UPTIME || 
        this.metricType === SLAMetricType.SERVICE_AVAILABILITY ||
        this.metricType === SLAMetricType.FIRST_CALL_RESOLUTION) {
      return (this.actualValue / this.targetValue) * 100;
    }
    
    // For metrics where lower is better (e.g., response time)
    return (this.targetValue / this.actualValue) * 100;
  }

  /**
   * Virtual property to get metric display name
   */
  get displayName(): string {
    if (this.metricType === SLAMetricType.CUSTOM && this.customMetricName) {
      return this.customMetricName;
    }
    return this.metricType.replace(/_/g, ' ').toLowerCase()
      .replace(/\b\w/g, (c) => c.toUpperCase());
  }

  /**
   * Helper method to check if metric meets SLA
   */
  meetsSLA(): boolean {
    return !this.isBreach;
  }
} 