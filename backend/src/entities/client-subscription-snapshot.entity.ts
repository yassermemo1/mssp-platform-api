import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';

/**
 * Client Subscription Snapshot Entity
 * Stores periodic snapshots of subscription metrics for trend analysis
 * Designed for efficient dashboard queries and historical reporting
 * Captures aggregate data at regular intervals (daily/weekly/monthly)
 */
@Entity('client_subscription_snapshots')
@Index(['snapshotDate'])
@Index(['periodType', 'snapshotDate'])
export class ClientSubscriptionSnapshot {
  /**
   * Primary key using UUID
   */
  @PrimaryGeneratedColumn('uuid')
  id: string;

  /**
   * Date of the snapshot
   */
  @Column({ type: 'date', nullable: false })
  snapshotDate: Date;

  /**
   * Period type for this snapshot
   * Examples: "daily", "weekly", "monthly", "quarterly"
   */
  @Column({ type: 'varchar', length: 20, nullable: false })
  periodType: string;

  /**
   * Total number of active clients
   */
  @Column({ type: 'integer', nullable: false, default: 0 })
  totalActiveClients: number;

  /**
   * Total number of new clients added in this period
   */
  @Column({ type: 'integer', nullable: false, default: 0 })
  newClients: number;

  /**
   * Total number of churned clients in this period
   */
  @Column({ type: 'integer', nullable: false, default: 0 })
  churnedClients: number;

  /**
   * Total number of active contracts
   */
  @Column({ type: 'integer', nullable: false, default: 0 })
  totalActiveContracts: number;

  /**
   * Total value of active contracts
   */
  @Column({ type: 'decimal', precision: 15, scale: 2, nullable: false, default: 0 })
  totalContractValue: number;

  /**
   * Number of contracts expiring within 30 days
   */
  @Column({ type: 'integer', nullable: false, default: 0 })
  contractsExpiringSoon: number;

  /**
   * Number of renewed contracts in this period
   */
  @Column({ type: 'integer', nullable: false, default: 0 })
  contractsRenewed: number;

  /**
   * Total number of active service scopes
   */
  @Column({ type: 'integer', nullable: false, default: 0 })
  totalActiveServiceScopes: number;

  /**
   * Breakdown by service category
   * JSONB structure: { "Managed Security": 15, "Monitoring": 20, ... }
   */
  @Column({ type: 'jsonb', nullable: true })
  serviceBreakdown: Record<string, number> | null;

  /**
   * Breakdown by client source
   * JSONB structure: { "Direct Sales": 10, "Partner Referral": 5, ... }
   */
  @Column({ type: 'jsonb', nullable: true })
  clientSourceBreakdown: Record<string, number> | null;

  /**
   * Revenue metrics
   * JSONB structure: { "mrr": 50000, "arr": 600000, "averageContractValue": 25000 }
   */
  @Column({ type: 'jsonb', nullable: true })
  revenueMetrics: Record<string, number> | null;

  /**
   * Growth metrics
   * JSONB structure: { "clientGrowthRate": 5.5, "revenueGrowthRate": 8.2 }
   */
  @Column({ type: 'jsonb', nullable: true })
  growthMetrics: Record<string, number> | null;

  /**
   * Additional snapshot data for extensibility
   */
  @Column({ type: 'jsonb', nullable: true })
  additionalMetrics: Record<string, any> | null;

  /**
   * Timestamp when the snapshot was created
   */
  @CreateDateColumn({
    type: 'timestamp',
    default: () => 'CURRENT_TIMESTAMP(6)',
  })
  createdAt: Date;

  /**
   * Timestamp when the snapshot was last updated
   */
  @UpdateDateColumn({
    type: 'timestamp',
    default: () => 'CURRENT_TIMESTAMP(6)',
    onUpdate: 'CURRENT_TIMESTAMP(6)',
  })
  updatedAt: Date;

  /**
   * Virtual property to calculate net client change
   */
  get netClientChange(): number {
    return this.newClients - this.churnedClients;
  }

  /**
   * Virtual property to calculate churn rate
   */
  get churnRate(): number | null {
    if (this.totalActiveClients === 0) return null;
    return (this.churnedClients / this.totalActiveClients) * 100;
  }

  /**
   * Virtual property to calculate renewal rate
   */
  get renewalRate(): number | null {
    const totalExpiredOrRenewed = this.contractsRenewed + this.contractsExpiringSoon;
    if (totalExpiredOrRenewed === 0) return null;
    return (this.contractsRenewed / totalExpiredOrRenewed) * 100;
  }

  /**
   * Helper method to get MRR (Monthly Recurring Revenue)
   */
  getMRR(): number | null {
    return this.revenueMetrics?.mrr || null;
  }

  /**
   * Helper method to get ARR (Annual Recurring Revenue)
   */
  getARR(): number | null {
    return this.revenueMetrics?.arr || null;
  }

  /**
   * Helper method to get average contract value
   */
  getAverageContractValue(): number | null {
    if (this.totalActiveContracts === 0) return null;
    return this.totalContractValue / this.totalActiveContracts;
  }
} 