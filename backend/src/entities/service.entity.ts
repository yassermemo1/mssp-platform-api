import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
  OneToMany,
} from 'typeorm';
import { ServiceCategory, ServiceDeliveryModel } from '../enums';
import { ServiceScope } from './service-scope.entity';

/**
 * Interface for scope definition template structure
 * Defines the schema for dynamic form fields in service scopes
 */
export interface ScopeDefinitionField {
  name: string;
  label: string;
  type: 'string' | 'number' | 'boolean' | 'select' | 'textarea' | 'date' | 'email' | 'url';
  required?: boolean;
  options?: string[]; // For select type
  min?: number; // For number type
  max?: number; // For number type
  minLength?: number; // For string/textarea type
  maxLength?: number; // For string/textarea type
  placeholder?: string;
  description?: string;
  default?: any;
}

export interface ScopeDefinitionTemplate {
  fields: ScopeDefinitionField[];
  version?: string; // For template versioning
  description?: string; // Template description
}

/**
 * Service Entity
 * Represents the comprehensive catalog of services offered by the MSSP
 * This is a master catalog that can be referenced in contracts
 * Supports various delivery models and detailed categorization
 */
@Entity('services')
@Index(['name'], { unique: true })
@Index(['category'])
@Index(['deliveryModel'])
@Index(['isActive'])
export class Service {
  /**
   * Primary key using UUID for scalability and security
   */
  @PrimaryGeneratedColumn('uuid')
  id: string;

  /**
   * Service name - must be unique across the entire catalog
   * Examples: "Managed EDR", "SIEM Monitoring", "Penetration Testing"
   */
  @Column({ type: 'varchar', length: 255, nullable: false, unique: true })
  name: string;

  /**
   * Detailed description of the service (optional)
   * Can include service overview, what's included, deliverables, etc.
   */
  @Column({ type: 'text', nullable: true })
  description: string | null;

  /**
   * Service category for organization and filtering
   * Using comprehensive enum for proper classification
   */
  @Column({
    type: 'enum',
    enum: ServiceCategory,
    nullable: false,
  })
  category: ServiceCategory;

  /**
   * Service delivery model - how the service is delivered to clients
   * Critical for operational planning and resource allocation
   */
  @Column({
    type: 'enum',
    enum: ServiceDeliveryModel,
    nullable: false,
  })
  deliveryModel: ServiceDeliveryModel;

  /**
   * Base price or starting price for this service (optional)
   * Actual pricing will be defined in ServiceScope for each contract
   * Using DECIMAL(12,2) for financial precision
   */
  @Column({ type: 'decimal', precision: 12, scale: 2, nullable: true })
  basePrice: number | null;

  /**
   * Whether this service is currently active in the catalog
   * Allows deactivation without deletion for historical data integrity
   */
  @Column({ type: 'boolean', nullable: false, default: true })
  isActive: boolean;

  /**
   * Timestamp when the service was created
   */
  @CreateDateColumn({
    type: 'timestamp',
    default: () => 'CURRENT_TIMESTAMP(6)',
  })
  createdAt: Date;

  /**
   * Timestamp when the service was last updated
   */
  @UpdateDateColumn({
    type: 'timestamp',
    default: () => 'CURRENT_TIMESTAMP(6)',
    onUpdate: 'CURRENT_TIMESTAMP(6)',
  })
  updatedAt: Date;

  /**
   * One-to-many relationship with ServiceScope
   * A service can be included in multiple contracts with different scopes
   */
  @OneToMany(() => ServiceScope, (serviceScope) => serviceScope.service)
  serviceScopes: ServiceScope[];

  /**
   * Scope definition template - defines the structure for service scope details
   * This JSONB field stores the template that defines what fields, types, and options
   * are available when configuring the scope of this service in a contract
   * 
   * Example structure for "Managed EDR" service:
   * {
   *   "fields": [
   *     {
   *       "name": "edr_platform",
   *       "label": "EDR Platform",
   *       "type": "select",
   *       "options": ["CarbonBlack", "Metras", "Rakeen"],
   *       "required": true,
   *       "description": "Select the EDR platform to be used."
   *     },
   *     {
   *       "name": "endpoint_count",
   *       "label": "Endpoint Count",
   *       "type": "number",
   *       "required": true,
   *       "min": 1,
   *       "placeholder": "Enter number of endpoints"
   *     },
   *     {
   *       "name": "log_retention_days",
   *       "label": "Log Retention (days)",
   *       "type": "number",
   *       "required": false,
   *       "default": 30
   *     }
   *   ],
   *   "version": "1.0",
   *   "description": "Template for Managed EDR service scope configuration"
   * }
   */
  @Column({ type: 'jsonb', nullable: true })
  scopeDefinitionTemplate: ScopeDefinitionTemplate | null;

  /**
   * Virtual property to get display name with category and delivery model
   */
  get displayName(): string {
    const categoryDisplay = this.category.replace(/_/g, ' ').toUpperCase();
    const deliveryDisplay = this.deliveryModel.replace(/_/g, ' ').toUpperCase();
    return `${this.name} (${categoryDisplay} - ${deliveryDisplay})`;
  }

  /**
   * Virtual property to check if service has active scopes
   */
  get hasActiveScopes(): boolean {
    return this.serviceScopes?.some(scope => scope.isActive) || false;
  }
} 