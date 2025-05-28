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
import { ServiceMetricType } from '../enums/service-metric-type.enum';
import { Client } from './client.entity';
import { ServiceScope } from './service-scope.entity';

/**
 * Service Performance Metric Entity
 * Tracks performance metrics for specific services over time
 * Supports time-series data for EDR, SIEM, NDR, and other service metrics
 * Designed for dashboard gauges and performance trending
 */
@Entity('service_performance_metrics')
@Index(['clientId', 'metricDate'])
@Index(['serviceScopeId', 'metricDate'])
@Index(['metricType', 'metricDate'])
@Index(['metricDate'])
export class ServicePerformanceMetric {
  /**
   * Primary key using UUID
   */
  @PrimaryGeneratedColumn('uuid')
  id: string;

  /**
   * Type of service metric being tracked
   */
  @Column({
    type: 'enum',
    enum: ServiceMetricType,
    nullable: false,
  })
  metricType: ServiceMetricType;

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
   * Numeric value of the metric
   * Examples: 250000 (endpoints), 1500.5 (GB), 99.9 (percentage)
   */
  @Column({ type: 'decimal', precision: 15, scale: 4, nullable: false })
  value: number;

  /**
   * Unit of measurement for the metric
   * Examples: "endpoints", "GB", "TB", "percent", "count", "events"
   */
  @Column({ type: 'varchar', length: 50, nullable: false })
  unit: string;

  /**
   * Target/threshold value for this metric (optional)
   * Used for comparison and alerting
   */
  @Column({ type: 'decimal', precision: 15, scale: 4, nullable: true })
  targetValue: number | null;

  /**
   * Maximum capacity for this metric (optional)
   * Used for gauge visualizations (e.g., 500000 max endpoints)
   */
  @Column({ type: 'decimal', precision: 15, scale: 4, nullable: true })
  maxCapacity: number | null;

  /**
   * Whether this metric value is within acceptable range
   */
  @Column({ type: 'boolean', nullable: false, default: true })
  isWithinThreshold: boolean;

  /**
   * Severity level if threshold is exceeded
   * 1 = Warning, 2 = Alert, 3 = Critical
   */
  @Column({ type: 'integer', nullable: true })
  alertSeverity: number | null;

  /**
   * Additional context or breakdown of the metric
   * Can include sub-metrics, regional breakdowns, etc.
   */
  @Column({ type: 'jsonb', nullable: true })
  metricBreakdown: Record<string, any> | null;

  /**
   * Data source for this metric
   * Examples: "api", "manual", "automated_collector", "integration"
   */
  @Column({ type: 'varchar', length: 100, nullable: true })
  dataSource: string | null;

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
   * Foreign key to ServiceScope
   * Links to the specific service instance for this client
   */
  @Column({ type: 'uuid', nullable: false })
  serviceScopeId: string;

  /**
   * Foreign key to User who recorded this metric (optional)
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
   * Many-to-one relationship with ServiceScope
   */
  @ManyToOne(() => ServiceScope, { nullable: false, onDelete: 'CASCADE' })
  @JoinColumn({ name: 'serviceScopeId' })
  serviceScope: ServiceScope;

  /**
   * Virtual property to calculate utilization percentage
   */
  get utilizationPercentage(): number | null {
    if (!this.maxCapacity || this.maxCapacity === 0) return null;
    return (this.value / this.maxCapacity) * 100;
  }

  /**
   * Virtual property to calculate percentage of target
   */
  get targetAchievementPercentage(): number | null {
    if (!this.targetValue || this.targetValue === 0) return null;
    return (this.value / this.targetValue) * 100;
  }

  /**
   * Virtual property to get metric display name
   */
  get displayName(): string {
    if (this.metricType === ServiceMetricType.CUSTOM && this.customMetricName) {
      return this.customMetricName;
    }
    return this.metricType.replace(/_/g, ' ').toLowerCase()
      .replace(/\b\w/g, (c) => c.toUpperCase());
  }

  /**
   * Helper method to check if metric is at risk
   */
  isAtRisk(): boolean {
    if (!this.targetValue) return false;
    
    // Define risk threshold as 90% of target for most metrics
    const riskThreshold = 0.9;
    
    // For capacity metrics, at risk if above 90% utilized
    if (this.maxCapacity) {
      return this.utilizationPercentage > (riskThreshold * 100);
    }
    
    // For performance metrics, depends on the type
    return !this.isWithinThreshold;
  }

  /**
   * Helper method to get metric status
   */
  getStatus(): 'good' | 'warning' | 'critical' {
    if (!this.isWithinThreshold && this.alertSeverity >= 3) {
      return 'critical';
    }
    if (!this.isWithinThreshold || this.isAtRisk()) {
      return 'warning';
    }
    return 'good';
  }
} 