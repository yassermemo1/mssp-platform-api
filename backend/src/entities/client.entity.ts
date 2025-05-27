import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';
import { ClientStatus } from '../enums/client-status.enum';

/**
 * Client Entity
 * Represents MSSP clients (businesses being managed)
 */
@Entity('clients')
@Index(['companyName'], { unique: true })
export class Client {
  /**
   * Primary key using UUID for scalability and security
   */
  @PrimaryGeneratedColumn('uuid')
  id: string;

  /**
   * Company name - must be unique
   */
  @Column({ type: 'varchar', length: 255, nullable: false, unique: true })
  companyName: string;

  /**
   * Primary contact person's name
   */
  @Column({ type: 'varchar', length: 100, nullable: false })
  contactName: string;

  /**
   * Primary contact person's email
   */
  @Column({ type: 'varchar', length: 255, nullable: false })
  contactEmail: string;

  /**
   * Primary contact person's phone number (optional)
   */
  @Column({ type: 'varchar', length: 50, nullable: true })
  contactPhone: string | null;

  /**
   * Company address (optional)
   */
  @Column({ type: 'text', nullable: true })
  address: string | null;

  /**
   * Industry sector (optional)
   */
  @Column({ type: 'varchar', length: 100, nullable: true })
  industry: string | null;

  /**
   * Current status of the client relationship
   */
  @Column({
    type: 'enum',
    enum: ClientStatus,
    nullable: false,
    default: ClientStatus.PROSPECT,
  })
  status: ClientStatus;

  /**
   * Timestamp when the client was created
   */
  @CreateDateColumn({
    type: 'timestamp',
    default: () => 'CURRENT_TIMESTAMP(6)',
  })
  createdAt: Date;

  /**
   * Timestamp when the client was last updated
   */
  @UpdateDateColumn({
    type: 'timestamp',
    default: () => 'CURRENT_TIMESTAMP(6)',
    onUpdate: 'CURRENT_TIMESTAMP(6)',
  })
  updatedAt: Date;

  /**
   * Virtual property to check if client is active
   */
  get isActive(): boolean {
    return this.status === ClientStatus.ACTIVE || this.status === ClientStatus.RENEWED;
  }

  /**
   * Virtual property to get display name
   */
  get displayName(): string {
    return `${this.companyName} (${this.contactName})`;
  }
} 