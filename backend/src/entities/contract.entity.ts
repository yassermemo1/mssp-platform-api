import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  OneToMany,
  JoinColumn,
  Index,
} from 'typeorm';
import { ContractStatus } from '../enums';
import { Client } from './client.entity';
import { ServiceScope } from './service-scope.entity';

/**
 * Contract Entity
 * Represents formal agreements between the MSSP and clients
 * Contains contract terms, dates, renewal tracking, and links to services
 * Supports complex contract lifecycle management
 */
@Entity('contracts')
@Index(['contractName'], { unique: true })
@Index(['clientId', 'startDate'])
@Index(['endDate']) // For expiration tracking
@Index(['status'])
@Index(['previousContractId']) // For renewal tracking
export class Contract {
  /**
   * Primary key using UUID for scalability and security
   */
  @PrimaryGeneratedColumn('uuid')
  id: string;

  /**
   * Contract name/identifier - must be unique globally
   * Examples: "MSA - Acme Corp - 2025", "SOW-001-TechStart", "Renewal-MSA-Acme-2026"
   */
  @Column({ type: 'varchar', length: 255, nullable: false, unique: true })
  contractName: string;

  /**
   * Contract start date
   */
  @Column({ type: 'date', nullable: false })
  startDate: Date;

  /**
   * Contract end date - used for expiration tracking
   */
  @Column({ type: 'date', nullable: false })
  endDate: Date;

  /**
   * Renewal date (optional) - when contract was last renewed
   * Used for tracking renewal history and patterns
   */
  @Column({ type: 'date', nullable: true })
  renewalDate: Date | null;

  /**
   * Total contract value
   * Using decimal with high precision for financial accuracy
   * DECIMAL(15,2) supports contracts up to 999,999,999,999.99
   */
  @Column({ type: 'decimal', precision: 15, scale: 2, nullable: true })
  value: number | null;

  /**
   * Contract status tracking with comprehensive lifecycle support
   */
  @Column({
    type: 'enum',
    enum: ContractStatus,
    nullable: false,
    default: ContractStatus.DRAFT,
  })
  status: ContractStatus;

  /**
   * Reference to contract document (URL or file path)
   * Will be used for document management in future chunks
   */
  @Column({ type: 'varchar', length: 500, nullable: true })
  documentLink: string | null;

  /**
   * Additional notes or terms (optional)
   * Can include special conditions, amendments, or important details
   */
  @Column({ type: 'text', nullable: true })
  notes: string | null;

  /**
   * Foreign key to Client
   */
  @Column({ type: 'uuid', nullable: false })
  clientId: string;

  /**
   * Foreign key to previous contract (for renewal tracking)
   * Self-referencing relationship to track contract renewals
   */
  @Column({ type: 'uuid', nullable: true })
  previousContractId: string | null;

  /**
   * Timestamp when the contract was created
   */
  @CreateDateColumn({
    type: 'timestamp',
    default: () => 'CURRENT_TIMESTAMP(6)',
  })
  createdAt: Date;

  /**
   * Timestamp when the contract was last updated
   */
  @UpdateDateColumn({
    type: 'timestamp',
    default: () => 'CURRENT_TIMESTAMP(6)',
    onUpdate: 'CURRENT_TIMESTAMP(6)',
  })
  updatedAt: Date;

  /**
   * Many-to-one relationship with Client
   * A contract belongs to one client
   * RESTRICT prevents client deletion if contracts exist
   */
  @ManyToOne(() => Client, (client) => client.contracts, { 
    nullable: false, 
    onDelete: 'RESTRICT' 
  })
  @JoinColumn({ name: 'clientId' })
  client: Client;

  /**
   * Self-referencing many-to-one relationship for renewal tracking
   * Links to the previous contract in a renewal chain
   */
  @ManyToOne(() => Contract, (contract) => contract.renewalContracts, {
    nullable: true,
    onDelete: 'SET NULL',
  })
  @JoinColumn({ name: 'previousContractId' })
  previousContract: Contract | null;

  /**
   * One-to-many relationship for contracts that renewed this one
   * Allows tracking of renewal chains
   */
  @OneToMany(() => Contract, (contract) => contract.previousContract)
  renewalContracts: Contract[];

  /**
   * One-to-many relationship with ServiceScope
   * A contract can include multiple services with different scopes
   */
  @OneToMany(() => ServiceScope, (serviceScope) => serviceScope.contract)
  serviceScopes: ServiceScope[];

  /**
   * Virtual property to check if contract is currently active
   */
  get isActive(): boolean {
    const now = new Date();
    const activeStatuses = [
      ContractStatus.ACTIVE,
      ContractStatus.RENEWED_ACTIVE,
    ];
    return (
      activeStatuses.includes(this.status) &&
      this.startDate <= now &&
      this.endDate >= now
    );
  }

  /**
   * Virtual property to check if contract is expiring soon (within 30 days)
   */
  get isExpiringSoon(): boolean {
    const now = new Date();
    const thirtyDaysFromNow = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
    return this.endDate <= thirtyDaysFromNow && this.endDate >= now;
  }

  /**
   * Virtual property to get contract duration in days
   */
  get durationInDays(): number {
    const timeDiff = this.endDate.getTime() - this.startDate.getTime();
    return Math.ceil(timeDiff / (1000 * 3600 * 24));
  }

  /**
   * Virtual property to check if this is a renewal contract
   */
  get isRenewal(): boolean {
    return this.previousContractId !== null;
  }

  /**
   * Virtual property to get total value of all service scopes
   */
  get totalServiceScopeValue(): number {
    if (!this.serviceScopes) return 0;
    return this.serviceScopes
      .filter(scope => scope.isActive)
      .reduce((total, scope) => total + (scope.totalValue || 0), 0);
  }

  /**
   * Virtual property to get display name
   */
  get displayName(): string {
    const renewalPrefix = this.isRenewal ? 'RENEWAL - ' : '';
    return `${renewalPrefix}${this.contractName} (${this.status.toUpperCase()})`;
  }
} 