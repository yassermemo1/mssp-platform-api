import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
  Index,
  Unique,
} from 'typeorm';
import { ClientAssignmentRole } from '../../../enums';
import { User } from '../../../entities/user.entity';
import { Client } from '../../../entities/client.entity';

/**
 * ClientTeamAssignment Entity
 * Establishes many-to-many relationships between Users (internal team) and Clients
 * Tracks specific roles and responsibilities for team members assigned to clients
 * Supports role-based access control and responsibility tracking
 */
@Entity('client_team_assignments')
@Index(['userId'])
@Index(['clientId'])
@Index(['assignmentRole'])
@Index(['assignmentDate'])
@Index(['createdAt'])
@Unique('UQ_user_client_role', ['userId', 'clientId', 'assignmentRole'])
export class ClientTeamAssignment {
  /**
   * Primary key using UUID for scalability and security
   */
  @PrimaryGeneratedColumn('uuid')
  id: string;

  /**
   * Role of the user for this specific client assignment
   * Defines the responsibilities and access level for this assignment
   */
  @Column({
    type: 'enum',
    enum: ClientAssignmentRole,
    nullable: false,
  })
  assignmentRole: ClientAssignmentRole;

  /**
   * Date when the assignment was made (optional)
   * Defaults to current date when assignment is created
   */
  @Column({ type: 'date', nullable: true, default: () => 'CURRENT_DATE' })
  assignmentDate: Date | null;

  /**
   * End date for the assignment (optional)
   * Used for temporary assignments or when assignment is terminated
   */
  @Column({ type: 'date', nullable: true })
  endDate: Date | null;

  /**
   * Whether the assignment is currently active
   * Allows for soft deletion and historical tracking
   */
  @Column({ type: 'boolean', default: true })
  isActive: boolean;

  /**
   * Additional notes or comments about the assignment (optional)
   * Can include special responsibilities, contact preferences, or assignment context
   */
  @Column({ type: 'text', nullable: true })
  notes: string | null;

  /**
   * Priority level for this assignment (optional)
   * Useful when a user has multiple roles for the same client
   * Higher numbers indicate higher priority (1 = highest priority)
   */
  @Column({ type: 'integer', nullable: true })
  priority: number | null;

  /**
   * Foreign key to User
   * The internal team member being assigned to the client
   */
  @Column({ type: 'uuid', nullable: false })
  userId: string;

  /**
   * Foreign key to Client
   * The client to whom the user is being assigned
   */
  @Column({ type: 'uuid', nullable: false })
  clientId: string;

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
   * Many-to-one relationship with User
   * An assignment belongs to one specific user
   */
  @ManyToOne(() => User, { nullable: false, onDelete: 'CASCADE' })
  @JoinColumn({ name: 'userId' })
  user: User;

  /**
   * Many-to-one relationship with Client
   * An assignment belongs to one specific client
   */
  @ManyToOne(() => Client, { nullable: false, onDelete: 'CASCADE' })
  @JoinColumn({ name: 'clientId' })
  client: Client;

  /**
   * Virtual property to check if assignment is currently active and not expired
   */
  get isCurrentlyActive(): boolean {
    if (!this.isActive) return false;
    if (!this.endDate) return true;
    return new Date() <= this.endDate;
  }

  /**
   * Virtual property to check if assignment is expired
   */
  get isExpired(): boolean {
    if (!this.endDate) return false;
    return new Date() > this.endDate;
  }

  /**
   * Virtual property to get assignment duration in days (if ended)
   */
  get assignmentDurationDays(): number | null {
    if (!this.assignmentDate) return null;
    const endDate = this.endDate || new Date();
    const diffTime = Math.abs(endDate.getTime() - this.assignmentDate.getTime());
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  }

  /**
   * Virtual property to get display name for the assignment
   */
  get displayName(): string {
    const roleDisplay = this.assignmentRole.replace(/_/g, ' ').toLowerCase();
    return `${roleDisplay} assignment`;
  }

  /**
   * Virtual property to get formatted role name
   */
  get formattedRole(): string {
    return this.assignmentRole.replace(/_/g, ' ').toLowerCase().replace(/\b\w/g, l => l.toUpperCase());
  }
} 