import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';
import { UserRole } from '../enums/user-role.enum';

/**
 * User Entity
 * Represents internal MSSP team members who use the platform
 */
@Entity('users')
@Index(['email'], { unique: true })
export class User {
  /**
   * Primary key using UUID for scalability and security
   */
  @PrimaryGeneratedColumn('uuid')
  id: string;

  /**
   * User's first name
   */
  @Column({ type: 'varchar', length: 100, nullable: false })
  firstName: string;

  /**
   * User's last name
   */
  @Column({ type: 'varchar', length: 100, nullable: false })
  lastName: string;

  /**
   * User's email address - must be unique
   */
  @Column({ type: 'varchar', length: 255, nullable: false, unique: true })
  email: string;

  /**
   * User's hashed password
   */
  @Column({ type: 'varchar', length: 255, nullable: false })
  password: string;

  /**
   * User's role in the organization
   */
  @Column({
    type: 'enum',
    enum: UserRole,
    nullable: false,
  })
  role: UserRole;

  /**
   * Whether the user account is active
   */
  @Column({ type: 'boolean', default: true })
  isActive: boolean;

  /**
   * Timestamp when the user was created
   */
  @CreateDateColumn({
    type: 'timestamp',
    default: () => 'CURRENT_TIMESTAMP(6)',
  })
  createdAt: Date;

  /**
   * Timestamp when the user was last updated
   */
  @UpdateDateColumn({
    type: 'timestamp',
    default: () => 'CURRENT_TIMESTAMP(6)',
    onUpdate: 'CURRENT_TIMESTAMP(6)',
  })
  updatedAt: Date;

  /**
   * Virtual property to get full name
   */
  get fullName(): string {
    return `${this.firstName} ${this.lastName}`;
  }
} 