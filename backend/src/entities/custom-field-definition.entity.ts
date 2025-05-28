import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
  OneToMany,
} from 'typeorm';
import { CustomFieldEntityType, CustomFieldType } from '../enums';
import { CustomFieldValue } from './custom-field-value.entity';

/**
 * Custom Field Definition Entity
 * Stores metadata for admin-defined custom fields that can be attached to various entities
 */
@Entity('custom_field_definitions')
@Index(['entityType', 'name'], { unique: true })
@Index(['entityType', 'displayOrder'])
@Index(['entityType', 'isActive'])
export class CustomFieldDefinition {
  /**
   * Primary key using UUID for scalability and security
   */
  @PrimaryGeneratedColumn('uuid')
  id: string;

  /**
   * Entity type that this custom field applies to
   * Indexed for efficient querying by entity type
   */
  @Column({
    type: 'enum',
    enum: CustomFieldEntityType,
    nullable: false,
  })
  @Index()
  entityType: CustomFieldEntityType;

  /**
   * Machine-readable field name (e.g., 'internal_risk_score', 'client_sla_tier')
   * Must be unique per entityType for programmatic access
   */
  @Column({ type: 'varchar', length: 100, nullable: false })
  name: string;

  /**
   * Human-readable field label (e.g., 'Internal Risk Score', 'Client SLA Tier')
   * Displayed in forms and UI
   */
  @Column({ type: 'varchar', length: 200, nullable: false })
  label: string;

  /**
   * Data type of the custom field
   */
  @Column({
    type: 'enum',
    enum: CustomFieldType,
    nullable: false,
  })
  fieldType: CustomFieldType;

  /**
   * Options for select/multi-select fields
   * Stored as JSON array for flexibility
   */
  @Column({ type: 'jsonb', nullable: true })
  selectOptions: string[] | null;

  /**
   * Whether this field is required when creating/updating the entity
   */
  @Column({ type: 'boolean', default: false })
  isRequired: boolean;

  /**
   * Display order for organizing fields in forms
   * Lower numbers appear first
   */
  @Column({ type: 'integer', default: 0 })
  displayOrder: number;

  /**
   * Placeholder text for form inputs
   */
  @Column({ type: 'varchar', length: 255, nullable: true })
  placeholderText: string | null;

  /**
   * Help text for tooltips or field descriptions
   */
  @Column({ type: 'text', nullable: true })
  helpText: string | null;

  /**
   * Validation rules stored as JSON
   * Can include min/max values, regex patterns, etc.
   */
  @Column({ type: 'jsonb', nullable: true })
  validationRules: Record<string, any> | null;

  /**
   * Default value for the field
   * Stored as JSON to accommodate different data types
   */
  @Column({ type: 'jsonb', nullable: true })
  defaultValue: any | null;

  /**
   * Whether this field definition is active
   * Allows soft deletion without losing historical data
   */
  @Column({ type: 'boolean', default: true })
  @Index()
  isActive: boolean;

  /**
   * Timestamp when the field definition was created
   */
  @CreateDateColumn({
    type: 'timestamp',
    default: () => 'CURRENT_TIMESTAMP(6)',
  })
  createdAt: Date;

  /**
   * Timestamp when the field definition was last updated
   */
  @UpdateDateColumn({
    type: 'timestamp',
    default: () => 'CURRENT_TIMESTAMP(6)',
    onUpdate: 'CURRENT_TIMESTAMP(6)',
  })
  updatedAt: Date;

  /**
   * One-to-many relationship with CustomFieldValue
   * A field definition can have many values across different entity instances
   */
  @OneToMany(() => CustomFieldValue, (value) => value.fieldDefinition)
  values: CustomFieldValue[];

  /**
   * Virtual property to check if field has select options
   */
  get hasSelectOptions(): boolean {
    return this.fieldType === CustomFieldType.SELECT_SINGLE_DROPDOWN ||
           this.fieldType === CustomFieldType.SELECT_MULTI_CHECKBOX;
  }

  /**
   * Virtual property to check if field is numeric
   */
  get isNumeric(): boolean {
    return this.fieldType === CustomFieldType.NUMBER_INTEGER ||
           this.fieldType === CustomFieldType.NUMBER_DECIMAL ||
           this.fieldType === CustomFieldType.CURRENCY ||
           this.fieldType === CustomFieldType.PERCENTAGE;
  }

  /**
   * Virtual property to check if field is date/time related
   */
  get isDateTime(): boolean {
    return this.fieldType === CustomFieldType.DATE ||
           this.fieldType === CustomFieldType.DATETIME ||
           this.fieldType === CustomFieldType.TIME;
  }
} 