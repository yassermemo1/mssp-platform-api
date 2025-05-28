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
import { HardwareAssignmentStatus } from '../enums';
import { HardwareAsset } from './hardware-asset.entity';
import { Client } from './client.entity';
import { ServiceScope } from './service-scope.entity';

/**
 * ClientHardwareAssignment Entity
 * Represents the assignment of hardware assets to clients
 * Tracks assignment details, status, and links to specific service scopes
 */
@Entity('client_hardware_assignments')
@Index(['hardwareAssetId'])
@Index(['clientId'])
@Index(['serviceScopeId'])
@Index(['status'])
@Index(['assignmentDate'])
@Index(['returnDate'])
export class ClientHardwareAssignment {
  /**
   * Primary key using UUID for scalability and security
   */
  @PrimaryGeneratedColumn('uuid')
  id: string;

  /**
   * Date when the hardware was assigned to the client
   */
  @Column({ type: 'date', nullable: false })
  assignmentDate: Date;

  /**
   * Current status of the hardware assignment
   */
  @Column({
    type: 'enum',
    enum: HardwareAssignmentStatus,
    nullable: false,
    default: HardwareAssignmentStatus.ACTIVE,
  })
  status: HardwareAssignmentStatus;

  /**
   * Date when the hardware was returned (optional)
   * Set when status changes to RETURNED, REPLACED, etc.
   */
  @Column({ type: 'date', nullable: true })
  returnDate: Date | null;

  /**
   * Additional notes about the assignment (optional)
   */
  @Column({ type: 'text', nullable: true })
  notes: string | null;

  /**
   * Foreign key to HardwareAsset
   */
  @Column({ type: 'uuid', nullable: false })
  hardwareAssetId: string;

  /**
   * Foreign key to Client
   */
  @Column({ type: 'uuid', nullable: false })
  clientId: string;

  /**
   * Foreign key to ServiceScope (optional)
   * Links the hardware assignment to a specific contracted service
   */
  @Column({ type: 'uuid', nullable: true })
  serviceScopeId: string | null;

  /**
   * Timestamp when the assignment was created
   */
  @CreateDateColumn({
    type: 'timestamp',
    default: () => 'CURRENT_TIMESTAMP(6)',
  })
  createdAt: Date;

  /**
   * Timestamp when the assignment was last updated
   */
  @UpdateDateColumn({
    type: 'timestamp',
    default: () => 'CURRENT_TIMESTAMP(6)',
    onUpdate: 'CURRENT_TIMESTAMP(6)',
  })
  updatedAt: Date;

  /**
   * Many-to-one relationship with HardwareAsset
   * An assignment belongs to one hardware asset
   */
  @ManyToOne(() => HardwareAsset, (hardwareAsset) => hardwareAsset.assignments, {
    nullable: false,
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'hardwareAssetId' })
  hardwareAsset: HardwareAsset;

  /**
   * Many-to-one relationship with Client
   * An assignment belongs to one client
   */
  @ManyToOne(() => Client, (client) => client.hardwareAssignments, {
    nullable: false,
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'clientId' })
  client: Client;

  /**
   * Many-to-one relationship with ServiceScope (optional)
   * An assignment can be linked to a specific service scope
   */
  @ManyToOne(() => ServiceScope, (serviceScope) => serviceScope.hardwareAssignments, {
    nullable: true,
    onDelete: 'SET NULL',
  })
  @JoinColumn({ name: 'serviceScopeId' })
  serviceScope: ServiceScope | null;

  /**
   * Virtual property to check if assignment is currently active
   */
  get isActive(): boolean {
    return this.status === HardwareAssignmentStatus.ACTIVE;
  }

  /**
   * Virtual property to check if assignment is completed (returned/replaced)
   */
  get isCompleted(): boolean {
    return [
      HardwareAssignmentStatus.RETURNED,
      HardwareAssignmentStatus.REPLACED,
    ].includes(this.status);
  }

  /**
   * Virtual property to get assignment duration in days
   */
  get assignmentDurationInDays(): number | null {
    const endDate = this.returnDate || new Date();
    const startDate = new Date(this.assignmentDate);
    const diffTime = endDate.getTime() - startDate.getTime();
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  }

  /**
   * Virtual property to get display name
   */
  get displayName(): string {
    const assetTag = this.hardwareAsset?.assetTag || 'Unknown Asset';
    const clientName = this.client?.companyName || 'Unknown Client';
    return `${assetTag} → ${clientName}`;
  }
} 