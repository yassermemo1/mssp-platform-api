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
import { FinancialTransactionType, FinancialTransactionStatus } from '../../../enums';
import { Client } from '../../../entities/client.entity';
import { Contract } from '../../../entities/contract.entity';
import { ServiceScope } from '../../../entities/service-scope.entity';
import { HardwareAsset } from '../../../entities/hardware-asset.entity';
import { User } from '../../../entities/user.entity';

/**
 * FinancialTransaction Entity
 * Records individual financial transactions for both costs and revenues
 * Supports comprehensive financial tracking and reporting with optional entity relationships
 */
@Entity('financial_transactions')
@Index(['type'])
@Index(['status'])
@Index(['transactionDate'])
@Index(['clientId'])
@Index(['contractId'])
@Index(['serviceScopeId'])
@Index(['recordedByUserId'])
@Index(['createdAt'])
export class FinancialTransaction {
  /**
   * Primary key using UUID for scalability and security
   */
  @PrimaryGeneratedColumn('uuid')
  id: string;

  /**
   * Type of financial transaction (revenue or cost category)
   * Determines the nature and categorization of the transaction
   */
  @Column({
    type: 'enum',
    enum: FinancialTransactionType,
    nullable: false,
  })
  type: FinancialTransactionType;

  /**
   * Transaction amount with high precision for financial accuracy
   * Using DECIMAL(15,2) to support large amounts with 2 decimal places
   */
  @Column({ type: 'decimal', precision: 15, scale: 2, nullable: false })
  amount: number;

  /**
   * Currency code (ISO 4217 format)
   * Defaults to SAR for Saudi Arabia operations
   */
  @Column({ type: 'varchar', length: 3, nullable: false, default: 'SAR' })
  currency: string;

  /**
   * Date when the transaction occurred
   * Can be different from creation date for backdated entries
   */
  @Column({ type: 'date', nullable: false })
  transactionDate: Date;

  /**
   * Description of the transaction
   * Mandatory field for transaction documentation and audit trail
   */
  @Column({ type: 'text', nullable: false })
  description: string;

  /**
   * Current status of the transaction
   * Tracks payment/processing status through lifecycle
   */
  @Column({
    type: 'enum',
    enum: FinancialTransactionStatus,
    nullable: false,
    default: FinancialTransactionStatus.PENDING,
  })
  status: FinancialTransactionStatus;

  /**
   * External reference identifier (optional)
   * Can store invoice numbers, PO numbers, receipt numbers, etc.
   */
  @Column({ type: 'varchar', length: 100, nullable: true })
  referenceId: string | null;

  /**
   * Additional notes or comments (optional)
   * Can include payment terms, special conditions, or processing notes
   */
  @Column({ type: 'text', nullable: true })
  notes: string | null;

  /**
   * Due date for pending transactions (optional)
   * Useful for tracking payment deadlines and overdue amounts
   */
  @Column({ type: 'date', nullable: true })
  dueDate: Date | null;

  /**
   * Foreign key to Client (optional)
   * Links transaction to a specific client when applicable
   */
  @Column({ type: 'uuid', nullable: true })
  clientId: string | null;

  /**
   * Foreign key to Contract (optional)
   * Links transaction to a specific contract when applicable
   */
  @Column({ type: 'uuid', nullable: true })
  contractId: string | null;

  /**
   * Foreign key to ServiceScope (optional)
   * Links transaction to a specific service scope when applicable
   */
  @Column({ type: 'uuid', nullable: true })
  serviceScopeId: string | null;

  /**
   * Foreign key to HardwareAsset (optional)
   * Links transaction to a specific hardware asset for purchase/sale tracking
   */
  @Column({ type: 'uuid', nullable: true })
  hardwareAssetId: string | null;

  /**
   * Foreign key to User who recorded this transaction
   * Tracks who entered the transaction for audit purposes
   */
  @Column({ type: 'uuid', nullable: false })
  recordedByUserId: string;

  /**
   * Timestamp when the transaction record was created
   */
  @CreateDateColumn({
    type: 'timestamp',
    default: () => 'CURRENT_TIMESTAMP(6)',
  })
  createdAt: Date;

  /**
   * Timestamp when the transaction record was last updated
   */
  @UpdateDateColumn({
    type: 'timestamp',
    default: () => 'CURRENT_TIMESTAMP(6)',
    onUpdate: 'CURRENT_TIMESTAMP(6)',
  })
  updatedAt: Date;

  /**
   * Many-to-one relationship with Client (optional)
   * A transaction may be associated with a specific client
   */
  @ManyToOne(() => Client, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'clientId' })
  client: Client | null;

  /**
   * Many-to-one relationship with Contract (optional)
   * A transaction may be associated with a specific contract
   */
  @ManyToOne(() => Contract, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'contractId' })
  contract: Contract | null;

  /**
   * Many-to-one relationship with ServiceScope (optional)
   * A transaction may be associated with a specific service scope
   */
  @ManyToOne(() => ServiceScope, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'serviceScopeId' })
  serviceScope: ServiceScope | null;

  /**
   * Many-to-one relationship with HardwareAsset (optional)
   * A transaction may be associated with a specific hardware asset
   */
  @ManyToOne(() => HardwareAsset, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'hardwareAssetId' })
  hardwareAsset: HardwareAsset | null;

  /**
   * Many-to-one relationship with User (who recorded the transaction)
   * Tracks who entered the transaction for audit purposes
   */
  @ManyToOne(() => User, { nullable: false, onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'recordedByUserId' })
  recordedByUser: User;

  /**
   * Virtual property to check if transaction is revenue
   */
  get isRevenue(): boolean {
    return this.type.startsWith('REVENUE_');
  }

  /**
   * Virtual property to check if transaction is cost
   */
  get isCost(): boolean {
    return this.type.startsWith('COST_');
  }

  /**
   * Virtual property to check if transaction is overdue
   */
  get isOverdue(): boolean {
    if (!this.dueDate || this.status === FinancialTransactionStatus.PAID) {
      return false;
    }
    return new Date() > this.dueDate && this.status === FinancialTransactionStatus.PENDING;
  }

  /**
   * Virtual property to get formatted amount with currency
   */
  get formattedAmount(): string {
    return `${this.amount.toLocaleString()} ${this.currency}`;
  }

  /**
   * Virtual property to get display name for the transaction
   */
  get displayName(): string {
    const typeDisplay = this.type.replace(/_/g, ' ').toLowerCase();
    return `${typeDisplay} - ${this.formattedAmount}`;
  }
} 