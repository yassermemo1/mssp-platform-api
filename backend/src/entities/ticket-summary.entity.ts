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
import { TicketStatus } from '../enums/ticket-status.enum';
import { TicketPriority } from '../enums/ticket-priority.enum';
import { Client } from './client.entity';
import { Contract } from './contract.entity';
import { ServiceScope } from './service-scope.entity';
import { User } from './user.entity';

/**
 * Ticket Summary Entity
 * Stores ticket information for dashboard reporting and analytics
 * Supports both manual entry and synchronization with external systems (Jira)
 * Designed for efficient querying and aggregation
 */
@Entity('ticket_summaries')
@Index(['clientId', 'status'])
@Index(['clientId', 'priority'])
@Index(['status', 'priority'])
@Index(['externalTicketId'])
@Index(['createdDate'])
@Index(['lastUpdatedDate'])
@Index(['resolvedDate'])
@Index(['assignedUserId'])
export class TicketSummary {
  /**
   * Primary key using UUID
   */
  @PrimaryGeneratedColumn('uuid')
  id: string;

  /**
   * External ticket ID (e.g., from Jira)
   * Used for linking and preventing duplicates during sync
   */
  @Column({ type: 'varchar', length: 100, nullable: true, unique: true })
  externalTicketId: string | null;

  /**
   * External system source (e.g., "jira", "servicenow", "manual")
   */
  @Column({ type: 'varchar', length: 50, nullable: false, default: 'manual' })
  ticketSource: string;

  /**
   * Ticket title or summary
   */
  @Column({ type: 'varchar', length: 500, nullable: false })
  title: string;

  /**
   * Brief description or summary of the issue
   */
  @Column({ type: 'text', nullable: true })
  description: string | null;

  /**
   * Current ticket status
   */
  @Column({
    type: 'enum',
    enum: TicketStatus,
    nullable: false,
    default: TicketStatus.NEW,
  })
  status: TicketStatus;

  /**
   * Ticket priority level
   */
  @Column({
    type: 'enum',
    enum: TicketPriority,
    nullable: false,
    default: TicketPriority.MEDIUM,
  })
  priority: TicketPriority;

  /**
   * Ticket category or type
   * Examples: "incident", "service_request", "problem", "change"
   */
  @Column({ type: 'varchar', length: 100, nullable: true })
  category: string | null;

  /**
   * Service affected by this ticket
   * Examples: "EDR", "SIEM", "NDR", "General Support"
   */
  @Column({ type: 'varchar', length: 100, nullable: true })
  affectedService: string | null;

  /**
   * Date when the ticket was created
   */
  @Column({ type: 'timestamp', nullable: false })
  createdDate: Date;

  /**
   * Date when the ticket was last updated
   */
  @Column({ type: 'timestamp', nullable: false })
  lastUpdatedDate: Date;

  /**
   * Date when the ticket was resolved
   */
  @Column({ type: 'timestamp', nullable: true })
  resolvedDate: Date | null;

  /**
   * Date when the ticket was closed
   */
  @Column({ type: 'timestamp', nullable: true })
  closedDate: Date | null;

  /**
   * Time to first response in minutes
   */
  @Column({ type: 'integer', nullable: true })
  firstResponseTimeMinutes: number | null;

  /**
   * Time to resolution in minutes
   */
  @Column({ type: 'integer', nullable: true })
  resolutionTimeMinutes: number | null;

  /**
   * Name of the assignee (stored as text for flexibility with external systems)
   */
  @Column({ type: 'varchar', length: 255, nullable: true })
  assigneeName: string | null;

  /**
   * Additional ticket metadata from external systems
   * Can store custom fields, labels, components, etc.
   */
  @Column({ type: 'jsonb', nullable: true })
  metadata: Record<string, any> | null;

  /**
   * SLA breach information
   */
  @Column({ type: 'boolean', nullable: false, default: false })
  slaBreached: boolean;

  /**
   * Type of SLA breached (if applicable)
   * Examples: "response_time", "resolution_time"
   */
  @Column({ type: 'varchar', length: 100, nullable: true })
  slaBreachType: string | null;

  /**
   * Foreign key to Client
   */
  @Column({ type: 'uuid', nullable: false })
  clientId: string;

  /**
   * Foreign key to Contract (optional)
   */
  @Column({ type: 'uuid', nullable: true })
  contractId: string | null;

  /**
   * Foreign key to ServiceScope (optional)
   */
  @Column({ type: 'uuid', nullable: true })
  serviceScopeId: string | null;

  /**
   * Foreign key to assigned User (optional - for internal assignment)
   */
  @Column({ type: 'uuid', nullable: true })
  assignedUserId: string | null;

  /**
   * Timestamp when the record was created in our system
   */
  @CreateDateColumn({
    type: 'timestamp',
    default: () => 'CURRENT_TIMESTAMP(6)',
  })
  createdAt: Date;

  /**
   * Timestamp when the record was last updated in our system
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
  @ManyToOne(() => Contract, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'contractId' })
  contract: Contract | null;

  /**
   * Many-to-one relationship with ServiceScope
   */
  @ManyToOne(() => ServiceScope, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'serviceScopeId' })
  serviceScope: ServiceScope | null;

  /**
   * Many-to-one relationship with User (assignee)
   */
  @ManyToOne(() => User, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'assignedUserId' })
  assignedUser: User | null;

  /**
   * Virtual property to check if ticket is open
   */
  get isOpen(): boolean {
    const openStatuses = [
      TicketStatus.NEW,
      TicketStatus.OPEN,
      TicketStatus.IN_PROGRESS,
      TicketStatus.PENDING,
      TicketStatus.WAITING_FOR_CUSTOMER,
      TicketStatus.WAITING_FOR_VENDOR,
      TicketStatus.REOPENED,
    ];
    return openStatuses.includes(this.status);
  }

  /**
   * Virtual property to check if ticket is resolved or closed
   */
  get isResolved(): boolean {
    return this.status === TicketStatus.RESOLVED || this.status === TicketStatus.CLOSED;
  }

  /**
   * Virtual property to get age in days
   */
  get ageInDays(): number {
    const now = new Date();
    const created = new Date(this.createdDate);
    const diffTime = Math.abs(now.getTime() - created.getTime());
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  }

  /**
   * Virtual property to get time since last update in hours
   */
  get hoursSinceLastUpdate(): number {
    const now = new Date();
    const lastUpdate = new Date(this.lastUpdatedDate);
    const diffTime = Math.abs(now.getTime() - lastUpdate.getTime());
    return Math.floor(diffTime / (1000 * 60 * 60));
  }
} 