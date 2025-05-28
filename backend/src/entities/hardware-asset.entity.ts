import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
  OneToMany,
} from 'typeorm';
import { HardwareAssetType, HardwareAssetStatus } from '../enums';
import { ClientHardwareAssignment } from './client-hardware-assignment.entity';

/**
 * HardwareAsset Entity
 * Represents hardware inventory items managed by the MSSP
 * Tracks asset details, status, and lifecycle information
 */
@Entity('hardware_assets')
@Index(['assetTag'], { unique: true })
@Index(['serialNumber'], { unique: true, where: 'serial_number IS NOT NULL' })
@Index(['assetType'])
@Index(['status'])
@Index(['location'])
export class HardwareAsset {
  /**
   * Primary key using UUID for scalability and security
   */
  @PrimaryGeneratedColumn('uuid')
  id: string;

  /**
   * Unique asset tag for identification
   * Required for all assets
   */
  @Column({ type: 'varchar', length: 100, nullable: false, unique: true })
  assetTag: string;

  /**
   * Serial number of the hardware (optional but unique if provided)
   */
  @Column({ type: 'varchar', length: 255, nullable: true, unique: true })
  serialNumber: string | null;

  /**
   * Device name or model name (optional)
   */
  @Column({ type: 'varchar', length: 255, nullable: true })
  deviceName: string | null;

  /**
   * Manufacturer of the hardware (optional)
   */
  @Column({ type: 'varchar', length: 100, nullable: true })
  manufacturer: string | null;

  /**
   * Model number or name (optional)
   */
  @Column({ type: 'varchar', length: 100, nullable: true })
  model: string | null;

  /**
   * Type of hardware asset
   */
  @Column({
    type: 'enum',
    enum: HardwareAssetType,
    nullable: false,
  })
  assetType: HardwareAssetType;

  /**
   * Current status of the hardware asset
   */
  @Column({
    type: 'enum',
    enum: HardwareAssetStatus,
    nullable: false,
    default: HardwareAssetStatus.IN_STOCK,
  })
  status: HardwareAssetStatus;

  /**
   * Date when the hardware was purchased (optional)
   */
  @Column({ type: 'date', nullable: true })
  purchaseDate: Date | null;

  /**
   * Purchase cost of the hardware (optional)
   * Using decimal with high precision for financial accuracy
   */
  @Column({ type: 'decimal', precision: 12, scale: 2, nullable: true })
  purchaseCost: number | null;

  /**
   * Warranty expiry date (optional)
   */
  @Column({ type: 'date', nullable: true })
  warrantyExpiryDate: Date | null;

  /**
   * Current physical location of the hardware (optional)
   */
  @Column({ type: 'varchar', length: 255, nullable: true })
  location: string | null;

  /**
   * Additional notes about the hardware asset (optional)
   */
  @Column({ type: 'text', nullable: true })
  notes: string | null;

  /**
   * Timestamp when the hardware asset was created
   */
  @CreateDateColumn({
    type: 'timestamp',
    default: () => 'CURRENT_TIMESTAMP(6)',
  })
  createdAt: Date;

  /**
   * Timestamp when the hardware asset was last updated
   */
  @UpdateDateColumn({
    type: 'timestamp',
    default: () => 'CURRENT_TIMESTAMP(6)',
    onUpdate: 'CURRENT_TIMESTAMP(6)',
  })
  updatedAt: Date;

  /**
   * One-to-many relationship with ClientHardwareAssignment
   * A hardware asset can have multiple assignment records (history)
   */
  @OneToMany(() => ClientHardwareAssignment, (assignment) => assignment.hardwareAsset)
  assignments: ClientHardwareAssignment[];

  /**
   * Virtual property to check if asset is available for assignment
   */
  get isAvailable(): boolean {
    return [
      HardwareAssetStatus.IN_STOCK,
      HardwareAssetStatus.AWAITING_DEPLOYMENT,
    ].includes(this.status);
  }

  /**
   * Virtual property to check if asset is currently in use
   */
  get isInUse(): boolean {
    return this.status === HardwareAssetStatus.IN_USE;
  }

  /**
   * Virtual property to check if asset is retired or disposed
   */
  get isRetired(): boolean {
    return [
      HardwareAssetStatus.RETIRED,
      HardwareAssetStatus.DISPOSED,
    ].includes(this.status);
  }

  /**
   * Virtual property to get display name
   */
  get displayName(): string {
    const parts = [this.assetTag];
    if (this.deviceName) parts.push(this.deviceName);
    if (this.manufacturer && this.model) {
      parts.push(`${this.manufacturer} ${this.model}`);
    } else if (this.manufacturer) {
      parts.push(this.manufacturer);
    } else if (this.model) {
      parts.push(this.model);
    }
    return parts.join(' - ');
  }

  /**
   * Virtual property to check if warranty is still valid
   */
  get isUnderWarranty(): boolean {
    if (!this.warrantyExpiryDate) return false;
    return new Date() <= this.warrantyExpiryDate;
  }
} 