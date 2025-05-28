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
import { SAFStatus } from '../enums';
import { Contract } from './contract.entity';
import { Service } from './service.entity';
import { Proposal } from './proposal.entity';
import { ClientHardwareAssignment } from './client-hardware-assignment.entity';

/**
 * ServiceScope Entity
 * Represents the linking table between contracts and services
 * Contains specific scope details, pricing, SAF information, and parameters for each service within a contract
 * This allows the same service to have different configurations across different contracts
 * Includes comprehensive Service Activation Form (SAF) tracking
 */
@Entity('service_scopes')
@Index(['contractId', 'serviceId'], { unique: true }) // Prevent duplicate service in same contract
@Index(['contractId'])
@Index(['serviceId'])
@Index(['safStatus'])
@Index(['isActive'])
export class ServiceScope {
  /**
   * Primary key using UUID for scalability and security
   */
  @PrimaryGeneratedColumn('uuid')
  id: string;

  /**
   * Flexible scope details for this service within the contract
   * Using JSONB for maximum flexibility and PostgreSQL-specific querying capabilities
   * Examples:
   * {
   *   "endpoints": 500,
   *   "logRetention": "1 year",
   *   "responseSLA": "4 hours",
   *   "monitoredDevices": ["ServerA", "ServerB"],
   *   "coverage": "24/7",
   *   "customParameters": {...},
   *   "hardwareRequirements": {...},
   *   "softwareConfiguration": {...}
   * }
   */
  @Column({ type: 'jsonb', nullable: true })
  scopeDetails: Record<string, any> | null;

  /**
   * Price for this specific service line item within the contract
   * Using decimal with high precision for financial accuracy
   */
  @Column({ type: 'decimal', precision: 12, scale: 2, nullable: true })
  price: number | null;

  /**
   * Quantity or units for this service (optional)
   * Examples: number of endpoints, hours, devices, etc.
   */
  @Column({ type: 'integer', nullable: true })
  quantity: number | null;

  /**
   * Unit type for the quantity (optional)
   * Examples: "endpoints", "hours", "devices", "licenses", "users"
   */
  @Column({ type: 'varchar', length: 50, nullable: true })
  unit: string | null;

  /**
   * Additional notes specific to this service scope
   */
  @Column({ type: 'text', nullable: true })
  notes: string | null;

  /**
   * Whether this service scope is currently active
   * Allows for temporary deactivation without removal
   */
  @Column({ type: 'boolean', nullable: false, default: true })
  isActive: boolean;

  // SAF (Service Activation Form) Fields
  
  /**
   * Reference to SAF document (URL or file path)
   * Links to the specific activation form for this service scope
   */
  @Column({ type: 'varchar', length: 500, nullable: true })
  safDocumentLink: string | null;

  /**
   * Planned service start date from SAF
   * When the service is scheduled to begin
   */
  @Column({ type: 'date', nullable: true })
  safServiceStartDate: Date | null;

  /**
   * Planned service end date from SAF
   * When the service is scheduled to end (may differ from contract end)
   */
  @Column({ type: 'date', nullable: true })
  safServiceEndDate: Date | null;

  /**
   * Current status of the Service Activation Form
   * Tracks the SAF lifecycle from initiation to completion
   */
  @Column({
    type: 'enum',
    enum: SAFStatus,
    nullable: true,
    default: SAFStatus.NOT_INITIATED,
  })
  safStatus: SAFStatus | null;

  /**
   * Foreign key to Contract
   */
  @Column({ type: 'uuid', nullable: false })
  contractId: string;

  /**
   * Foreign key to Service
   */
  @Column({ type: 'uuid', nullable: false })
  serviceId: string;

  /**
   * Timestamp when the service scope was created
   */
  @CreateDateColumn({
    type: 'timestamp',
    default: () => 'CURRENT_TIMESTAMP(6)',
  })
  createdAt: Date;

  /**
   * Timestamp when the service scope was last updated
   */
  @UpdateDateColumn({
    type: 'timestamp',
    default: () => 'CURRENT_TIMESTAMP(6)',
    onUpdate: 'CURRENT_TIMESTAMP(6)',
  })
  updatedAt: Date;

  /**
   * Many-to-one relationship with Contract
   * A service scope belongs to one contract
   */
  @ManyToOne(() => Contract, (contract) => contract.serviceScopes, {
    nullable: false,
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'contractId' })
  contract: Contract;

  /**
   * Many-to-one relationship with Service
   * A service scope references one service from the catalog
   */
  @ManyToOne(() => Service, (service) => service.serviceScopes, {
    nullable: false,
    onDelete: 'RESTRICT', // Prevent deletion of services that are in use
  })
  @JoinColumn({ name: 'serviceId' })
  service: Service;

  /**
   * One-to-many relationship with Proposal
   * A service scope can have multiple proposals (technical, financial, etc.)
   */
  @OneToMany(() => Proposal, (proposal) => proposal.serviceScope)
  proposals: Proposal[];

  /**
   * One-to-many relationship with ClientHardwareAssignment
   * A service scope can have multiple hardware assignments
   */
  @OneToMany(() => ClientHardwareAssignment, (assignment) => assignment.serviceScope)
  hardwareAssignments: ClientHardwareAssignment[];

  /**
   * Virtual property to get total value (price * quantity)
   */
  get totalValue(): number | null {
    if (this.price && this.quantity) {
      return this.price * this.quantity;
    }
    return this.price;
  }

  /**
   * Virtual property to get display name
   */
  get displayName(): string {
    const serviceName = this.service?.name || 'Unknown Service';
    const quantityText = this.quantity && this.unit 
      ? ` (${this.quantity} ${this.unit})`
      : this.quantity 
        ? ` (${this.quantity})`
        : '';
    return `${serviceName}${quantityText}`;
  }

  /**
   * Virtual property to check if SAF is completed
   */
  get isSAFCompleted(): boolean {
    return this.safStatus === SAFStatus.COMPLETED;
  }

  /**
   * Virtual property to check if SAF is active/in progress
   */
  get isSAFActive(): boolean {
    const activeStatuses = [
      SAFStatus.ACTIVATED,
      SAFStatus.IN_PROGRESS,
      SAFStatus.SIGNED_BY_CLIENT,
    ];
    return activeStatuses.includes(this.safStatus);
  }

  /**
   * Virtual property to get service duration in days (if SAF dates are set)
   */
  get serviceDurationInDays(): number | null {
    if (!this.safServiceStartDate || !this.safServiceEndDate) return null;
    const timeDiff = this.safServiceEndDate.getTime() - this.safServiceStartDate.getTime();
    return Math.ceil(timeDiff / (1000 * 3600 * 24));
  }

  /**
   * Helper method to get a specific scope detail
   */
  getScopeDetail(key: string): any {
    return this.scopeDetails?.[key] || null;
  }

  /**
   * Helper method to set a specific scope detail
   */
  setScopeDetail(key: string, value: any): void {
    if (!this.scopeDetails) {
      this.scopeDetails = {};
    }
    this.scopeDetails[key] = value;
  }

  /**
   * Helper method to check if scope has specific detail
   */
  hasScopeDetail(key: string): boolean {
    return this.scopeDetails && key in this.scopeDetails;
  }
} 