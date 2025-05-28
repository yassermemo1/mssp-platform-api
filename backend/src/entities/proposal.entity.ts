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
import { ProposalType, ProposalStatus } from '../enums';
import { ServiceScope } from './service-scope.entity';
import { User } from './user.entity';

/**
 * Proposal Entity
 * Represents technical and financial proposals associated with specific service scopes
 * Supports comprehensive proposal lifecycle management and document tracking
 * Enables multiple proposal versions and types per service scope
 */
@Entity('proposals')
@Index(['serviceScopeId'])
@Index(['proposalType'])
@Index(['status'])
@Index(['assigneeUserId'])
@Index(['createdAt'])
export class Proposal {
  /**
   * Primary key using UUID for scalability and security
   */
  @PrimaryGeneratedColumn('uuid')
  id: string;

  /**
   * Type of proposal (technical, financial, combined, etc.)
   * Determines the proposal workflow and approval process
   */
  @Column({
    type: 'enum',
    enum: ProposalType,
    nullable: false,
  })
  proposalType: ProposalType;

  /**
   * Reference to proposal document (URL or file path)
   * Mandatory field linking to the actual proposal document
   * Will integrate with document management system in future phases
   */
  @Column({ type: 'varchar', length: 500, nullable: false })
  documentLink: string;

  /**
   * Proposal version identifier (optional)
   * Supports versioning for proposal revisions
   * Examples: "1.0", "2.1", "Final", "Draft-Rev3"
   */
  @Column({ type: 'varchar', length: 50, nullable: true })
  version: string | null;

  /**
   * Current status of the proposal
   * Tracks the proposal through its lifecycle
   */
  @Column({
    type: 'enum',
    enum: ProposalStatus,
    nullable: false,
    default: ProposalStatus.DRAFT,
  })
  status: ProposalStatus;

  /**
   * Proposal title or summary (optional)
   * Brief description of the proposal content
   */
  @Column({ type: 'varchar', length: 255, nullable: true })
  title: string | null;

  /**
   * Detailed description or executive summary (optional)
   * Can include key points, objectives, or proposal overview
   */
  @Column({ type: 'text', nullable: true })
  description: string | null;

  /**
   * Proposal value or cost (optional)
   * Financial amount associated with this proposal
   * Using DECIMAL(15,2) for high precision financial data
   */
  @Column({ type: 'decimal', precision: 15, scale: 2, nullable: true })
  proposalValue: number | null;

  /**
   * Currency code for the proposal value (optional)
   * ISO 4217 format, defaults to SAR for Saudi Arabia operations
   */
  @Column({ type: 'varchar', length: 3, nullable: true, default: 'SAR' })
  currency: string | null;

  /**
   * Proposal validity expiration date (optional)
   * Date until which the proposal terms and pricing remain valid
   */
  @Column({ type: 'date', nullable: true })
  validUntilDate: Date | null;

  /**
   * Expected implementation timeline in days (optional)
   * Estimated duration for proposal implementation
   */
  @Column({ type: 'integer', nullable: true })
  estimatedDurationDays: number | null;

  /**
   * Proposal submission date (optional)
   * When the proposal was formally submitted
   */
  @Column({ type: 'timestamp', nullable: true })
  submittedAt: Date | null;

  /**
   * Proposal approval date (optional)
   * When the proposal was approved
   */
  @Column({ type: 'timestamp', nullable: true })
  approvedAt: Date | null;

  /**
   * Additional notes or comments
   * Can include review feedback, special conditions, or implementation notes
   */
  @Column({ type: 'text', nullable: true })
  notes: string | null;

  /**
   * Custom field data stored as JSONB
   * Stores values for admin-defined custom fields
   * Format: { "field_name": "field_value", ... }
   */
  @Column({ type: 'jsonb', nullable: true })
  customFieldData: Record<string, any> | null;

  /**
   * Foreign key to ServiceScope
   */
  @Column({ type: 'uuid', nullable: false })
  serviceScopeId: string;

  /**
   * Foreign key to User (assignee) - optional
   * Represents the sales/account person responsible for this proposal
   */
  @Column({ type: 'uuid', nullable: true })
  assigneeUserId: string | null;

  /**
   * Timestamp when the proposal was created
   */
  @CreateDateColumn({
    type: 'timestamp',
    default: () => 'CURRENT_TIMESTAMP(6)',
  })
  createdAt: Date;

  /**
   * Timestamp when the proposal was last updated
   */
  @UpdateDateColumn({
    type: 'timestamp',
    default: () => 'CURRENT_TIMESTAMP(6)',
    onUpdate: 'CURRENT_TIMESTAMP(6)',
  })
  updatedAt: Date;

  /**
   * Many-to-one relationship with ServiceScope
   * A proposal belongs to one specific service scope
   */
  @ManyToOne(() => ServiceScope, (serviceScope) => serviceScope.proposals, {
    nullable: false,
    onDelete: 'CASCADE', // Delete proposals when service scope is deleted
  })
  @JoinColumn({ name: 'serviceScopeId' })
  serviceScope: ServiceScope;

  /**
   * Many-to-one relationship with User (assignee) - optional
   * A proposal may be assigned to a specific user (sales/account person)
   */
  @ManyToOne(() => User, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'assigneeUserId' })
  assigneeUser: User | null;

  /**
   * Virtual property to check if proposal is in draft state
   */
  get isDraft(): boolean {
    return this.status === ProposalStatus.DRAFT || this.status === ProposalStatus.IN_PREPARATION;
  }

  /**
   * Virtual property to check if proposal is submitted
   */
  get isSubmitted(): boolean {
    const submittedStatuses = [
      ProposalStatus.SUBMITTED,
      ProposalStatus.UNDER_REVIEW,
      ProposalStatus.PENDING_APPROVAL,
      ProposalStatus.PENDING_CLIENT_REVIEW,
    ];
    return submittedStatuses.includes(this.status);
  }

  /**
   * Virtual property to check if proposal is approved
   */
  get isApproved(): boolean {
    const approvedStatuses = [
      ProposalStatus.APPROVED,
      ProposalStatus.ACCEPTED_BY_CLIENT,
      ProposalStatus.IN_IMPLEMENTATION,
      ProposalStatus.COMPLETED,
    ];
    return approvedStatuses.includes(this.status);
  }

  /**
   * Virtual property to check if proposal is final (no more changes expected)
   */
  get isFinal(): boolean {
    const finalStatuses = [
      ProposalStatus.APPROVED,
      ProposalStatus.REJECTED,
      ProposalStatus.WITHDRAWN,
      ProposalStatus.ARCHIVED,
      ProposalStatus.COMPLETED,
    ];
    return finalStatuses.includes(this.status);
  }

  /**
   * Virtual property to check if proposal is expired
   */
  get isExpired(): boolean {
    if (!this.validUntilDate) return false;
    return new Date() > this.validUntilDate && !this.isFinal;
  }

  /**
   * Virtual property to get formatted proposal value with currency
   */
  get formattedValue(): string | null {
    if (!this.proposalValue) return null;
    return `${this.proposalValue.toLocaleString()} ${this.currency || 'SAR'}`;
  }

  /**
   * Virtual property to get display name
   */
  get displayName(): string {
    const typeDisplay = this.proposalType.replace(/_/g, ' ').toLowerCase();
    const versionSuffix = this.version ? ` v${this.version}` : '';
    return `${typeDisplay} proposal${versionSuffix}`;
  }

  /**
   * Virtual property to get days since creation
   */
  get daysSinceCreation(): number {
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - this.createdAt.getTime());
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  }

  /**
   * Virtual property to get days since submission (null if not submitted)
   */
  get daysSinceSubmission(): number | null {
    if (!this.submittedAt) return null;
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - this.submittedAt.getTime());
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  }
} 